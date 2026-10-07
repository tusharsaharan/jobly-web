import { useEffect, useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { limit } from "../beagleEase";
import { useStepIndex } from "../SwipeElement";
import { SignupMorph } from "../SignupMorph";
import { FOOTER_CTA } from "../sceneManifest";

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

/* ────────────────────────── misc ────────────────────────── */

export function useDeferredDate() {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    );
  }, []);
  return date;
}
