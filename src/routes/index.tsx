import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import { PublicNav } from "@/components/Nav";
import heroImg from "@/assets/hero.jpg";
import step1 from "@/assets/step1.jpg";
import step2 from "@/assets/step2.jpg";
import step3 from "@/assets/step3.jpg";
import step4 from "@/assets/step4.jpg";

const WorkflowCanvas = lazy(() =>
  import("@/components/WorkflowCanvas").then(({ WorkflowCanvas: Component }) => ({
    default: Component,
  })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jobly | Find your next good fit" },
      {
        name: "description",
        content: "A calmer, clearer job-matching space for candidates and recruiters.",
      },
      { property: "og:title", content: "Jobly | Find your next good fit" },
      {
        property: "og:description",
        content: "A brighter way to explore opportunities and keep hiring conversations moving.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    accent: "#b8ddd2",
    eyebrow: "Your starting point",
    image: step1,
    number: "01",
    title: "Bring your story.",
    description:
      "Add your resume once, then take a look at the skills and experience already doing the talking for you.",
  },
  {
    accent: "#a3cfc2",
    eyebrow: "Good-fit signals",
    image: step2,
    number: "02",
    title: "Spot the good matches.",
    description:
      "See how a role lines up with your profile before you spend time applying. No mystery numbers, just helpful context.",
  },
  {
    accent: "#86b4a6",
    eyebrow: "A clearer look",
    image: step3,
    number: "03",
    title: "Choose with confidence.",
    description:
      "Keep the requirements, match details, and next steps together, so every decision feels easier to make.",
  },
  {
    accent: "#628c80",
    eyebrow: "Stay connected",
    image: step4,
    number: "04",
    title: "Keep the conversation going.",
    description:
      "Apply, follow your progress, and keep recruiter conversations close to the role that started them.",
  },
] as const;

const WORKSPACE_TILES = [
  "Role brief",
  "Hiring plan",
  "Candidate notes",
  "Shortlist",
  "Work samples",
  "Hiring team",
] as const;

const INTRO_STAGES = ["Welcome", "A clearer way forward"] as const;
const OPPORTUNITY_STAGES = ["Message", "Shape", "Application", "Folder", "Next"] as const;

function Landing() {
  return (
    <main className="bg-cream text-ink">
      <PublicNav dark />
      <IntroSequence />
      <StatementPanel />
      <JourneySection />
      <OpportunitySequence />
      <ClosingCall />
    </main>
  );
}

function IntroSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const backdropOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 0.95], [1, 0.8, 0.5, 0]);
  const backdropScale = useTransform(scrollYProgress, [0, 0.7, 0.95], [1, 1.03, 1.06]);
  const veilOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 0.95], [0.45, 0.35, 0.2, 0]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2, 0.35], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -38]);
  const stageOpacity = useTransform(scrollYProgress, [0.2, 0.4, 0.75, 0.95], [0, 1, 1, 0]);
  const stageScale = useTransform(scrollYProgress, [0.2, 0.45, 0.75, 0.95], [1.2, 1, 1, 0.94]);
  const stageY = useTransform(scrollYProgress, [0.2, 0.45, 0.75, 0.95], [84, 0, 0, -72]);
  const mainRotateY = useTransform(scrollYProgress, [0.2, 0.6], [-14, 0]);
  const mainRotateX = useTransform(scrollYProgress, [0.2, 0.6], [10, 0]);
  const leftX = useTransform(scrollYProgress, [0.2, 0.65], [-180, 0]);
  const leftRotateY = useTransform(scrollYProgress, [0.2, 0.65], [30, -8]);
  const leftOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.75, 0.95], [0, 1, 1, 0]);
  const rightX = useTransform(scrollYProgress, [0.2, 0.65], [180, 0]);
  const rightRotateY = useTransform(scrollYProgress, [0.2, 0.65], [-30, 8]);
  const rightOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.75, 0.95], [0, 1, 1, 0]);
  const reduce = Boolean(shouldReduceMotion);

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    const nextIndex = Math.min(INTRO_STAGES.length - 1, Math.floor(latest * INTRO_STAGES.length));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  return (
    <section id="hero" ref={sectionRef} className="relative bg-[#302f2c]">
      {reduce ? (
        <div className="hidden md:block">
          <IntroFallback />
        </div>
      ) : (
        <div className="relative hidden h-[220vh] md:block">
          <div className="sticky top-0 h-screen overflow-hidden" style={{ perspective: "1500px" }}>
            <motion.img
              src={heroImg}
              alt="Two people working together at a table"
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ opacity: backdropOpacity, scale: backdropScale }}
            />
            <motion.div
              className="absolute inset-0 bg-[#1f2724]"
              aria-hidden="true"
              style={{ opacity: veilOpacity }}
            />
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ opacity: heroOpacity, y: heroY }}
            >
              <HeroMessage />
            </motion.div>
            <motion.div
              className="absolute left-1/2 top-1/2 z-20 h-[74vh] w-[min(66vw,780px)] -translate-x-1/2 -translate-y-1/2"
              style={{
                opacity: stageOpacity,
                scale: stageScale,
                y: stageY,
                transformStyle: "preserve-3d",
              }}
            >
              <motion.figure
                className="absolute left-[-24%] top-[31%] z-20 h-[31%] w-[36%] overflow-hidden bg-white shadow-[0_28px_60px_-26px_rgb(47_48_45_/_0.42)]"
                style={{
                  opacity: leftOpacity,
                  x: leftX,
                  rotateY: leftRotateY,
                  transformStyle: "preserve-3d",
                }}
              >
                <img src={step2} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[#1f2724]/45" />
              </motion.figure>
              <motion.figure
                className="absolute inset-0 z-30 overflow-hidden bg-[#2f302d] shadow-[0_40px_80px_-34px_rgb(47_48_45_/_0.55)]"
                style={{
                  rotateX: reduce ? 0 : mainRotateX,
                  rotateY: reduce ? 0 : mainRotateY,
                  transformStyle: "preserve-3d",
                }}
              >
                <img src={heroImg} alt="" className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-[#1f2724]/45" />
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 text-center text-white sm:inset-x-16">
                  <p className="marker-num text-mint-light">Meet Jobly</p>
                  <h2 className="font-display mt-5 text-[clamp(2.5rem,5.5vw,5.8rem)] font-extrabold text-white [text-shadow:0_4px_28px_rgb(20_30_27_/_0.45)]">
                    Find your next good fit.
                  </h2>
                  <p className="mt-5 max-w-2xl mx-auto text-sm leading-relaxed text-white/88 sm:text-base">
                    A more thoughtful place to turn experience into opportunity, whether you are
                    looking for a role or building a team.
                  </p>
                  <div className="mt-9 flex items-center justify-center gap-4">
                    <Link to="/auth" className="pill-mint text-sm gap-2">
                      Get started
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <a
                      href="#statement"
                      aria-label="Explore Jobly"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 text-white transition-transform duration-200 hover:translate-y-1 hover:bg-white/10"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </motion.figure>
              <motion.figure
                className="absolute right-[-25%] top-[14%] z-40 h-[54%] w-[35%] overflow-hidden bg-white shadow-[0_28px_60px_-26px_rgb(47_48_45_/_0.42)]"
                style={{
                  opacity: rightOpacity,
                  x: rightX,
                  rotateY: rightRotateY,
                  transformStyle: "preserve-3d",
                }}
              >
                <img src={step3} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[#1f2724]/45" />
              </motion.figure>
            </motion.div>
            <ScrollProgressDots stages={INTRO_STAGES} activeIndex={activeIndex} tone="light" />
          </div>
        </div>
      )}
      <div className="md:hidden">
        <IntroFallback />
      </div>
    </section>
  );
}

