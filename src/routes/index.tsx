import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LandingNav } from "@/components/Nav";
import { Preloader } from "@/components/landing/Preloader";
import { SideDots } from "@/components/landing/SideDots";
import { SignupMorph } from "@/components/landing/SignupMorph";
import { useSnapScroll } from "@/components/landing/useSnapScroll";
import { FooterPanel, PanelElement } from "@/components/landing/SwipeElement";
import { ramp } from "@/components/landing/scenes/choreography";
import { HeroTriptych } from "@/components/landing/intro/HeroTriptych";
import { ThesisPanel } from "@/components/landing/intro/ThesisPanel";
import { ShapeField } from "@/components/landing/intro/ShapeField";
import { ImportStage } from "@/components/landing/intro/ImportStage";
import { ResumePage } from "@/components/landing/intro/ResumePage";
import { ScoreColumn } from "@/components/landing/intro/ScoreColumn";
import { KeywordFlight } from "@/components/landing/intro/KeywordFlight";
import { IntroFallback } from "@/components/landing/intro/IntroFallback";
import {
  ANCHORS,
  COPY,
  DOT_LABELS,
  DOT_STEPS,
  EDGE_PASS_THROUGH,
  END_STEP,
  PASS_THROUGH_STEPS,
  SHAPES_WARM,
  surfaceAt,
} from "@/components/landing/intro/manifest";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jobly | A tool for proving what you can actually do" },
      {
        name: "description",
        content:
          "Start from the CV you already have. Jobly reads every line, scores it against the role, and traces every point back to a quote from your own resume.",
      },
    ],
  }),
  component: Landing,
});

/**
 * Canvas experience for fine-pointer desktop; static story otherwise.
 *
 * Returns `null` until mounted, so the server and the client's FIRST render
 * agree. That is not belt-and-braces. This used to be two separate reads — this
 * hook for the layout query and framer's `useReducedMotion()` for the motion one
 * — and `useReducedMotion` resolves its query synchronously DURING render. So
 * with `prefers-reduced-motion: reduce` the server rendered the canvas, the
 * client rendered the fallback on its very first pass, and React threw the whole
 * tree away with a hydration error. Reading both queries in one effect is what
 * keeps them consistent.
 */
