import { useSnapshot } from "./hooks/useSnapshot";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { IndexRow } from "./components/IndexRow";

export default function App() {
  useSnapshot();
  const snap = useStore(s => s.snap);

  if (!snap) return <div className="p-8 text-gray-400">Connecting…</div>;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] text-gray-200">
      <Header />
      <div className="flex-1 grid grid-rows-3 gap-1 p-1 min-h-0">
        {(["NIFTY","BANKNIFTY","SENSEX"] as const).map(k => (
          <IndexRow key={k} name={k} data={snap.indices[k]} />
        ))}
      </div>
    </div>
  );
}