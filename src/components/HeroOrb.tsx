import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Spline-feeling 3D-ish hero object built with SVG gradients + CSS.
 * Parallaxes to scroll and offsets to cursor — no heavy 3D library.
 */
export function HeroOrb() {
  const ref = useRef<HTMLDivElement>(null);
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const ry = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const yOff = useTransform(scrollYProgress, [0, 0.4], [0, -80]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setPt({
        x: (e.clientX - cx) / cx,
        y: (e.clientY - cy) / cy,
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ y: yOff }}
      className="pointer-events-none relative aspect-square w-full max-w-[560px] [transform-style:preserve-3d]"
    >
      {/* Outer aurora glow */}
      <div className="absolute inset-0 aurora-bg animate-float-slow" />

      {/* Rotating ring */}
      <motion.div
        style={{ rotate: ry }}
        className="absolute inset-[8%] rounded-full border border-cream/15"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[16%] rounded-full border border-cream/10"
      />

      {/* Core orb */}
      <motion.div
        style={{
          translateX: pt.x * 30,
          translateY: pt.y * 30,
        }}
        className="absolute inset-[22%] animate-orb-pulse"
      >
        <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-2xl">
          <defs>
            <radialGradient id="orb" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="oklch(0.96 0.02 80)" />
              <stop offset="35%" stopColor="oklch(0.84 0.21 130)" />
              <stop offset="70%" stopColor="oklch(0.55 0.2 320)" />
              <stop offset="100%" stopColor="oklch(0.2 0.04 280)" />
            </radialGradient>
            <radialGradient id="hi" cx="30%" cy="25%" r="30%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill="url(#orb)" />
          <circle cx="78" cy="72" r="40" fill="url(#hi)" />
        </svg>
      </motion.div>

      {/* Floating paper fragments */}
      <motion.div
        style={{ translateX: pt.x * -20, translateY: pt.y * -20 }}
        className="absolute right-[6%] top-[18%] h-24 w-20 rotate-12 rounded-md bg-cream/95 shadow-2xl"
      >
        <div className="space-y-1.5 p-2.5">
          <div className="h-1 w-2/3 rounded bg-ink/70" />
          <div className="h-0.5 w-full rounded bg-ink/30" />
          <div className="h-0.5 w-5/6 rounded bg-ink/30" />
          <div className="h-0.5 w-3/4 rounded bg-ink/30" />
          <div className="mt-2 h-1 w-1/2 rounded bg-lime" />
          <div className="h-0.5 w-full rounded bg-ink/30" />
          <div className="h-0.5 w-2/3 rounded bg-ink/30" />
        </div>
      </motion.div>
      <motion.div
        style={{ translateX: pt.x * 15, translateY: pt.y * 15 }}
        className="absolute bottom-[14%] left-[4%] h-20 w-16 -rotate-12 rounded-md bg-cream/90 shadow-2xl"
      >
        <div className="space-y-1 p-2">
          <div className="h-1 w-2/3 rounded bg-ink/70" />
          <div className="h-0.5 w-full rounded bg-ink/30" />
          <div className="h-0.5 w-3/4 rounded bg-ink/30" />
          <div className="mt-1.5 h-2 w-8 rounded bg-lime/80" />
        </div>
      </motion.div>
    </motion.div>
  );
}
