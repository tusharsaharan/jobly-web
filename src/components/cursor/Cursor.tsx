import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * A soft mint wash that drifts behind the cursor. Native cursor stays visible.
 * - Respects prefers-reduced-motion
 * - Respects coarse pointers (touch devices)
 * - Mount only where it's wanted via the `enabled` prop
 */
export function Cursor({ enabled = false }: { enabled?: boolean }) {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { damping: 40, stiffness: 90, mass: 0.9 });
  const sy = useSpring(y, { damping: 40, stiffness: 90, mass: 0.9 });
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !fine) return;
    setActive(true);

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = (e.target as HTMLElement | null)?.closest?.(
        "a, button, input, textarea, select, [role='button'], [data-cursor]"
      );
      setHover(Boolean(el));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, x, y]);

  if (!active) return null;

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
