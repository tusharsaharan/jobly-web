import { useEffect, useRef, useState } from "react";

export function CountUp({
  to,
  duration = 1400,
  suffix = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useRef(false);
  const frame = useRef<number | null>(null);
  const value = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible.current = true;
            setN((current) => current);
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = Number.isFinite(to) ? to : 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || duration <= 0) {
      value.current = target;
      setN(target);
      return;
    }

    if (!visible.current) {
      value.current = target;
      setN(target);
      return;
    }

    if (frame.current) cancelAnimationFrame(frame.current);
    const startValue = value.current;
    const change = target - startValue;
    const start = performance.now();

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(startValue + change * eased);
      value.current = next;
      setN(next);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [to, duration]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}
