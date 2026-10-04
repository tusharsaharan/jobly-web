import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LandingNav } from "@/components/Nav";
import { Preloader } from "@/components/landing/Preloader";
import { SideDots } from "@/components/landing/SideDots";
import { useSnapScroll } from "@/components/landing/useSnapScroll";
import { PanelElement, SwipeElement, FooterPanel } from "@/components/landing/SwipeElement";
import { TitleCard } from "@/components/landing/scenes/TitleCard";
import { ResumeSheet } from "@/components/landing/scenes/ResumeSheet";
import { Laptop } from "@/components/landing/scenes/Laptop";
import {
  InterviewRoom,
  RoleCards,
  Scorecard,
  StudyTopics,
} from "@/components/landing/scenes/storyPieces";
import {
  FieldChips,
  FooterSignup,
  LoopDiagram,
  ScrollHint,
} from "@/components/landing/scenes/pieces";
import {
  ANCHORS,
  ATS_CATEGORIES,
  CANDIDATES,
  COPY,
  END_STEP,
  FOOTER_CTA,
  PALETTE,
  PILLARS,
  STUDY_TOPICS,
} from "@/components/landing/sceneManifest";
import { collaborateImg, introImg, step1, step2 } from "@/components/landing/sceneAssets";
import { PAPER_SHADOW } from "@/components/landing/scenes/paper";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jobly | Your resume is evidence, not a formality" },
      {
        name: "description",
        content:
          "Upload your resume, get a deterministic ATS score with every point traced to a quote, interview live, and leave with evidence-backed feedback and a study plan.",
      },
    ],
  }),
  component: Landing,
});

/** Canvas experience for fine-pointer desktop; static story otherwise. */
function useStaticLayout() {
  const [isStatic, setIsStatic] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px), (pointer: coarse)");
    const apply = () => setIsStatic(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isStatic;
}

