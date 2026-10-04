import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LandingNav } from "@/components/Nav";
import { Preloader } from "@/components/landing/Preloader";
import { SideDots } from "@/components/landing/SideDots";
import { useSnapScroll } from "@/components/landing/useSnapScroll";
import { PanelElement, FooterPanel } from "@/components/landing/SwipeElement";
import { TitleCard } from "@/components/landing/scenes/TitleCard";
import { ResumeSheet } from "@/components/landing/scenes/ResumeSheet";
import { DeskScatter, GatherCount } from "@/components/landing/scenes/DeskScatter";
import { LaptopStage, LaptopProof } from "@/components/landing/scenes/LaptopStage";
import { ParsePage, ParseTally } from "@/components/landing/scenes/ParsePage";
import { SkillRail, ScoreBreakdown } from "@/components/landing/scenes/SkillRail";
import { EvidenceLayer } from "@/components/landing/scenes/EvidenceLayer";
import { MailboxFlight } from "@/components/landing/scenes/MailboxFlight";
import { InterviewRoom } from "@/components/landing/scenes/InterviewRoom";
import { FeedbackAssembly } from "@/components/landing/scenes/FeedbackAssembly";
import { CrackAndFix } from "@/components/landing/scenes/CrackAndFix";
import { FolderStage } from "@/components/landing/scenes/FolderStage";
import { FooterSignup, ScrollHint } from "@/components/landing/scenes/pieces";
import {
  ANCHORS,
  ATS_CATEGORIES,
  ATS_PROOF,
  CANDIDATES,
  COPY,
  END_STEP,
  EVIDENCE,
  FOLDER_TABS,
  FOOTER_CTA,
  MAILBOXES,
  PALETTE,
  PILLARS,
  STUDY_TOPICS,
} from "@/components/landing/sceneManifest";
import { collaborateImg, introImg } from "@/components/landing/sceneAssets";

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

