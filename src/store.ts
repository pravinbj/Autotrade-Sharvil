import { create } from "zustand";

export interface Candle { time:number; open:number; high:number; low:number; close:number; volume:number; ema:number }
export interface Option { symbol:string; strike:number; ltp:number; oi:number; volume:number;
                          bid:number; ask:number; delta:number; gamma:number; vega:number;
                          theta:number; iv:number; is_atm:boolean }
export interface Position { id:string; symbol:string; side:"B"|"S"; qty:number; entry:number;
                            ltp:number; sl:number; tp:number; trail_sl:number;
                            trailing_active:boolean; pnl:number; entry_delta:number; reason:string }
export interface IndexData {
  spot:number; ema:number; trend:string; htf:string; signal:string|null;
  expiry:string; step:number;
  candles:Candle[];
  chain:{ C:Option[]; P:Option[] };
  positions:Position[];
}
export interface Snapshot {
  ts:number; mode:string; mtf:boolean; entries_enabled:boolean;
  daily_pnl:number; broker_mtm:number; trades_today:number;
  health:{ action:string; live_sharpe?:number; dd?:number };
  indices:Record<string, IndexData>;
}

interface S { snap:Snapshot|null; setSnap:(s:Snapshot)=>void }
export const useStore = create<S>((set)=>({ snap:null, setSnap:(s)=>set({snap:s}) }));