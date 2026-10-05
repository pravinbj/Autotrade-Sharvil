import { Position } from "../store";

export function PositionsPanel({ positions }: { positions:Position[] }) {
  const total = positions.reduce((s,p)=>s+p.pnl, 0);
  return (
    <div className="flex-1 overflow-auto">
      {positions.length === 0 ? (
        <div className="p-4 text-xs text-gray-600">No open positions</div>
      ) : (
        <table className="w-full text-[11px] tabular-nums">
          <thead className="sticky top-0 bg-[#181818] text-gray-500">
            <tr>
              <th className="text-left px-1">Symbol</th>
              <th>Side</th><th>Qty</th>
              <th className="text-right">Entry</th><th className="text-right">LTP</th>
              <th className="text-right">SL</th><th className="text-right">TSL</th>
              <th className="text-right pr-1">PnL</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => (
              <tr key={p.id} className="border-b border-gray-900">
                <td className="px-1 truncate max-w-[10rem]">{p.symbol}</td>
                <td className={p.side==="B"?"text-emerald-400":"text-red-400"}>{p.side}</td>
                <td className="text-center">{p.qty}</td>
                <td className="text-right">{p.entry.toFixed(2)}</td>
                <td className="text-right">{p.ltp.toFixed(2)}</td>
                <td className="text-right text-red-400">{p.sl.toFixed(2)}</td>
                <td className={`text-right ${p.trailing_active?"text-amber-400":"text-gray-600"}`}>
                  {p.trail_sl.toFixed(2)}
                </td>
                <td className={`text-right pr-1 font-semibold ${p.pnl>=0?"text-emerald-400":"text-red-400"}`}>
                  {p.pnl.toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#181818]">
            <tr><td colSpan={7} className="text-right px-1">Open MTM</td>
                <td className={`text-right pr-1 font-bold ${total>=0?"text-emerald-400":"text-red-400"}`}>
                  {total.toFixed(0)}
                </td></tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}