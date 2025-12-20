import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * A soft mint tinge that gently follows the pointer — no visible dot, just
 * a diffuse green wash over a small part of the screen. Native cursor stays
 * visible. Respects reduced-motion and coarse pointers.
 */
export function Cursor() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  // Slower, softer spring so the tinge drifts rather than snaps.
  const sx = useSpring(x, { damping: 40, stiffness: 90, mass: 0.9 });
  const sy = useSpring(y, { damping: 40, stiffness: 90, mass: 0.9 });
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !fine) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = (e.target as HTMLElement | null)?.closest?.(
        "a, button, input, textarea, select, [role='button'], [data-cursor]",
      );
      setHover(Boolean(el));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  if (!enabled) return null;

  const size = hover ? 520 : 420;
  return (
    <motion.div
      aria-hidden
      style={{ translateX: sx, translateY: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[9998] mix-blend-multiply"
    >
      <div
        className="transition-[width,height,opacity] duration-500 ease-out"
        style={{
          width: size,
          height: size,
          opacity: hover ? 0.09 : 0.065,
          transform: "translate(-50%, -50%)",
          background: "rgba(169, 235, 209, 0.48)",
          borderRadius: "999px",
          filter: "blur(34px)",
        }}
      />
    </motion.div>
  );
}
