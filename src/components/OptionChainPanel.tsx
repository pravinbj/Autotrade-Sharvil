import { Option } from "../store";

function Row({ o, side, atm }:{ o:Option; side:"C"|"P"; atm:number }) {
  const itm = side === "C" ? o.strike <= atm : o.strike >= atm;
  return (
    <tr className={`text-[11px] ${o.is_atm ? "bg-amber-900/30" : ""} ${itm ? "text-gray-400" : "text-gray-200"}`}>
      <td className="text-right pr-1">{o.ltp?.toFixed(2)}</td>
      <td className="text-right pr-1 text-gray-400">{o.oi ? (o.oi/1000).toFixed(0)+"k" : "-"}</td>
      <td className="text-right pr-1 text-gray-500">{o.delta?.toFixed(2)}</td>
      <td className="text-right pr-1 text-gray-500">{(o.iv*100)?.toFixed(0)}%</td>
      <td className="text-center font-bold text-amber-300">{o.strike}</td>
      <td className="pl-1 text-right text-gray-500">{(o.iv*100)?.toFixed(0)}%</td>
      <td className="pl-1 text-right text-gray-500">{o.delta?.toFixed(2)}</td>
      <td className="pl-1 text-right text-gray-400">{o.oi ? (o.oi/1000).toFixed(0)+"k" : "-"}</td>
      <td className="pl-1 text-right">{o.ltp?.toFixed(2)}</td>
    </tr>
  );
}

export function OptionChainPanel({ chain, spot }:{
  chain:{ C:Option[]; P:Option[] }; spot:number;
}) {
  // build a strike-wise merge
  const strikes = Array.from(new Set([
    ...chain.C.map(c=>c.strike), ...chain.P.map(p=>p.strike),
  ])).sort((a,b)=>a-b);
  const byC = Object.fromEntries(chain.C.map(c=>[c.strike,c]));
  const byP = Object.fromEntries(chain.P.map(p=>[p.strike,p]));
  const atm = strikes.length
    ? strikes.reduce((b,s)=>Math.abs(s-spot)<Math.abs(b-spot)?s:b, strikes[0]) : 0;

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full tabular-nums">
        <thead className="sticky top-0 bg-[#181818] text-[10px] text-gray-500">
          <tr>
            <th colSpan={4} className="text-center border-b border-gray-800 py-1">CALLS</th>
            <th className="border-b border-gray-800">STRIKE</th>
            <th colSpan={4} className="text-center border-b border-gray-800">PUTS</th>
          </tr>
          <tr className="text-gray-600">
            <th>LTP</th><th>OI</th><th>Δ</th><th>IV</th>
            <th></th>
            <th>IV</th><th>Δ</th><th>OI</th><th>LTP</th>
          </tr>
        </thead>
        <tbody>
          {strikes.map(s => (
            <tr key={s} className="border-b border-gray-900">
              {byC[s] ? <Row o={byC[s]} side="C" atm={atm}/> :
                        <><td/><td/><td/><td/></>}
              <td className="text-center font-bold text-amber-300 text-[11px]">{s}</td>
              {byP[s] ? <Row o={byP[s]} side="P" atm={atm}/> :
                        <><td/><td/><td/><td/></>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}