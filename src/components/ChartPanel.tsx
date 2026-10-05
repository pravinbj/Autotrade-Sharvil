import { useEffect, useRef } from "react";
import {
  createChart, ColorType, CrosshairMode,
  CandlestickSeries, LineSeries,
} from "lightweight-charts";
import { Candle } from "../store";

export function ChartPanel({ name, candles, ema }:{
  name:string; candles:Candle[]; ema:number; spot:number
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const emaRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background:{ type:ColorType.Solid, color:"#111" }, textColor:"#9ca3af", fontSize:10 },
      grid: { vertLines:{ color:"#1f2937" }, horzLines:{ color:"#1f2937" } },
      rightPriceScale: { borderColor:"#1f2937" },
      timeScale: { borderColor:"#1f2937", timeVisible:true, secondsVisible:false },
      crosshair: { mode: CrosshairMode.Normal },
      watermark: {
        visible:true, fontSize:42, horzAlign:"center", vertAlign:"center",
        color:"rgba(255,255,255,0.04)", text:name,
      },
    });
    const cs = chart.addSeries(CandlestickSeries, {
      upColor:"#26a69a", downColor:"#ef5350",
      wickUpColor:"#26a69a", wickDownColor:"#ef5350",
      borderVisible:false,
    });
    const emaLine = chart.addSeries(LineSeries, {
      color:"#fbbf24", lineWidth:1, priceLineVisible:false, lastValueVisible:false,
    });
    chartRef.current = chart; seriesRef.current = cs; emaRef.current = emaLine;
    return () => chart.remove();
  }, [name]);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    seriesRef.current.setData(candles.map(c => ({
      time: c.time as any, open:c.open, high:c.high, low:c.low, close:c.close,
    })));
    emaRef.current.setData(candles.filter(c=>c.ema>0)
      .map(c => ({ time:c.time as any, value:c.ema })));
    chartRef.current.timeScale().fitContent();
  }, [candles]);

  return <div ref={ref} className="flex-1 min-h-0" />;
}