function Landing() {
  const [preloaded, setPreloaded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const isStatic = useStaticLayout();

  const { pos, activeIndex, whiteTheme, navVisible, moveTo, engineRef } = useSnapScroll(
    END_STEP,
    !preloaded,
    stageRef,
  );

  // One candidate carried across all nine beats, picked per load.
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => {
    setCandidateIndex(Math.floor(Math.random() * CANDIDATES.length));
  }, []);
  const candidate = CANDIDATES[candidateIndex];

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

  // hero photo fades as the thesis takes over
  const heroPhotoOpacity = useTransform(pos, (p) => (p <= 1 ? 1 : Math.max(0, 1 - (p - 1) / 1.2)));

  if (shouldReduceMotion || isStatic) {
    return (
      <main className="landing-fallback bg-cream text-ink">
        <LandingNav light revealed />
        <LandingFallback />
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
        className="landing-stage relative h-screen w-full cursor-grab touch-none select-none overflow-hidden"
        data-active-step={activeIndex}
      >
        {/* ══ chapter 1 · the resume you already have ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.inkPanel.anchor}
          visibleLength={ANCHORS.inkPanel.length}
          color={PALETTE.ink}
          introOffset={0}
          outro={false}
          zIndex={0}
        />

        <motion.div
          aria-hidden="true"
          className="absolute inset-0 z-[5]"
          style={{ opacity: heroPhotoOpacity }}
        >
          <img src={introImg} alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[var(--lp-ink)]/55" />
        </motion.div>

        <SwipeElement
          pos={pos}
          anchor={ANCHORS.heroSideLeft.anchor}
          visibleLength={ANCHORS.heroSideLeft.length}
          zIndex={8}
          props={{
            x: { from: -0.92, middle: -0.36, to: -0.92 },
            y: { from: 0.3, middle: 0.04, to: -0.5 },
            s: { from: 0.9, middle: 1, to: 0.9 },
            r: { from: -0.05, middle: -0.03, to: -0.08 },
            o: { from: 0, middle: 1, to: 0 },
          }}
        >
          <img
            src={step1}
            alt=""
            className="h-[24vh] w-[16vw] -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{ boxShadow: PAPER_SHADOW }}
          />
        </SwipeElement>

        <SwipeElement
          pos={pos}
          anchor={ANCHORS.heroSideRight.anchor}
          visibleLength={ANCHORS.heroSideRight.length}
          zIndex={8}
          props={{
            x: { from: 0.92, middle: 0.36, to: 0.92 },
            y: { from: 0.34, middle: 0.08, to: -0.46 },
            s: { from: 0.9, middle: 1, to: 0.9 },
            r: { from: 0.05, middle: 0.03, to: 0.08 },
            o: { from: 0, middle: 1, to: 0 },
          }}
        >
          <img
            src={step2}
            alt=""
            className="h-[21vh] w-[14vw] -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{ boxShadow: PAPER_SHADOW }}
          />
        </SwipeElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.heroTitle.anchor}
          visibleLength={ANCHORS.heroTitle.length}
          title={COPY.hero.title}
          subheader={COPY.hero.subheader}
          color="#FFFFFF"
          zIndex={45}
        />

        <ScrollHint
          pos={pos}
          anchor={ANCHORS.scrollHint.anchor}
          visibleLength={ANCHORS.scrollHint.length}
          onClick={() => moveTo(2)}
        />

        {/* ══ chapter 2 · the thesis ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.particleBg.anchor}
          visibleLength={ANCHORS.particleBg.length}
          color={PALETTE.ink}
          zIndex={15}
        >
          <div className="landing-particles absolute inset-0" aria-hidden="true" />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.thesisTitle.anchor}
          visibleLength={ANCHORS.thesisTitle.length}
          kicker={COPY.thesis.uppertitle}
          title={COPY.thesis.title}
          subheader={COPY.thesis.subheader}
          subtitle={COPY.thesis.subtitle}
          footnote={COPY.thesis.bottomtitle}
          color="#FFFFFF"
          zIndex={46}
        />

        {/* ══ chapter 3 · upload, parse, score ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.mintPanel.anchor}
          visibleLength={ANCHORS.mintPanel.length}
          color={PALETTE.mint}
          zIndex={16}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.uploadTitle.anchor}
          visibleLength={ANCHORS.uploadTitle.length}
          title={COPY.upload.title}
          subheader={COPY.upload.subheader}
          color={PALETTE.ink}
          zIndex={44}
        />

        <FieldChips
          pos={pos}
          anchor={ANCHORS.fieldChips.anchor}
          visibleLength={ANCHORS.fieldChips.length}
          candidate={candidate}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.scoreTitle.anchor}
          visibleLength={ANCHORS.scoreTitle.length}
          title={COPY.score.title}
          subheader={COPY.score.subheader}
          color={PALETTE.ink}
          zIndex={44}
        />

        <Laptop
          pos={pos}
          anchor={ANCHORS.laptop.anchor}
          visibleLength={ANCHORS.laptop.length}
          candidate={candidate}
        />

        {/* ══ THE PROTAGONIST — alive across every beat ══ */}
        <ResumeSheet
          pos={pos}
          anchor={ANCHORS.resume.anchor}
          visibleLength={ANCHORS.resume.length}
          candidate={candidate}
        />

        {/* ══ chapter 4 · apply where you fit ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.deepPanel.anchor}
          visibleLength={ANCHORS.deepPanel.length}
          color={PALETTE.deep}
          zIndex={18}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.matchTitle.anchor}
          visibleLength={ANCHORS.matchTitle.length}
          title={COPY.match.title}
          subheader={COPY.match.subheader}
          color="#FFFFFF"
          zIndex={44}
        />

        <RoleCards
          pos={pos}
          anchor={ANCHORS.roleCards.anchor}
          visibleLength={ANCHORS.roleCards.length}
        />

        {/* ══ chapter 5 · the room, then the verdict ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.roomPanel.anchor}
          visibleLength={ANCHORS.roomPanel.length}
          color={PALETTE.room}
          zIndex={19}
        >
          <img
            src={collaborateImg}
            alt=""
            className="h-full w-full object-cover object-center opacity-20"
          />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.roomTitle.anchor}
          visibleLength={ANCHORS.roomTitle.length}
          title={COPY.room.title}
          subheader={COPY.room.subheader}
          color="#FFFFFF"
          zIndex={44}
          className="whitespace-pre-line"
        />

        <InterviewRoom
          pos={pos}
          anchor={ANCHORS.interviewRoom.anchor}
          visibleLength={ANCHORS.interviewRoom.length}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.verdictTitle.anchor}
          visibleLength={ANCHORS.verdictTitle.length}
          title={COPY.verdict.title}
          subheader={COPY.verdict.subheader}
          color="#FFFFFF"
          zIndex={44}
        />

        <Scorecard
          pos={pos}
          anchor={ANCHORS.scorecard.anchor}
          visibleLength={ANCHORS.scorecard.length}
        />

        {/* ══ chapter 6 · what to study ══ */}
        <TitleCard
          pos={pos}
          anchor={ANCHORS.studyTitle.anchor}
          visibleLength={ANCHORS.studyTitle.length}
          title={COPY.study.title}
          subheader={COPY.study.subheader}
          color={PALETTE.ink}
          zIndex={44}
        />

        <StudyTopics
          pos={pos}
          anchor={ANCHORS.studyTopics.anchor}
          visibleLength={ANCHORS.studyTopics.length}
        />

        {/* ══ chapter 7 · the loop closes ══ */}
        <TitleCard
          pos={pos}
          anchor={ANCHORS.loopTitle.anchor}
          visibleLength={ANCHORS.loopTitle.length}
          title={COPY.loop.title}
          subheader={COPY.loop.subheader}
          color={PALETTE.ink}
          top="11%"
          zIndex={44}
        />

        <LoopDiagram
          pos={pos}
          anchor={ANCHORS.loopDiagram.anchor}
          visibleLength={ANCHORS.loopDiagram.length}
          candidate={candidate}
        />

        <FooterPanel
          pos={pos}
          anchor={ANCHORS.footerColor.anchor}
          visibleLength={ANCHORS.footerColor.length}
          color={PALETTE.ink}
          zIndex={42}
        >
          <FooterSignup />
        </FooterPanel>

        <SideDots pos={pos} activeIndex={activeIndex} light={!whiteTheme} onGo={onGo} />
      </div>
    </main>
  );
}

/* ─── Reduced-motion / mobile fallback — same manifest, same story ─── */

function LandingFallback() {
  const candidate = CANDIDATES[0];
  const sections = [
    { ...COPY.upload, tone: "bg-mint text-ink", n: "01" },
    { ...COPY.score, tone: "bg-[#f5f5f3] text-ink", n: "02" },
    { ...COPY.match, tone: "bg-[var(--lp-deep)] text-white", n: "03" },
    { ...COPY.room, tone: "bg-ink text-white", n: "04" },
    { ...COPY.verdict, tone: "bg-[#26302c] text-white", n: "05" },
    { ...COPY.study, tone: "bg-[#f5f5f3] text-ink", n: "06" },
  ];

  return (
    <>
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden bg-ink px-6 text-center text-white">
        <img
          src={introImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
        />
        <div className="relative z-10 max-w-3xl">
          <p className="marker-num text-mint-light">{COPY.hero.title}</p>
          <h1 className="font-display mt-5 text-5xl leading-[1.02] sm:text-6xl">
            {COPY.thesis.title} {COPY.thesis.subheader} {COPY.thesis.subtitle}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">{COPY.hero.subheader}</p>
          <Link to="/auth" search={{ mode: "signup" }} className="pill-mint-lg mt-10 gap-2">
            Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-label="How Jobly works">
        {sections.map((card) => (
          <article key={card.n} className={`px-6 py-16 sm:px-10 ${card.tone}`}>
            <div className="mx-auto max-w-2xl">
              <p className="marker-num opacity-60">{card.n}</p>
              <h2 className="font-display mt-3 text-4xl leading-none">{card.title}</h2>
              <p className="font-serif mt-3 whitespace-pre-line text-lg opacity-80">
                {card.subheader}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-cream px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h3 className="font-display text-2xl">Seven weighted categories</h3>
          <ul className="mt-5 space-y-2">
            {ATS_CATEGORIES.map((c) => (
              <li key={c.id} className="flex justify-between border-b border-ink/10 pb-2 text-sm">
                <span>{c.label}</span>
                <span className="font-mono opacity-60">{c.max} pts</span>
              </li>
            ))}
          </ul>

          <h3 className="font-display mt-10 text-2xl">Four competencies</h3>
          <ul className="mt-5 space-y-2">
            {PILLARS.map((p) => (
              <li key={p.id} className="border-b border-ink/10 pb-2 text-sm">
                {p.label}
              </li>
            ))}
          </ul>

          <h3 className="font-display mt-10 text-2xl">Then a study plan</h3>
          <ul className="mt-5 space-y-2">
            {STUDY_TOPICS.map((t) => (
              <li key={t.id} className="border-b border-ink/10 pb-2 text-sm">
                <span className="font-semibold">{t.topic}</span>
                <span className="opacity-60"> — from “{t.from}”</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 font-serif text-lg italic opacity-75">
            {candidate.scoreBefore} → {candidate.scoreAfter} on the second pass.
          </p>
        </div>
      </section>

      <section className="bg-ink px-6 py-20 text-center text-white">
        <h2 className="font-display text-4xl">
          {FOOTER_CTA.lead} <span className="font-serif italic">{FOOTER_CTA.em}</span>{" "}
          {FOOTER_CTA.trail}
        </h2>
        <p className="marker-num mt-3 text-mint-light">{FOOTER_CTA.kicker}</p>
        <Link to="/auth" search={{ mode: "signup" }} className="pill-mint mt-8 gap-2">
          Create your profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
