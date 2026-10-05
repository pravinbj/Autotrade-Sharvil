// src/api.ts
/**
 * Typed API client for the NSE trading dashboard.
 * Pairs with the Flask blueprint in web_dashboard.py
 *   GET  /api/snapshot   -> Snapshot
 *   POST /api/command    -> { ok: boolean }
 */

// ---------------------------------------------------------------------------
// Types — mirror the JSON emitted by web_dashboard.py::_snapshot()
// ---------------------------------------------------------------------------

export type Trend = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Side = "B" | "S";
export type OptType = "C" | "P";
export type Mode = "PAPER" | "LIVE";
export type CommandKey = "p" | "t" | "e" | "m" | "q";

export interface Candle {
  time: number;   // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema: number;    // EMA(period) at this bar; 0 while warming up
}

export interface Option {
  symbol: string;
  strike: number;
  expiry: string;          // "26OCT26" or ""
  ltp: number;
  oi: number;
  volume: number;
  bid: number;
  ask: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  iv: number;              // fraction (0.25 = 25%)
  is_atm: boolean;
}

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  entry: number;
  ltp: number;
  sl: number;
  tp: number;
  trail_sl: number;
  trailing_active: boolean;
  pnl: number;
  entry_delta: number;
  reason: string;
}

export interface OptionChain {
  C: Option[];
  P: Option[];
}

export interface IndexData {
  spot: number;
  ema: number;
  trend: Trend;
  htf: Trend;
  signal: string | null;   // "BUY_CALL" | "BUY_PUT" | null
  expiry: string;
  step: number;            // strike step (50 for NIFTY, 100 for BN/SENSEX)
  candles: Candle[];
  chain: OptionChain;
  positions: Position[];
}

export interface Health {
  action: "CONTINUE" | "HALT";
  live_sharpe?: number;
  dd?: number;
  reason?: string;
}

export interface Snapshot {
  ts: number;
  mode: Mode;
  mtf: boolean;
  entries_enabled: boolean;
  daily_pnl: number;
  broker_mtm: number;
  trades_today: number;
  health: Health;
  indices: Record<string, IndexData>;   // keys: NIFTY, BANKNIFTY, SENSEX
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "";

/** Default fetch timeout (ms). Snapshot should never take longer than this. */
const DEFAULT_TIMEOUT = 8000;

/** Backoff schedule for retries on transient failures (ms). */
const RETRY_DELAYS = [250, 750, 2000];

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    public url: string,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} for ${url}`);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Low-level fetch with timeout + AbortController
// ---------------------------------------------------------------------------

async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  // If caller passed their own signal, honour it.
  if (init.signal) {
    init.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (e: any) {
    clearTimeout(timer);
    // AbortError / TypeError (network) both bubble up as ApiError.
    throw new ApiError(0, url, e?.message ?? "network error");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new ApiError(res.status, url, txt || res.statusText);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Retry helper — only for idempotent GETs
// ---------------------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  delays = RETRY_DELAYS,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      // Do not retry 4xx — only network / 5xx.
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) throw e;
      if (i < delays.length) await sleep(delays[i]);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a full dashboard snapshot.
 * Retries on transient failures; safe to poll at 1 Hz.
 */
export async function getSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  return withRetry(() =>
    fetchJson<Snapshot>("/api/snapshot", { signal }, DEFAULT_TIMEOUT),
  );
}

/**
 * Send a single-character command to the running bot.
 * Same keys the stdin handler accepts: p, t, e, m, q.
 */
export async function sendCommand(
  key: CommandKey,
  signal?: AbortSignal,
): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(
    "/api/command",
    {
      method: "POST",
      body: JSON.stringify({ key }),
      signal,
    },
    5000,
  );
}

/**
 * Convenience batch sender — useful for keyboard shortcuts that toggle
 * several controls at once. Fails fast on first error.
 */
export async function sendCommands(
  keys: CommandKey[],
): Promise<Array<{ key: CommandKey; ok: boolean }>> {
  const out: Array<{ key: CommandKey; ok: boolean }> = [];
  for (const k of keys) {
    const r = await sendCommand(k);
    out.push({ key: k, ok: r.ok });
    if (!r.ok) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Derived helpers (pure — no network)
// ---------------------------------------------------------------------------

/**
 * Merge CALL and PUT arrays into strike-aligned rows. Missing sides
 * yield `undefined` in that slot, which the UI renders as empty cells.
 */
export function mergeChain(chain: OptionChain): Array<{
  strike: number;
  call?: Option;
  put?: Option;
  is_atm: boolean;
}> {
  const byC = new Map<number, Option>();
  const byP = new Map<number, Option>();
  for (const c of chain.C) byC.set(c.strike, c);
  for (const p of chain.P) byP.set(p.strike, p);

  const strikes = Array.from(new Set([...byC.keys(), ...byP.keys()])).sort(
    (a, b) => a - b,
  );

  return strikes.map((s) => ({
    strike: s,
    call: byC.get(s),
    put: byP.get(s),
    is_atm: !!(byC.get(s)?.is_atm || byP.get(s)?.is_atm),
  }));
}

/**
 * Nearest strike to spot for a given step. Returns 0 if spot <= 0.
 */
export function atmStrike(spot: number, step: number): number {
  if (spot <= 0 || step <= 0) return 0;
  return Math.round(spot / step) * step;
}

/** Sum of open-position P/L for a single index. */
export function sumPositionPnl(positions: Position[]): number {
  return positions.reduce((s, p) => s + (Number.isFinite(p.pnl) ? p.pnl : 0), 0);
}

/** Total realized + unrealized across the whole book. */
export function totalPnl(snap: Snapshot): number {
  return (
    snap.daily_pnl +
    (snap.broker_mtm || 0) +
    Object.values(snap.indices).reduce(
      (s, idx) => s + sumPositionPnl(idx.positions),
      0,
    )
  );
}

/** Pretty OI label: 1234567 -> "1.2M", 42000 -> "42k", 0 -> "-". */
export function formatOI(n: number): string {
  if (!n || n <= 0) return "-";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return String(n);
}

/** Fixed-decimal formatter that tolerates NaN/undefined. */
export function fmt(n: number | undefined, d = 2, fb = "—"): string {
  if (n === undefined || n === null || Number.isNaN(n)) return fb;
  return n.toFixed(d);
}