function HeroMessage() {
  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-28 text-center sm:px-10">
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="marker-num text-mint-light"
      >
        Meet Jobly
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.08 }}
        className="font-display mt-5 max-w-5xl text-[clamp(3.3rem,7vw,7.6rem)] font-extrabold text-white [text-shadow:0_4px_28px_rgb(20_30_27_/_0.45)]"
      >
        Find your next good fit.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18 }}
        className="mt-5 max-w-2xl text-lg leading-relaxed text-white/88 sm:text-xl"
      >
        A more thoughtful place to turn experience into opportunity, whether you are looking for a
        role or building a team.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.28 }}
        className="mt-9 flex flex-wrap items-center justify-center gap-4"
      >
        <Link to="/auth" className="pill-mint-lg gap-2">
          Get started
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a
          href="#statement"
          aria-label="Explore Jobly"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 text-white transition-transform duration-200 hover:translate-y-1 hover:bg-white/10"
        >
          <ArrowDown className="h-5 w-5" aria-hidden="true" />
        </a>
      </motion.div>
    </div>
  );
}

function IntroFallback() {
  return (
    <div>
      <div className="relative flex min-h-[720px] items-center justify-center overflow-hidden bg-[#1f2724]">
        <img
          src={heroImg}
          alt="Two people working together at a table"
          className="absolute inset-0 h-full w-full object-cover object-[center_48%]"
        />
        <div className="absolute inset-0 bg-[#1f2724]/45" aria-hidden="true" />
        <HeroMessage />
      </div>
      <div className="relative overflow-hidden bg-[#eef0ee] px-6 py-20">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="relative mx-auto max-w-sm" style={{ perspective: "900px" }}>
          <figure className="relative z-20 overflow-hidden bg-[#2f302d] shadow-[0_26px_52px_-26px_rgb(47_48_45_/_0.52)]">
            <img
              src={heroImg}
              alt="People considering their next steps together"
              className="aspect-[4/5] w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-[#1f2724]/45" />
            <figcaption className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-white flex flex-col items-center">
              <p className="marker-num text-mint-light">Meet Jobly</p>
              <p className="font-display mt-3 text-4xl font-extrabold">Find your next good fit.</p>
              <p className="mt-3 text-sm leading-relaxed text-white/88 max-w-md">
                A more thoughtful place to turn experience into opportunity.
              </p>
              <Link to="/auth" className="pill-mint text-sm gap-2 mt-5">
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </figcaption>
          </figure>
          <figure className="absolute -left-10 top-[30%] z-10 h-40 w-32 overflow-hidden shadow-soft">
            <img src={step2} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#1f2724]/45" />
          </figure>
          <figure className="absolute -right-10 top-[12%] z-30 h-52 w-32 overflow-hidden shadow-soft">
            <img src={step3} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#1f2724]/45" />
          </figure>
        </div>
      </div>
    </div>
  );
}

