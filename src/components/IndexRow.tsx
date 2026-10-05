import { IndexData } from "../store";
import { ChartPanel } from "./ChartPanel";
import { OptionChainPanel } from "./OptionChainPanel";
import { PositionsPanel } from "./PositionsPanel";

export function IndexRow({ name, data }: { name:string; data?:IndexData }) {
  if (!data) return <div className="bg-[#111] rounded flex items-center justify-center text-gray-600">{name} — no data</div>;
  return (
    <div className="grid grid-cols-3 gap-1 min-h-0">
      <div className="bg-[#111] rounded overflow-hidden flex flex-col">
        <div className="px-2 py-1 text-xs font-bold flex justify-between border-b border-gray-800">
          <span>{name}</span>
          <span className={data.trend==="BULLISH"?"text-emerald-400":"text-red-400"}>
            {data.spot.toFixed(2)} · {data.trend} · HTF {data.htf}
          </span>
        </div>
        <ChartPanel name={name} candles={data.candles} ema={data.ema} spot={data.spot} />
      </div>

      <div className="bg-[#111] rounded overflow-hidden flex flex-col">
        <div className="px-2 py-1 text-xs font-bold border-b border-gray-800">
          {name} Option Chain · <span className="text-gray-400">{data.expiry}</span>
          {" "}<span className="text-gray-500">step {data.step}</span>
        </div>
        <OptionChainPanel chain={data.chain} spot={data.spot} />
      </div>

      <div className="bg-[#111] rounded overflow-hidden flex flex-col">
        <div className="px-2 py-1 text-xs font-bold border-b border-gray-800">
          Positions &amp; P/L
        </div>
        <PositionsPanel positions={data.positions} />
      </div>
    </div>
  );
}