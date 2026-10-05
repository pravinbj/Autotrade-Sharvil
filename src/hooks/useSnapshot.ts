import { useEffect } from "react";
import { useStore } from "../store";

export function useSnapshot() {
  const setSnap = useStore(s => s.setSnap);
  useEffect(() => {
    let dead = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/snapshot");
        const j = await r.json();
        if (!dead) setSnap(j);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 1000);      // 1 Hz — plenty for paper, use 500ms for live
    return () => { dead = true; clearInterval(id); };
  }, [setSnap]);
}