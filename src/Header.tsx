import { useStore } from "../store";

export function Header() {
  const s = useStore(st => st.snap!);
  const pnl = s.daily_pnl + (s.broker_mtm || 0);
  const color = pnl >= 0 ? "text-emerald-400" : "text-red-400";

  const send = (key:string) =>
    fetch("/api/command", { method:"POST",
      headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ key }) });

  return (
    <div className="h-10 px-3 flex items-center gap-4 border-b border-gray-800 bg-[#111] text-xs">
      <span className="font-bold">NSE Trading</span>
      <span className={`px-2 py-0.5 rounded ${s.mode==="LIVE"?"bg-emerald-900":"bg-amber-900"}`}>
        {s.mode}
      </span>
      <span className={s.mtf ? "text-emerald-400" : "text-red-400"}>
        MTF {s.mtf ? "ON" : "OFF"}
      </span>
      <span className={s.entries_enabled ? "text-emerald-400" : "text-red-400"}>
        Entries {s.entries_enabled ? "ON" : "OFF"}
      </span>
      <span className="text-gray-500">|</span>
      <span>PnL: <b className={color}>₹{pnl.toFixed(0)}</b></span>
      <span className="text-gray-500">realized ₹{s.daily_pnl.toFixed(0)}</span>
      <span className="text-gray-500">trades {s.trades_today}</span>
      <span className="text-gray-500">sharpe {s.health.live_sharpe ?? "—"}</span>
      <div className="ml-auto flex gap-2">
        {(["p","t","e","m","q"] as const).map(k => (
          <button key={k} onClick={()=>send(k)}
                  className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700">
            {k.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}