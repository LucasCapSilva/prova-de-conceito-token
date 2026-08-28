import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

const EASE = "cubic-bezier(0.21, 0.47, 0.32, 0.98)";

export default function Reveal({ children, delay = 0, y = 40, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "-60px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = inView
    ? { opacity: 1, transform: "translateY(0px)" }
    : { opacity: 0, transform: `translateY(${y}px)` };
  style.transition = `opacity 0.7s ${EASE}, transform 0.7s ${EASE}`;
  style.transitionDelay = `${delay}s`;

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
