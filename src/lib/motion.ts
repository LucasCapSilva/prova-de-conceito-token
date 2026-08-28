import { useEffect, useState } from "react";

type MotionLib = typeof import("framer-motion");

let pending: Promise<MotionLib> | null = null;

export function useMotion(): MotionLib | null {
  const [lib, setLib] = useState<MotionLib | null>(null);
  useEffect(() => {
    let alive = true;
    if (!pending) {
      pending = import("framer-motion");
    }
    pending.then((l) => {
      if (alive) setLib(l);
    });
    return () => {
      alive = false;
    };
  }, []);
  return lib;
}
