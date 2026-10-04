import { useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Check } from "lucide-react";

export const PAPER_SHADOW =
  "0 30px 70px -35px rgb(35 42 38 / 0.48), 0 4px 12px rgb(35 42 38 / 0.08)";

/**
 * NOTE (recovery): only `PAPER_SHADOW` (above, exact) and `useSceneParallax`
 * (bottom, exact) are consumed by the live homepage. The helpers below are
 * legacy from the previous scene build, reconstructed faithfully to their
 * documented behaviour; they currently have no importers.
 */

/** Scroll-driven typewriter: substring grows/shrinks as progress crosses [from, to]. */
export function useProgressText(
  progress: MotionValue<number>,
  full: string,
  from: number,
  to: number,
) {
  const count = useMotionValue(0);
  const [text, setText] = useState("");
  useTransform(progress, (p) => {
    const t = Math.min(1, Math.max(0, (p - from) / (to - from)));
    count.set(Math.round(t * full.length));
  });
  useMotionValueEvent(count, "change", (v) => {
    setText(full.slice(0, Math.max(0, Math.min(full.length, Math.round(v)))));
  });
  return text;
}

/** Blinking caret for the typewriter. */
export function TypeCaret() {
  return <span aria-hidden="true" className="animate-pulse">▍</span>;
}

/** A single skeleton row on a paper card. */
export function PaperRow({ width = 100 }: { width?: number }) {
  return (
    <div className="relative h-[0.9vh] min-h-[4px]" style={{ width: `${width}%` }}>
      <div className="absolute inset-0 bg-[var(--lp-ink)]/10" />
    </div>
  );
}

/** A generic paper card with a title and skeleton rows. */
export function ResumePaper({ title, rows = 4 }: { title: string; rows?: number }) {
  return (
    <div className="landing-paper-title">
      <p>{title}</p>
      <div className="mt-[6%] space-y-[4.5%]">
        {Array.from({ length: rows }).map((_, i) => (
          <PaperRow key={i} width={100 - i * 8} />
        ))}
      </div>
    </div>
  );
}

/** A mini paper chip with a check mark. */
export function MiniPaper({ label }: { label: string }) {
  return (
    <span className="landing-chip">
      <Check className="h-3 w-3" aria-hidden="true" /> {label}
    </span>
  );
}

/** Parallax offset for a scene centred on `center`: +46 → -46 across ±1 step. */
export function useSceneParallax(
  progress: MotionValue<number>,
  center: number,
): MotionValue<number> {
  return useTransform(progress, [center - 1, center + 1], [46, -46]);
}