function StatementPanel() {
  return (
    <section
      id="statement"
      className="relative overflow-hidden bg-[#302f2c] px-6 py-24 text-white sm:px-10 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute left-[8%] top-[19%] h-24 w-24 rotate-[20deg] border-[9px] border-black/15"
      />
      <div
        aria-hidden="true"
        className="absolute right-[13%] top-[16%] h-24 w-24 rotate-[38deg] border-[9px] border-black/15"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[13%] left-[15%] h-14 w-14 rotate-[17deg] border-[8px] border-black/15"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[12%] right-[11%] h-20 w-20 rounded-full border-[10px] border-black/15"
      />
      <div className="relative mx-auto flex min-h-[540px] max-w-5xl items-center justify-center border border-white/5 bg-[#353431] px-6 py-16 text-center shadow-[0_34px_80px_-38px_rgb(0_0_0_/_0.65)] sm:px-16">
        <div className="max-w-4xl">
          <p className="font-serif text-2xl text-white/84 sm:text-3xl">
            Because the next move matters
          </p>
          <h2 className="font-display mt-8 text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.93]">
            Good work
          </h2>
          <p className="font-serif mt-6 text-2xl text-white/84 sm:text-3xl">starts with</p>
          <h2 className="font-display mt-6 text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.93]">
            a clear picture.
          </h2>
          <p className="mt-12 text-lg text-white/60">
            Your experience, the role, and the people behind it.
          </p>
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const isDesktop = useDesktopCanvas();
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    const nextIndex = Math.min(STEPS.length - 1, Math.floor(latest * STEPS.length));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  const activeStep = STEPS[activeIndex];

  return (
    <section id="journey" ref={sectionRef} className="relative bg-cream">
      <div className="relative hidden h-[400vh] md:block">
        <div className="sticky top-0 h-screen overflow-hidden">
          <WorkflowFallback visible={!isDesktop || !canvasReady} />
          {isDesktop ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-[42%] right-0"
              aria-hidden="true"
            >
              <Suspense fallback={null}>
                <WorkflowCanvas
                  onReady={() => setCanvasReady(true)}
                  reducedMotion={shouldReduceMotion ?? false}
                  scrollProgress={scrollYProgress}
                  steps={STEPS}
                />
              </Suspense>
            </div>
          ) : null}

          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-6 pb-10 pt-28 sm:px-10">
            <div className="max-w-md">
              <p className="marker-num text-ink/60">Your four-step flow</p>
              <motion.div
                key={activeStep.number}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-6"
              >
                <p className="marker-num text-warm">
                  Step {activeStep.number} | {activeStep.eyebrow}
                </p>
                <h2 className="font-display mt-4 text-[clamp(2.5rem,4.5vw,4.8rem)] text-ink">
                  {activeStep.title}
                </h2>
                <p className="mt-5 max-w-sm text-lg leading-relaxed text-ink/72">
                  {activeStep.description}
                </p>
              </motion.div>
            </div>

            <div className="flex items-end justify-between gap-10">
              <ol className="grid max-w-3xl grid-cols-4 gap-x-5 border-t border-ink/20 pt-4">
                {STEPS.map((step, index) => (
                  <li
                    key={step.number}
                    className={index === activeIndex ? "text-ink" : "text-ink/45"}
                  >
                    <span className="marker-num block">{step.number}</span>
                    <span className="mt-1 block text-sm font-semibold leading-snug">
                      {step.eyebrow}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="hidden text-right lg:block">
                <p className="marker-num text-ink/55">Scroll to follow the story</p>
                <div className="mt-3 h-px w-32 bg-ink/20">
                  <motion.div
                    className="h-px origin-left bg-ink"
                    style={{ scaleX: scrollYProgress }}
                  />
                </div>
              </div>
            </div>
          </div>
          <ScrollProgressDots
            stages={STEPS.map((step) => `Step ${step.number}`)}
            activeIndex={activeIndex}
            tone="dark"
          />
        </div>
      </div>

      <div className="px-6 py-20 sm:px-10 md:hidden">
        <p className="marker-num text-ink/60">Your four-step flow</p>
        <h2 className="font-display mt-5 max-w-lg text-[clamp(2.4rem,11vw,4rem)] text-ink">
          A job search that feels more like you.
        </h2>
        <ol className="mt-12 border-t border-ink/15">
          {STEPS.map((step) => (
            <li key={step.number} className="border-b border-ink/15 py-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="marker-num text-warm">Step {step.number}</p>
                  <h3 className="font-display mt-3 text-3xl text-ink">{step.title}</h3>
                </div>
                <span className="marker-num pt-1 text-right text-ink/55">{step.eyebrow}</span>
              </div>
              <p className="mt-4 text-base leading-relaxed text-ink/72">{step.description}</p>
              <div className="mt-6 overflow-hidden border border-border bg-white p-2 shadow-soft">
                <img
                  src={step.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="mt-2 h-1" style={{ backgroundColor: step.accent }} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WorkflowFallback({ visible }: { visible: boolean }) {
  const positions = [
    "left-[52%] top-[23%] z-20 -rotate-[4deg]",
    "right-[9%] top-[15%] z-10 rotate-[8deg] scale-90",
    "right-[17%] bottom-[9%] z-0 rotate-[14deg] scale-75",
    "left-[43%] bottom-[14%] z-10 -rotate-[11deg] scale-90",
  ];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {STEPS.map((step, index) => (
        <figure
          key={step.number}
          className={`absolute h-[360px] w-[270px] border border-border bg-white p-3 shadow-soft lg:h-[420px] lg:w-[315px] ${positions[index]}`}
        >
          <img src={step.image} alt="" className="h-[calc(100%-26px)] w-full object-cover" />
          <figcaption className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: step.accent }} />
            <span className="marker-num text-ink/50">Step {step.number}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function OpportunitySequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sceneFrame, setSceneFrame] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  /* ── Grid tile scatter ── */
  const gridTopY = useTransform(scrollYProgress, [0, 0.14, 0.2, 0.28], [0, 0, -66, -280]);
  const gridBottomY = useTransform(scrollYProgress, [0, 0.14, 0.2, 0.28], [0, 0, 48, 268]);
  const gridTopX = useTransform(scrollYProgress, [0, 0.14, 0.2, 0.28], [0, 0, -26, -150]);
  const gridBottomX = useTransform(scrollYProgress, [0, 0.14, 0.2, 0.28], [0, 0, 32, 158]);

  /* ── Opening text ── */
  const openingCopyY = useTransform(scrollYProgress, [0.09, 0.16], [0, -28]);

  /* ── "Hiring plan" tile in grid: fades out as card appears ── */
  const hiringTileOpacity = useTransform(scrollYProgress, [0, 0.06, 0.1], [1, 1, 0]);

  /* ── Floating card: position, scale, rotation ── */
  const cardOpacity = useTransform(scrollYProgress, [0, 0.06, 0.12], [0, 0, 1]);
  const cardX = useTransform(
    scrollYProgress,
    [0, 0.16, 0.26, 0.36, 0.46, 0.65, 0.73, 0.86, 1],
    [0, 0, 0, -305, -305, -305, -305, -290, -290],
  );
  const cardY = useTransform(
    scrollYProgress,
    [0, 0.16, 0.26, 0.36, 0.46, 0.65, 0.72, 0.8, 0.88, 1],
    [0, 0, 0, -10, -56, -52, 0, 44, 68, 80],
  );
  const cardScaleX = useTransform(
    scrollYProgress,
    [0, 0.06, 0.12, 0.24, 0.36, 0.46, 0.65, 0.8, 1],
    [0.62, 0.62, 0.78, 0.96, 1, 1, 1, 0.72, 0.56],
  );
  const cardScaleY = useTransform(
    scrollYProgress,
    [0, 0.06, 0.12, 0.24, 0.36, 0.46, 0.65, 0.8, 1],
    [0.3, 0.3, 0.52, 0.72, 0.98, 1, 1, 0.68, 0.52],
  );
  const cardRotateY = useTransform(scrollYProgress, [0, 0.24, 0.46, 0.72, 1], [0, -3, 0, -2, -8]);
  const cardRotateX = useTransform(scrollYProgress, [0, 0.26, 0.52, 0.78, 1], [2, 0, 0, 5, 9]);

  /* ── Card inner content fades ── */
  const messageContentY = useTransform(scrollYProgress, [0.14, 0.18], [0, -18]);
  const applicationContentY = useTransform(scrollYProgress, [0.26, 0.32], [24, 0]);

  /* ── Right-side copy ── */
  const rightCopyY = useTransform(scrollYProgress, [0.39, 0.43], [32, 0]);

  /* ── Folder entrance ── */
  const folderX = useTransform(
    scrollYProgress,
    [0.57, 0.63, 0.71, 0.8, 1],
    [-80, -154, -258, -292, -292],
  );
  const folderY = useTransform(scrollYProgress, [0.57, 0.63, 0.71, 0.8, 1], [270, 185, 80, 20, 20]);
  const folderScale = useTransform(
    scrollYProgress,
    [0.57, 0.63, 0.71, 0.8, 1],
    [0.4, 0.58, 0.83, 1, 1],
  );
  const folderRotateY = useTransform(
    scrollYProgress,
    [0.57, 0.63, 0.71, 0.8, 1],
    [16, 11, 4, 0, 0],
  );
  const folderRotateX = useTransform(scrollYProgress, [0.57, 0.63, 0.71, 0.8, 1], [10, 6, 2, 0, 0]);

  /* ── Card slides into folder (peeks from top) ── */
  const cardIntoFolderY = useTransform(scrollYProgress, [0.78, 0.86, 0.94], [0, -60, -120]);
  const cardIntoFolderScale = useTransform(scrollYProgress, [0.78, 0.86, 0.94], [1, 0.68, 0.52]);
  const cardIntoFolderOpacity = useTransform(scrollYProgress, [0.9, 0.97], [1, 0]);

  /* ── Folder copy text ── */
  const folderCopyY = useTransform(scrollYProgress, [0.9, 0.94], [28, 0]);

  const reduce = Boolean(shouldReduceMotion);
  const showWorkspace = sceneFrame < 3;
  const showGrid = sceneFrame < 4;
  const showMessage = sceneFrame >= 2 && sceneFrame < 4;
  const showApplication = sceneFrame >= 4 && sceneFrame < 12;
  const showApplicationCopy = sceneFrame >= 5 && sceneFrame < 10;
  const showFolder = sceneFrame >= 7;
  const showFolderCopy = sceneFrame >= 12;
  const showCardInFolder = sceneFrame >= 10;

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    const nextIndex = Math.min(
      OPPORTUNITY_STAGES.length - 1,
      Math.floor(latest * OPPORTUNITY_STAGES.length),
    );
    const nextFrame = Math.min(13, Math.floor(latest * 14));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
    setSceneFrame((current) => (current === nextFrame ? current : nextFrame));
  });

  return (
    <section id="opportunity-sequence" ref={sectionRef} className="relative bg-[#f6f6f4]">
      {reduce ? (
        <div className="hidden md:block">
          <CollaborationScene />
          <ApplicationScene />
          <FolderScene />
        </div>
      ) : (
        <div className="relative hidden h-[660vh] md:block">
          <div className="sticky top-0 h-screen overflow-hidden" style={{ perspective: "1600px" }}>
            <div className="absolute inset-0 bg-[#f6f6f4]" />
            <motion.img
              src={step4}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ opacity: showWorkspace ? 1 : 0 }}
            />
            <motion.div
              className="absolute inset-0 bg-[#17201e]/80"
              style={{ opacity: showWorkspace ? 1 : 0 }}
            />

            <motion.div
              className="absolute inset-x-0 top-0 z-10 mx-auto max-w-7xl px-10 pt-28"
              style={{ opacity: showWorkspace ? 1 : 0, y: openingCopyY }}
            >
              <p className="marker-num text-mint-light">A shared hiring space</p>
              <h2 className="font-display mt-4 max-w-xl text-[clamp(2.45rem,4.4vw,4.75rem)] leading-[0.98] text-white">
                One message can start a good application.
              </h2>
            </motion.div>

            {/* Grid of 6 equal workspace tiles */}
            <motion.div
              className="absolute inset-x-0 bottom-0 top-[52%] z-10 mx-auto grid max-w-7xl grid-cols-3 gap-4 px-10"
              style={{ opacity: showGrid ? 1 : 0 }}
            >
              {WORKSPACE_TILES.map((title, index) => (
                <motion.article
                  key={title}
                  className="min-h-32 border border-white/15 bg-[#f7f8f6]/95 p-5 text-[#2f302d] shadow-[0_20px_40px_-26px_rgb(0_0_0_/_0.5)]"
                  style={{
                    x: index < 3 ? gridTopX : gridBottomX,
                    y: index < 3 ? gridTopY : gridBottomY,
                    opacity: index === 1 ? hiringTileOpacity : 1,
                  }}
                >
                  <p className="text-sm font-semibold">{title}</p>
                  <div className="mt-6 space-y-2.5">
                    <div className="h-2 w-4/5 bg-[#2f302d]/15" />
                    <div className="h-2 w-full bg-[#2f302d]/10" />
                    <div className="h-2 w-3/5 bg-[#2f302d]/10" />
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {/* Floating card — starts invisible, fades in as Hiring plan tile fades out */}
            <motion.div
              className="absolute left-1/2 top-[58%] z-30 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-[#d9ddd9] bg-[#fffefd] text-[#2f302d] shadow-[0_36px_70px_-32px_rgb(47_48_45_/_0.55)]"
              style={{
                opacity: showCardInFolder ? cardIntoFolderOpacity : cardOpacity,
                x: cardX,
                y: showCardInFolder ? cardIntoFolderY : cardY,
                scaleX: cardScaleX,
                scaleY: showCardInFolder ? cardIntoFolderScale : cardScaleY,
                rotateY: cardRotateY,
                rotateX: cardRotateX,
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
              }}
            >
              <motion.div
                className="absolute inset-0 flex flex-col justify-center p-9"
                style={{ opacity: showMessage ? 1 : 0, y: messageContentY }}
              >
                <p className="marker-num text-[#628c80]">Candidate message</p>
                <p className="mt-3 text-2xl font-semibold">Ari Patel</p>
                <p className="mt-4 max-w-md text-xl leading-relaxed text-[#2f302d]/72">
                  The fit looks strong. I would love to hear more about the product work.
                </p>
              </motion.div>
              <motion.div
                className="absolute inset-0 p-9"
                style={{
                  opacity: showApplication || showCardInFolder ? 1 : 0,
                  y: applicationContentY,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="marker-num text-[#628c80]">Jobly application</p>
                    <p className="font-display mt-2 text-4xl">Ari Patel</p>
                  </div>
                  <span className="rounded-full bg-[#d7ebe4] px-3 py-1 text-xs font-bold text-[#40685e]">
                    Submitted
                  </span>
                </div>
                <p className="mt-3 text-base text-[#2f302d]/64">Senior React Developer</p>
                <div className="mt-7 space-y-3">
                  <div className="h-2 w-full bg-[#2f302d]/15" />
                  <div className="h-2 w-4/5 bg-[#2f302d]/11" />
                  <div className="h-2 w-3/5 bg-[#2f302d]/11" />
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="border border-[#d9ddd9] p-3">
                    <p className="text-xs text-[#2f302d]/48">Match</p>
                    <p className="mt-2 text-xl font-bold">Strong</p>
                  </div>
                  <div className="border border-[#d9ddd9] p-3">
                    <p className="text-xs text-[#2f302d]/48">Status</p>
                    <p className="mt-2 text-xl font-bold">Applied</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right-side copy: "Turn a good signal…" */}
            <motion.div
              className="absolute left-[62%] top-[25%] z-20 w-[min(28vw,390px)]"
              style={{ opacity: showApplicationCopy ? 1 : 0, y: rightCopyY }}
            >
              <p className="marker-num text-[#628c80]">A message becomes a move</p>
              <h2 className="font-display mt-5 text-[clamp(2.65rem,4vw,4.7rem)] leading-[0.98]">
                Turn a good signal into a complete application.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink/68">
                The role, the reason it fits, and the work behind the candidate stay together from
                the first note to the submitted application.
              </p>
            </motion.div>

            {/* Folder — back panel */}
            <motion.div
              className="absolute left-1/2 top-1/2 z-20 h-[500px] w-[590px] -translate-x-1/2 -translate-y-1/2"
              style={{
                opacity: showFolder ? 1 : 0,
                x: folderX,
                y: folderY,
                scale: folderScale,
                rotateY: folderRotateY,
                rotateX: folderRotateX,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute bottom-0 left-[7%] right-[4%] h-[55%] border border-[#86b4a6] bg-[#a3cfc2] shadow-[0_28px_60px_-30px_rgb(47_48_45_/_0.42)]">
                <div className="absolute -top-10 left-8 h-10 w-[42%] rounded-t-sm border border-b-0 border-[#86b4a6] bg-[#a3cfc2]" />
              </div>
            </motion.div>
            {/* Folder — front flap (overlays card as it slides in) */}
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 z-40 h-[500px] w-[590px] -translate-x-1/2 -translate-y-1/2"
              style={{
                opacity: showFolder ? 1 : 0,
                x: folderX,
                y: folderY,
                scale: folderScale,
                rotateY: folderRotateY,
                rotateX: folderRotateX,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute bottom-0 left-[7%] right-[4%] h-[49%] border border-[#86b4a6] bg-[#b8ddd2]"
                style={{ clipPath: "polygon(0 13%, 100% 0, 100% 100%, 0 100%)" }}
              />
            </motion.div>

            {/* Folder copy text: "File the application…" */}
            <motion.div
              className="absolute left-[62%] top-[25%] z-50 w-[min(28vw,390px)]"
              style={{ opacity: showFolderCopy ? 1 : 0, y: folderCopyY }}
            >
              <p className="marker-num text-[#628c80]">Keep the momentum</p>
              <h2 className="font-display mt-5 text-[clamp(2.65rem,4vw,4.7rem)] leading-[0.98]">
                File the application without losing the story.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink/68">
                Every application stays linked to the role, the conversation, and the evidence that
                made it relevant in the first place.
              </p>
            </motion.div>

            <ScrollProgressDots
              stages={OPPORTUNITY_STAGES}
              activeIndex={activeIndex}
              tone={activeIndex === 0 ? "light" : "dark"}
            />
          </div>
        </div>
      )}

      <div className="md:hidden">
        <CollaborationScene />
        <ApplicationScene />
        <FolderScene />
      </div>
    </section>
  );
}

function CollaborationScene() {
  return (
    <div className="relative isolate flex h-full min-h-[720px] items-center overflow-hidden bg-[#202826] px-6 py-16 text-white sm:px-10 sm:py-20">
      <img
        src={step4}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 -z-10 bg-[#17201e]/72" aria-hidden="true" />
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <p className="marker-num text-mint-light">A shared hiring space</p>
          <h2 className="font-display mt-4 text-[clamp(2.6rem,5vw,5.3rem)]">
            One message can start a good application.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
            Keep the role, candidate notes, and the next conversation close enough that a clear
            signal can become a clear next step.
          </p>
        </div>
        <div className="relative mt-9 grid gap-4 md:grid-cols-3 lg:mt-12">
          {WORKSPACE_TILES.map((title, index) => (
            <article
              key={title}
              className="min-h-36 border border-white/15 bg-[#f7f8f6]/90 p-5 text-[#2f302d] shadow-[0_20px_40px_-26px_rgb(0_0_0_/_0.5)] lg:min-h-40 lg:p-6"
            >
              <p className="text-sm font-semibold">{title}</p>
              <div className="mt-5 space-y-2.5">
                <div className="h-2 w-4/5 bg-[#2f302d]/15" />
                <div className="h-2 w-full bg-[#2f302d]/10" />
                <div className="h-2 w-3/5 bg-[#2f302d]/10" />
              </div>
              {index === 3 ? (
                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="h-8 bg-[#b8ddd2]" />
                  <div className="h-8 bg-[#d7ebe4]" />
                  <div className="h-8 bg-[#86b4a6]" />
                </div>
              ) : null}
              {index === 5 ? (
                <div className="mt-6 flex gap-2">
                  {Array.from({ length: 4 }).map((_, avatarIndex) => (
                    <span key={avatarIndex} className="h-8 w-8 rounded-full bg-[#b8ddd2]" />
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          <aside className="relative z-10 mx-auto -mt-4 w-full max-w-xl border-t-8 border-[#86b4a6] bg-white p-6 text-[#2f302d] shadow-[0_28px_60px_-26px_rgb(0_0_0_/_0.55)] md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:p-7">
            <p className="marker-num text-[#628c80]">Candidate message</p>
            <p className="font-semibold">Ari Patel</p>
            <p className="mt-2 text-lg text-[#2f302d]/72">
              The fit looks strong. I would love to hear more about the product work.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ApplicationScene() {
  return (
    <div className="relative flex h-full min-h-[720px] items-center overflow-hidden bg-[#f6f6f4] px-6 py-16 sm:px-10 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[46%] w-[42%] bg-[#353430]"
        style={{ clipPath: "polygon(0 36%, 100% 0, 100% 100%, 0 100%)" }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.75fr)] lg:items-center">
        <div
          className="relative mx-auto h-[470px] w-full max-w-[500px] sm:h-[540px]"
          style={{ perspective: "1400px" }}
        >
          <div
            aria-hidden="true"
            className="absolute left-[6%] top-6 h-[82%] w-[80%] rotate-[-8deg] border border-[#d9ddd9] bg-white/50 shadow-[0_30px_60px_-34px_rgb(47_48_45_/_0.42)]"
          />
          <article className="absolute left-[16%] top-12 z-10 h-[84%] w-[80%] overflow-hidden border border-[#d9ddd9] bg-[#fffefd] p-7 text-[#2f302d] shadow-[0_36px_70px_-32px_rgb(47_48_45_/_0.55)] sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="marker-num text-[#628c80]">Jobly application</p>
                <h3 className="font-display mt-2 text-[clamp(2rem,3vw,3rem)]">Ari Patel</h3>
              </div>
              <span className="rounded-full bg-[#d7ebe4] px-3 py-1 text-xs font-bold text-[#40685e]">
                Submitted
              </span>
            </div>
            <p className="mt-3 text-base text-[#2f302d]/64">Senior React Developer</p>
            <div className="mt-8 space-y-3">
              <div className="h-2 w-full bg-[#2f302d]/15" />
              <div className="h-2 w-4/5 bg-[#2f302d]/11" />
              <div className="h-2 w-3/5 bg-[#2f302d]/11" />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="border border-[#d9ddd9] p-3">
                <p className="text-xs text-[#2f302d]/48">Match</p>
                <p className="mt-2 text-xl font-bold">Strong</p>
              </div>
              <div className="border border-[#d9ddd9] p-3">
                <p className="text-xs text-[#2f302d]/48">Status</p>
                <p className="mt-2 text-xl font-bold">Applied</p>
              </div>
            </div>
            <img
              src={step1}
              alt=""
              className="absolute bottom-0 left-0 h-[27%] w-full object-cover opacity-45"
            />
          </article>
        </div>
        <div className="max-w-xl lg:pl-8">
          <p className="marker-num">A message becomes a move</p>
          <h2 className="font-display mt-5 text-[clamp(2.8rem,5vw,5.4rem)]">
            Turn a good signal into a complete application.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/68">
            The role, the reason it fits, and the work behind the candidate stay together from the
            first note to the submitted application.
          </p>
          <Link to="/auth" className="pill-mint mt-8 gap-2">
            Start your profile
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

type FolderSceneProps = {
  applicationX?: MotionValue<number>;
  applicationY?: MotionValue<number>;
  applicationScale?: MotionValue<number>;
  applicationOpacity?: MotionValue<number>;
  folderLift?: MotionValue<number>;
};

function FolderScene({
  applicationX,
  applicationY,
  applicationScale,
  applicationOpacity,
  folderLift,
}: FolderSceneProps) {
  return (
    <div className="relative flex h-full min-h-[720px] items-center overflow-hidden bg-[#edf1ef] px-6 py-16 sm:px-10 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute right-[-8%] top-[-10%] h-80 w-80 rounded-full border-[34px] border-[#b8ddd2]/35"
      />
      <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)] lg:items-center">
        <div className="relative mx-auto h-[460px] w-full max-w-[540px] sm:h-[530px]">
          <motion.div
            className="absolute bottom-[9%] left-[8%] right-[5%] z-10 h-[48%] border border-[#86b4a6] bg-[#a3cfc2] shadow-[0_28px_60px_-30px_rgb(47_48_45_/_0.42)]"
            style={{ y: folderLift ?? 0 }}
          >
            <div className="absolute -top-9 left-8 h-9 w-[42%] rounded-t-sm border border-b-0 border-[#86b4a6] bg-[#a3cfc2]" />
          </motion.div>
          <motion.article
            className="absolute left-[12%] top-[10%] z-20 h-[58%] w-[62%] border border-[#d9ddd9] bg-[#fffefd] p-6 text-[#2f302d] shadow-[0_30px_60px_-30px_rgb(47_48_45_/_0.5)]"
            style={{
              x: applicationX ?? 0,
              y: applicationY ?? 0,
              scale: applicationScale ?? 1,
              opacity: applicationOpacity ?? 1,
            }}
          >
            <p className="marker-num text-[#628c80]">Application</p>
            <p className="font-display mt-3 text-3xl">Ari Patel</p>
            <p className="mt-2 text-sm text-[#2f302d]/62">Senior React Developer</p>
            <div className="mt-7 space-y-2.5">
              <div className="h-2 w-full bg-[#2f302d]/15" />
              <div className="h-2 w-4/5 bg-[#2f302d]/10" />
              <div className="h-2 w-3/5 bg-[#2f302d]/10" />
            </div>
          </motion.article>
          <div
            aria-hidden="true"
            className="absolute bottom-[9%] left-[8%] right-[5%] z-30 h-[27%] border border-[#86b4a6] bg-[#b8ddd2]"
            style={{ clipPath: "polygon(0 18%, 100% 0, 100% 100%, 0 100%)" }}
          />
        </div>
        <div className="max-w-xl lg:pl-8">
          <p className="marker-num">Keep the momentum</p>
          <h2 className="font-display mt-5 text-[clamp(2.8rem,5vw,5.4rem)]">
            File the application without losing the story.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/68">
            As work moves forward, every application stays connected to the role, the conversation,
            and the evidence that made it relevant.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileScene() {
  return (
    <div className="flex h-full min-h-[720px] items-center bg-[#f7f7f5] px-6 py-16 sm:px-10 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.7fr)] lg:items-center">
        <div className="relative mx-auto w-full max-w-[460px] shadow-[0_30px_64px_-32px_rgb(47_48_45_/_0.5)] lg:max-w-[500px]">
          <img
            src={step1}
            alt="Resume on a desk"
            className="aspect-[4/5] w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[#f6f8f6]/50" />
          <div
            aria-hidden="true"
            className="absolute left-[13%] top-[12%] h-14 w-14 rounded-full border-[10px] border-[#86b4a6]/75"
          />
          <div
            aria-hidden="true"
            className="absolute right-[14%] top-[20%] h-9 w-9 rotate-[10deg] border-[8px] border-[#86b4a6]/75"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[24%] right-[13%] h-0 w-0 border-b-[28px] border-l-[22px] border-r-[22px] border-b-[#86b4a6]/75 border-l-transparent border-r-transparent"
          />
          <div className="absolute inset-x-[12%] top-[35%] border-[8px] border-[#86b4a6] bg-[#86b4a6]/90 px-6 py-10 text-center text-white sm:px-10">
            <p className="font-serif text-lg">Your profile</p>
            <p className="font-display mt-4 text-[clamp(2.3rem,5vw,4.8rem)]">Your next chapter</p>
            <p className="mt-4 text-sm text-white/85">
              Keep the work you are proud of close to the roles that deserve it.
            </p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="marker-num">The details stay yours</p>
          <h2 className="font-display mt-5 text-[clamp(2.6rem,5vw,5rem)]">
            One profile. A better starting point.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/68">
            Jobly keeps your resume, fit evidence, applications, and recruiter conversations in the
            same calm workspace.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScrollProgressDots({
  stages,
  activeIndex,
  tone,
}: {
  stages: readonly string[];
  activeIndex: number;
  tone: "light" | "dark";
}) {
  const isLight = tone === "light";

  return (
    <ol
      aria-label="Scroll progress"
      className="absolute right-8 top-1/2 z-50 hidden -translate-y-1/2 gap-3 lg:grid"
    >
      {stages.map((stage, index) => {
        const isActive = index === activeIndex;
        const labelClass = isLight
          ? "text-white/0 group-hover:text-white/70"
          : "text-ink/0 group-hover:text-ink/60";
        const dotClass = isActive
          ? isLight
            ? "scale-125 border-white bg-white shadow-[0_0_0_5px_rgb(255_255_255_/_0.18)]"
            : "scale-125 border-ink bg-ink shadow-[0_0_0_5px_rgb(47_48_45_/_0.12)]"
          : isLight
            ? "border-white/50 bg-white/25"
            : "border-ink/30 bg-ink/30";

        return (
          <li
            key={stage}
            aria-current={isActive ? "step" : undefined}
            className="group relative flex justify-end"
          >
            <span
              className={`pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold transition-colors duration-200 ${labelClass}`}
            >
              {stage}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${dotClass}`}
            />
          </li>
        );
      })}
    </ol>
  );
}

function ClosingCall() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-[#302f2c] px-6 py-20 text-white sm:px-10 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1fr)] lg:items-end">
        <div className="relative mx-auto h-[520px] w-full max-w-sm">
          <PaperMockup
            className="absolute left-0 top-8 h-[450px] w-[88%] rotate-[-6deg] opacity-35"
            label="Jobly"
            title="Your profile"
          />
          <PaperMockup
            className="absolute right-0 top-0 z-10 h-[470px] w-[88%] shadow-[0_28px_64px_-28px_rgb(0_0_0_/_0.75)]"
            label="Jobly"
            title="A good next move"
            image={step4}
          />
        </div>
        <div className="max-w-2xl lg:pb-8">
          <p className="marker-num text-mint-light">Start where you are</p>
          <h2 className="font-display mt-5 text-[clamp(3rem,6vw,6rem)]">
            Make the next move a good one.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            Build a profile that does you justice, find roles with real context, or bring a hiring
            team into one shared view.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/auth" search={{ mode: "signup" }} className="pill-mint-lg gap-2">
              Create your Jobly account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex min-h-12 items-center px-3 text-sm font-semibold text-white/85 transition-colors hover:text-mint"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaperMockup({
  className = "",
  image,
  label,
  title,
}: {
  className?: string;
  image?: string;
  label: string;
  title: string;
}) {
  return (
    <div
      className={`overflow-hidden border border-[#d9ddd9] bg-[#fffefd] p-7 text-[#2f302d] ${className}`}
    >
      <p className="text-sm text-[#2f302d]/45">{label}</p>
      <p className="font-display mt-2 text-[clamp(1.7rem,3vw,2.7rem)]">{title}</p>
      <div className="mt-9 space-y-3">
        <div className="h-2 w-full bg-[#2f302d]/15" />
        <div className="h-2 w-4/5 bg-[#2f302d]/11" />
        <div className="h-2 w-3/5 bg-[#2f302d]/11" />
      </div>
      <p className="mt-8 text-sm font-semibold">What matters most</p>
      <div className="mt-4 space-y-2.5">
        <div className="h-2 w-full bg-[#2f302d]/12" />
        <div className="h-2 w-[92%] bg-[#2f302d]/10" />
        <div className="h-2 w-2/3 bg-[#2f302d]/10" />
      </div>
      {image ? (
        <img
          src={image}
          alt=""
          className="absolute bottom-0 left-0 h-[34%] w-full object-cover opacity-65"
        />
      ) : (
        <div className="absolute bottom-8 left-7 right-7 h-20 bg-[#b8ddd2]" />
      )}
    </div>
  );
}

function useDesktopCanvas() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