function useStaticLayout() {
  const [isStatic, setIsStatic] = useState<boolean | null>(null);
  useEffect(() => {
    const layout = window.matchMedia("(max-width: 1023px), (pointer: coarse)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setIsStatic(layout.matches || motion.matches);
    apply();
    layout.addEventListener("change", apply);
    motion.addEventListener("change", apply);
    return () => {
      layout.removeEventListener("change", apply);
      motion.removeEventListener("change", apply);
    };
  }, []);
  return isStatic;
}

/**
 * THE INTRO SECTION — nine steps.
 *
 *   0   hero      hero.jpg full-bleed, "Introducing Jobly", scroll cue
 *   1  ·through·  the frame closes to a triptych, the backdrop washes to cream,
 *                 the ink panel rises carrying "Because we believe"
 *   2   thesis    the five-line stack, outlined glyphs drifting behind it
 *   3  ·through·  ink leaves, mint wipes open, the page rises
 *   4   import    the page types itself, five siblings arrive, headline wipes
 *   5  ·through·  mint retracts, siblings scatter, and the page GROWS — its
 *                 skeleton resolving into real, readable text
 *   6   calc      "Step two / ATS Calculation", warm glyphs behind the sheet
 *   7   scan      a band reads the document section by section; phrases get
 *                 painted, skill chips fly into the seven weighted categories,
 *                 the ring counts to 82
 *   8   seam      temporary CTA cap
 *
 * Steps 1, 3 and 5 are pass-through: the engine will not rest there and
 * continues in the direction of travel, so each chapter change is ONE gesture
 * rather than two scrolls. That is the whole difference between film and a
 * slideshow.
 *
 * `EDGE_PASS_THROUGH` is off. The reference also auto-advances from
 * `endStep - 1`, because its own penultimate step is transitional; ours is the
 * scan — the payoff of the section — and leaving that rule on would make it
 * unreachable on any viewport wider than 1023px.
 *
 * LAYER ORDER, bottom to top: ink floor 0, hero 5, thesis 15, mint 16, thesis
 * glyphs 20, warm glyphs 22, siblings 26, the sheet 30, score column 36, chips
 * in flight 40, titles 42, footer 46. The warm glyphs sit UNDER the sheet on
 * purpose — the paper occluding them is what puts the document in front of a
 * world instead of on top of a pattern.
 */
function Landing() {
  const [preloaded, setPreloaded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const isStatic = useStaticLayout();

  const { pos, activeIndex, whiteTheme, navVisible, moveTo, engineRef } = useSnapScroll(
    END_STEP,
    !preloaded,
    stageRef,
    {
      passThrough: PASS_THROUGH_STEPS,
      surfaceAt,
      edgePassThrough: EDGE_PASS_THROUGH,
    },
  );

  const onGo = useCallback((step: number) => moveTo(step), [moveTo]);

  useEffect(() => {
    if (!preloaded) return;
    const hook = {
      moveTo: (step: number) => moveTo(step),
      getProgress: () => pos.get(),
      getPos: () => pos.get(),
      getAim: () => engineRef.current?.getAim() ?? pos.get(),
      getWhiteTheme: () => document.body.classList.contains("landing-white-theme"),
      getActiveIndex: () => activeIndex,
      /** Screenshot harness: park at a fractional step without snapping. */
      parkAt: (step: number) => engineRef.current?.parkAt(step),
    };
    (window as unknown as Record<string, unknown>).__joblyLanding = hook;
    return () => {
      delete (window as unknown as Record<string, unknown>).__joblyLanding;
    };
  }, [preloaded, moveTo, pos, engineRef, activeIndex]);

  useEffect(() => {
    document.body.classList.toggle("landing-white-theme", whiteTheme);
    return () => document.body.classList.remove("landing-white-theme");
  }, [whiteTheme]);

  if (isStatic) {
    return (
      <main className="landing-fallback landing-intro-fb">
        <LandingNav light revealed />
        <IntroFallback />
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[var(--lp-cream)] text-ink">
      {!preloaded ? <Preloader onDone={() => setPreloaded(true)} /> : null}
      {/* `whiteTheme` = white ink on a dark surface; LandingNav's `light` is the inverse. */}
      <LandingNav light={!whiteTheme} revealed={preloaded && navVisible} />

      <div
        ref={stageRef}
        className="landing-stage landing-intro relative h-screen w-full cursor-grab touch-none select-none overflow-hidden"
        data-active-step={activeIndex}
      >
        {/* A dark floor for pos < 0, so the preloader's slide-in never shows cream. */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.inkFloor.anchor}
          visibleLength={ANCHORS.inkFloor.length}
          color="var(--lp-ink)"
          introOffset={0}
          outro={false}
          zIndex={0}
        />

        {/* ══ steps 0-1 · the hero becomes a triptych ══ */}
        <HeroTriptych pos={pos} onHintClick={() => moveTo(2)} zIndex={5} />

        {/* ══ step 2 · the thesis ══ */}
        <ThesisPanel pos={pos} zIndex={15} />
        <ShapeField pos={pos} zIndex={20} />

        {/* ══ steps 3-7 · the mint surface, the clutter, the two titles ══ */}
        <ImportStage pos={pos} />

        {/* ══ steps 6-7 · the warm field, behind the sheet ══
            Its beat spans two rests, which the one-step `stepIndex` envelope
            cannot express — so it supplies explicit fade windows instead. */}
        <ShapeField
          pos={pos}
          anchor={ANCHORS.warmShapes.anchor}
          visibleLength={ANCHORS.warmShapes.length}
          zIndex={22}
          shapes={SHAPES_WARM}
          color="var(--lp-marker-edge)"
          strokeWidth={4}
          envelope={{ enterAt: 5.2, enterLen: 0.5, exitAt: 7.42, exitLen: 0.4 }}
        />

        {/* ══ steps 3-8 · the protagonist ══ */}
        <ResumePage pos={pos} zIndex={30} />

        {/* ══ step 7 · the score, and the phrases that pay for it ══ */}
        <ScoreColumn pos={pos} zIndex={36} />
        <KeywordFlight pos={pos} zIndex={40} />

        {/* ══ step 8 · temporary cap, until the next section is written ══ */}
        <SeamFooter pos={pos} />

        <SideDots
          pos={pos}
          activeIndex={activeIndex}
          light={!whiteTheme}
          onGo={onGo}
          steps={DOT_STEPS}
          labels={DOT_LABELS}
        />
      </div>
    </main>
  );
}

/**
 * `FooterColorPixiElement` — a bottom-anchored ink band carrying the signup.
 *
 * This is a CAP, not a designed ending: it gives the page somewhere to stop
 * while the sections after the scan beat are still unwritten. Moving it is a
 * one-line change to `END_STEP` and this anchor.
 */
function SeamFooter({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 7.5, 0.45));

  return (
    <FooterPanel
      pos={pos}
      anchor={ANCHORS.seamFooter.anchor}
      visibleLength={ANCHORS.seamFooter.length}
      color="var(--lp-ink)"
      zIndex={46}
    >
      <motion.div className="flex h-full flex-col justify-center px-8 sm:px-14" style={{ opacity }}>
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="landing-fb-h2 text-white">
            {COPY.seam.lead}{" "}
            <span className="font-serif italic text-[var(--lp-mint)]">{COPY.seam.em}</span>{" "}
            {COPY.seam.trail}
          </h2>
          <p className="landing-import-label mt-3 text-[var(--lp-mint)] opacity-100">
            {COPY.seam.kicker}
          </p>
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
          {/* The canvas owns the page ending, so the site footer lives here —
              inside the final ink band — and nowhere else on this route. */}
          <nav
            aria-label="Footer"
            data-no-drag
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[11px] font-medium tracking-wide text-white/45"
          >
            <Link to="/" className="transition-colors hover:text-white/80">
              How it works
            </Link>
            <Link to="/jobs" className="transition-colors hover:text-white/80">
              Jobs
            </Link>
            <Link to="/dashboard" className="transition-colors hover:text-white/80">
              Dashboard
            </Link>
            <Link to="/" className="transition-colors hover:text-white/80">
              About
            </Link>
            <Link to="/" className="transition-colors hover:text-white/80">
              Privacy
            </Link>
            <span className="ml-auto text-white/30">© {new Date().getFullYear()} Jobly</span>
          </nav>
        </div>
      </motion.div>
    </FooterPanel>
  );
}
