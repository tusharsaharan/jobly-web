import { useEffect, useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cubicOut, limit } from "../beagleEase";
import { useStepIndex } from "../SwipeElement";
import { SignupMorph } from "../SignupMorph";
import { FOOTER_CTA, LOOP_STEPS, type Candidate } from "../sceneManifest";

/* ────────────────────────── scroll hint ────────────────────────── */

/** `NextPagePixiElement` — bobbing circle + arrow at 90% height. */
export function ScrollHint({
  pos,
  anchor,
  visibleLength = 1,
  onClick,
}: {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength?: number;
  onClick: () => void;
}) {
  const stepIndex = useStepIndex(pos, anchor, visibleLength);
  const opacity = useTransform(stepIndex, (si) =>
    si < 1 ? limit(si / 0.5, 0, 1) : limit(1 - (si - 1) / 0.5, 0, 1),
  );
  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );

  return (
    <motion.div
      className="absolute inset-x-0 z-40 flex justify-center"
      style={{ top: "calc(90% - 60px)", opacity, visibility }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Scroll to the next section"
        className="grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-white/80 text-white transition-colors hover:bg-white/10"
        data-no-drag
      >
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6" aria-hidden="true" />
        </motion.span>
      </button>
    </motion.div>
  );
}

/* ────────────────────────── step 4 · extracted fields ────────────────────────── */

/**
 * The structured fields the parser pulls out of the PDF — skills, experience,
 * education, CGPA. They fly out of the resume sheet, which is exactly what
 * `processResumeJob()` does to the document.
 */
export function FieldChips({
  pos,
  anchor,
  visibleLength,
  candidate,
}: {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
  candidate: Candidate;
}) {
  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );

  // alternating left / right slots, biased away from the centre sheet
  const slots = [
    { x: -0.3, y: -0.16 },
    { x: 0.31, y: -0.2 },
    { x: -0.35, y: 0.02 },
    { x: 0.34, y: 0.04 },
    { x: -0.29, y: 0.2 },
    { x: 0.3, y: 0.22 },
  ];

  return (
    <motion.div className="absolute inset-0 z-40" style={{ visibility }}>
      {candidate.fields.map((field, i) => (
        <FieldChip key={field} pos={pos} index={i} label={field} slot={slots[i % slots.length]} />
      ))}
    </motion.div>
  );
}

function FieldChip({
  pos,
  index,
  label,
  slot,
}: {
  pos: MotionValue<number>;
  index: number;
  label: string;
  slot: { x: number; y: number };
}) {
  const start = 3.5 + index * 0.07;
  const t = useTransform(pos, (p) => limit((p - start) / 0.45, 0, 1));
  const out = useTransform(pos, (p) => limit((p - 4.4) / 0.45, 0, 1));

  // fly out from the sheet's centre to the slot
  const x = useTransform([t, out] as const, ([v, o]: number[]) => {
    const travel = cubicOut(v, 0, slot.x, 1);
    return `calc(-50% + ${(travel + o * slot.x * 0.4) * 100}vw)`;
  });
  const y = useTransform([t, out] as const, ([v, o]: number[]) => {
    const travel = cubicOut(v, 0.08, slot.y - 0.08, 1);
    return `calc(-50% + ${(travel - o * 0.3) * 100}vh)`;
  });
  const opacity = useTransform(
    [t, out] as const,
    ([v, o]: number[]) => limit(v / 0.3, 0, 1) * (1 - o),
  );
  const scale = useTransform(t, (v) => cubicOut(v, 0.75, 0.25, 1));

  return (
    <motion.span className="landing-chip" style={{ x, y, opacity, scale }}>
      {label}
    </motion.span>
  );
}

/* ────────────────────────── step 11 · the loop closes ────────────────────────── */

/**
 * The payoff. The five stages the candidate just scrolled through, drawn as a
 * ring that returns to its start — with the score delta that makes going
 * round again worth it.
 */
export function LoopDiagram({
  pos,
  anchor,
  visibleLength,
  candidate,
}: {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
} & { candidate: Candidate }) {
  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );
  const t = useTransform(pos, (p) => limit((p - 10.2) / 0.7, 0, 1));
  const opacity = useTransform(t, (v) => limit(v / 0.4, 0, 1));
  const y = useTransform(t, (v) => `${(1 - v) * 5}vh`);

  const delta = useTransform(pos, (p) => limit((p - 10.55) / 0.45, 0, 1));
  const score = useTransform(delta, (d) =>
    Math.round(candidate.scoreBefore + (candidate.scoreAfter - candidate.scoreBefore) * d),
  );

  return (
    <motion.div className="landing-loop" style={{ opacity, y, visibility }}>
      <ol className="landing-loop-ring">
        {LOOP_STEPS.map((label, i) => (
          <LoopNode key={label} pos={pos} index={i} label={label} />
        ))}
      </ol>

      <div className="landing-loop-delta">
        <span className="landing-loop-from">{candidate.scoreBefore}</span>
        <ArrowRight className="h-4 w-4 opacity-40" aria-hidden="true" />
        <motion.span className="landing-loop-to">{score}</motion.span>
        <span className="landing-loop-cap">ATS score, second pass</span>
      </div>
    </motion.div>
  );
}

function LoopNode({
  pos,
  index,
  label,
}: {
  pos: MotionValue<number>;
  index: number;
  label: string;
}) {
  const start = 10.3 + index * 0.07;
  const t = useTransform(pos, (p) => limit((p - start) / 0.3, 0, 1));
  const opacity = useTransform(t, (v) => limit(v / 0.4, 0, 1));
  const scale = useTransform(t, (v) => cubicOut(v, 0.8, 0.2, 1));

  return (
    <motion.li className="landing-loop-node" style={{ opacity, scale }}>
      <span className="landing-loop-idx">{index + 1}</span>
      {label}
    </motion.li>
  );
}

/* ────────────────────────── footer ────────────────────────── */

export function FooterSignup() {
  return (
    <div className="flex h-full flex-col justify-center px-8 sm:px-14">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="landing-footer-title">
          {FOOTER_CTA.lead}{" "}
          <span className="font-serif italic text-[var(--lp-mint)]">{FOOTER_CTA.em}</span>{" "}
          {FOOTER_CTA.trail}
        </h2>
        <p className="landing-kicker mt-3 text-[var(--lp-mint)]">{FOOTER_CTA.kicker}</p>
        <div className="mt-6 max-w-md" data-no-drag>
          <SignupMorph />
        </div>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lp-mint)] underline-offset-4 hover:underline"
          data-no-drag
        >
          Or create your profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────── thesis particles ────────────────────────── */

export function useDeferredDate() {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    );
  }, []);
  return date;
}
