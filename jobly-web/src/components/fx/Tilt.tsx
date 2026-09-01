import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

export function Tilt({
  children,
  className,
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { damping: 18, stiffness: 200 });
  const sy = useSpring(my, { damping: 18, stiffness: 200 });
  const rx = useTransform(sy, [0, 1], [max, -max]);
  const ry = useTransform(sx, [0, 1], [-max, max]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: reduceMotion ? 0 : rx, rotateY: reduceMotion ? 0 : ry, transformPerspective: 1000 }}
      onPointerMove={(e) => {
        if (reduceMotion) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