/** Points the ring awards, summed only from evidence that has actually docked. */
function useLiveScore(pos: MotionValue<number>) {
  return useTransform(pos, (p) => {
    let total = 0;
    EVIDENCE.forEach((atom, i) => {
      const docked = Math.min(1, Math.max(0, (p - (8.15 + i * 0.045 + 0.1)) / 0.4));
      total += atom.pts * docked;
    });
    // ATS readability is structural, not evidence-bound — it lands last.
    const hygiene = Math.min(1, Math.max(0, (p - 8.6) / 0.3));
    return Math.round(total + 10 * hygiene);
  });
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

  // One candidate carried across every beat, picked per load.
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

  const heroPhotoOpacity = useTransform(pos, (p) => (p <= 1 ? 1 : Math.max(0, 1 - (p - 1) / 1.2)));
  const liveScore = useLiveScore(pos);

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
        {/* ══ chapter 1 · the desk ══ */}
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
          <div className="absolute inset-0 bg-[var(--lp-ink)]/60" />
          <div className="landing-vignette absolute inset-0" />
        </motion.div>

        <DeskScatter
          pos={pos}
          anchor={ANCHORS.deskScatter.anchor}
          visibleLength={ANCHORS.deskScatter.length}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.heroTitle.anchor}
          visibleLength={ANCHORS.heroTitle.length}
          kicker="CAREER CLARITY, BUILT AROUND YOU"
          title="Find your next good fit."
          subheader={COPY.hero.subheader}
          color="#FFFFFF"
          top="14%"
          zIndex={45}
        />

        <HeroActions pos={pos} />

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
          <div className="landing-spotlight absolute inset-0" aria-hidden="true" />
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

        {/* ══ chapter 3 · gather → open → parse → extract → score ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.creamPanel.anchor}
          visibleLength={ANCHORS.creamPanel.length}
          color={PALETTE.cream}
          zIndex={16}
        >
          <div className="landing-grain absolute inset-0" aria-hidden="true" />
        </PanelElement>

        {/* the laptop screen owns the frame for parse / extract / score */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.screenPanel.anchor}
          visibleLength={ANCHORS.screenPanel.length}
          color="#0a1410"
          zIndex={17}
        >
          <div className="landing-screenfield absolute inset-0" aria-hidden="true" />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.gatherTitle.anchor}
          visibleLength={ANCHORS.gatherTitle.length}
          title={COPY.gather.title}
          subheader={COPY.gather.subheader}
          color={PALETTE.ink}
          zIndex={44}
        />

        <GatherCount pos={pos} />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.openTitle.anchor}
          visibleLength={ANCHORS.openTitle.length}
          title={COPY.open.title}
          subheader={COPY.open.subheader}
          color={PALETTE.ink}
          top="12%"
          zIndex={44}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.parseTitle.anchor}
          visibleLength={ANCHORS.parseTitle.length}
          title={COPY.parse.title}
          subheader={COPY.parse.subheader}
          color="#FFFFFF"
          top="7%"
          zIndex={44}
          className="landing-title--compact"
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.extractTitle.anchor}
          visibleLength={ANCHORS.extractTitle.length}
          title={COPY.extract.title}
          subheader={COPY.extract.subheader}
          color="#FFFFFF"
          top="7%"
          zIndex={44}
          className="landing-title--compact"
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.scoreTitle.anchor}
          visibleLength={ANCHORS.scoreTitle.length}
          title={COPY.score.title}
          subheader={COPY.score.subheader}
          color="#FFFFFF"
          top="7%"
          zIndex={44}
          className="landing-title--compact"
        />

        {/* the laptop hosts the parse page, the rail and the score rows */}
        <LaptopStage
          pos={pos}
          anchor={ANCHORS.laptop.anchor}
          visibleLength={ANCHORS.laptop.length}
        >
          <ParsePage pos={pos} candidate={candidate} />
          <SkillRail pos={pos} />
          <ScoreBreakdown pos={pos} categories={ATS_CATEGORIES} score={liveScore} />
        </LaptopStage>

        <ParseTally pos={pos} />
        <LaptopProof pos={pos} items={ATS_PROOF} />

        {/* ══ chapter 4 · apply ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.deepPanel.anchor}
          visibleLength={ANCHORS.deepPanel.length}
          color={PALETTE.deep}
          zIndex={18}
        >
          <div className="landing-mesh absolute inset-0" aria-hidden="true" />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.applyTitle.anchor}
          visibleLength={ANCHORS.applyTitle.length}
          title={COPY.apply.title}
          subheader={COPY.apply.subheader}
          color="#FFFFFF"
          top="10%"
          zIndex={44}
        />

        <MailboxFlight
          pos={pos}
          anchor={ANCHORS.mailboxes.anchor}
          visibleLength={ANCHORS.mailboxes.length}
          candidate={candidate}
        />

        {/* ══ chapter 5 · the room — near-black IDE, no photo ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.roomPanel.anchor}
          visibleLength={ANCHORS.roomPanel.length}
          color={PALETTE.room}
          zIndex={19}
        >
          <div className="landing-roomfield absolute inset-0" aria-hidden="true" />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.roomTitle.anchor}
          visibleLength={ANCHORS.roomTitle.length}
          title={COPY.room.title}
          subheader={COPY.room.subheader}
          color="#FFFFFF"
          top="9%"
          zIndex={44}
          className="whitespace-pre-line"
        />

        <InterviewRoom
          pos={pos}
          anchor={ANCHORS.interviewRoom.anchor}
          visibleLength={ANCHORS.interviewRoom.length}
        />

        {/* ══ chapter 6 · the verdict — teal + blueprint, deliberately not the room ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.verdictPanel.anchor}
          visibleLength={ANCHORS.verdictPanel.length}
          color={PALETTE.verdict}
          zIndex={20}
        >
          <img
            src={collaborateImg}
            alt=""
            className="h-full w-full object-cover object-center opacity-[0.07] [filter:grayscale(1)]"
          />
          <div className="landing-blueprint absolute inset-0" aria-hidden="true" />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.feedbackTitle.anchor}
          visibleLength={ANCHORS.feedbackTitle.length}
          title={COPY.feedback.title}
          subheader={COPY.feedback.subheader}
          color="#FFFFFF"
          top="8%"
          zIndex={44}
        />

        <FeedbackAssembly
          pos={pos}
          anchor={ANCHORS.feedbackAssembly.anchor}
          visibleLength={ANCHORS.feedbackAssembly.length}
        />

        {/* ══ chapter 7 · fix and rewrite ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.fixPanel.anchor}
          visibleLength={ANCHORS.fixPanel.length}
          color={PALETTE.cream}
          zIndex={21}
        >
          <div className="landing-lamp absolute inset-0" aria-hidden="true" />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.fixTitle.anchor}
          visibleLength={ANCHORS.fixTitle.length}
          title={COPY.fix.title}
          subheader={COPY.fix.subheader}
          color={PALETTE.ink}
          top="9%"
          zIndex={44}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.rewriteTitle.anchor}
          visibleLength={ANCHORS.rewriteTitle.length}
          title={COPY.rewrite.title}
          subheader={COPY.rewrite.subheader}
          color={PALETTE.ink}
          top="9%"
          zIndex={44}
        />

        <CrackAndFix
          pos={pos}
          anchor={ANCHORS.crackAndFix.anchor}
          visibleLength={ANCHORS.crackAndFix.length}
        />

        {/* ══ chapter 8 · the folder closes the loop ══ */}
        <PanelElement
          pos={pos}
          anchor={ANCHORS.folderPanel.anchor}
          visibleLength={ANCHORS.folderPanel.length}
          color={PALETTE.ink}
          zIndex={22}
        >
          <div className="landing-stagelight absolute inset-0" aria-hidden="true" />
        </PanelElement>

        <TitleCard
          pos={pos}
          anchor={ANCHORS.folderTitle.anchor}
          visibleLength={ANCHORS.folderTitle.length}
          title={COPY.folder.title}
          subheader={COPY.folder.subheader}
          color="#FFFFFF"
          top="8%"
          zIndex={44}
        />

        <TitleCard
          pos={pos}
          anchor={ANCHORS.fileTitle.anchor}
          visibleLength={ANCHORS.fileTitle.length}
          title={COPY.file.title}
          subheader={COPY.file.subheader}
          color="#FFFFFF"
          top="8%"
          zIndex={44}
        />

        <FolderStage
          pos={pos}
          anchor={ANCHORS.folder.anchor}
          visibleLength={ANCHORS.folder.length}
          candidate={candidate}
        />

        {/* ══ THE PROTAGONISTS — mounted once, alive across the story ══ */}
        <ResumeSheet
          pos={pos}
          anchor={ANCHORS.resume.anchor}
          visibleLength={ANCHORS.resume.length}
          candidate={candidate}
        />

        <EvidenceLayer
          pos={pos}
          anchor={ANCHORS.evidence.anchor}
          visibleLength={ANCHORS.evidence.length}
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
    { ...COPY.gather, tone: "bg-mint text-ink", n: "01" },
    { ...COPY.parse, tone: "bg-[#0a1410] text-white", n: "02" },
    { ...COPY.score, tone: "bg-[#f5f5f3] text-ink", n: "03" },
    { ...COPY.apply, tone: "bg-[var(--lp-deep)] text-white", n: "04" },
    { ...COPY.room, tone: "bg-[var(--lp-room)] text-white", n: "05" },
    { ...COPY.feedback, tone: "bg-[var(--lp-verdict)] text-white", n: "06" },
    { ...COPY.fix, tone: "bg-[#f5f5f3] text-ink", n: "07" },
    { ...COPY.folder, tone: "bg-cream text-ink", n: "08" },
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

      {/* The evidence chain, spelled out for anyone who cannot see it animate. */}
      <section className="bg-cream px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h3 className="font-display text-2xl">Every point traced to a quote</h3>
          <ul className="mt-5 space-y-4">
            {EVIDENCE.map((atom) => (
              <li key={atom.id} className="border-b border-ink/10 pb-3">
                <p className="text-sm">
                  {atom.text.slice(0, atom.mark[0])}
                  <mark className="bg-[var(--lp-marker)]">
                    {atom.text.slice(atom.mark[0], atom.mark[1])}
                  </mark>
                  {atom.text.slice(atom.mark[1])}
                </p>
                <p className="mt-1 text-xs opacity-60">
                  → {atom.skill} · {atom.atsCat.replace(/_/g, " ")} · +{atom.pts} pts
                </p>
              </li>
            ))}
          </ul>

          <h3 className="font-display mt-10 text-2xl">Seven weighted categories</h3>
          <ul className="mt-5 space-y-2">
            {ATS_CATEGORIES.map((c) => (
              <li key={c.id} className="flex justify-between border-b border-ink/10 pb-2 text-sm">
                <span>{c.label}</span>
                <span className="font-mono opacity-60">{c.max} pts</span>
              </li>
            ))}
          </ul>

          <h3 className="font-display mt-10 text-2xl">Sent where the evidence lands</h3>
          <ul className="mt-5 space-y-2">
            {MAILBOXES.map((m) => (
              <li key={m.id} className="flex justify-between border-b border-ink/10 pb-2 text-sm">
                <span>
                  {m.role} — {m.company}
                </span>
                <span className="font-mono opacity-60">{m.fit}% fit</span>
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

          <h3 className="font-display mt-10 text-2xl">Every version kept</h3>
          <ul className="mt-5 space-y-2">
            {FOLDER_TABS.map((t) => (
              <li key={t.id} className="flex justify-between border-b border-ink/10 pb-2 text-sm">
                <span className="font-semibold">{t.label}</span>
                <span className="opacity-60">{t.caption}</span>
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

function HeroActions({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) =>
    Math.min(1, Math.max(0, p < 0 ? p + 1 : 1 - p / 0.85)),
  );
  const y = useTransform(pos, (p) => `${p < 0 ? -p * 8 : -p * 12}px`);
  const visibility = useTransform(pos, (p) => (p > -0.99 && p < 0.85 ? "visible" : "hidden"));

  return (
    <motion.div className="landing-hero-actions" style={{ opacity, y, visibility }}>
      <Link
        to="/auth"
        search={{ mode: "signup" }}
        className="landing-hero-cta"
        data-no-drag
      >
        Create your free profile
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <p>Free during the beta · No credit card required</p>
    </motion.div>
  );
}
