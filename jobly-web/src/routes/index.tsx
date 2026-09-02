import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { LandingNav } from "@/components/Nav";
import { Preloader } from "@/components/landing/Preloader";
import { SignupMorph } from "@/components/landing/SignupMorph";
import heroImg from "@/assets/hero.jpg";
import step4 from "@/assets/step4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jobly | Great hires start with great interviews" },
      {
        name: "description",
        content: "A live, evidence-grounded interview room for technical hiring.",
      },
      { property: "og:title", content: "Jobly | Great hires start with great interviews" },
      {
        property: "og:description",
        content: "Collaborative coding, whiteboarding, and evidence-based scorecards in one calm room.",
      },
    ],
  }),
  component: Landing,
});

/* ─────────────────────────────────────────────────────────────
   Scene model — one entry per scroll scene (Beagle structure)
   ───────────────────────────────────────────────────────────── */

type SceneTheme = "dark" | "light" | "mint";

interface SceneMeta {
  id: string;
  label: string;
  theme: SceneTheme;
}

const SCENES: SceneMeta[] = [
  { id: "introducing", label: "Welcome", theme: "dark" },
  { id: "belief", label: "Why interviews", theme: "dark" },
  { id: "schedule", label: "Schedule", theme: "mint" },
  { id: "live-room", label: "Live room", theme: "light" },
  { id: "signals", label: "Signals", theme: "dark" },
  { id: "collaborate", label: "Decide", theme: "light" },
  { id: "done", label: "Wrap up", theme: "dark" },
];

const DARK = "#302f2c";
const PANEL_DARK = "#353431";
const MINT_PANEL = "#a3cfc2";
const MINT_FLAP = "#b8ddd2";
const MINT_DEEP = "#628c80";
const INK_SOFT = "#2f302d";
const PAPER = "#fffefd";
const PAPER_LINE = "#d9ddd9";

const serifClass = "font-serif";
const displayClass = "font-display font-extrabold";

/* ─────────────────────────────────────────────────────────────
   Landing shell — preloader, nav, scenes, sidenav, finale
   ───────────────────────────────────────────────────────────── */

function Landing() {
  const [revealed, setRevealed] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const [navLight, setNavLight] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealed) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [revealed]);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
    const finaleEl = document.getElementById("signup");
    if (finaleEl) sections.push(finaleEl);
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }
        let bestId: string | null = null;
        let bestRatio = -1;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId) {
          if (bestId === "signup") {
            /* Finale: light features panel on the left under the nav. */
            setNavLight(true);
            return;
          }
          const index = SCENES.findIndex((scene) => scene.id === bestId);
          if (index >= 0) {
            setActiveScene((current) => (current === index ? current : index));
            setNavLight(SCENES[index].theme === "light");
          }
        }
      },
      { threshold: [0.25, 0.5, 0.75] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const activeTheme = SCENES[activeScene]?.theme ?? "dark";

  return (
    <main className="bg-cream text-ink">
      {!revealed ? <Preloader onDone={() => setRevealed(true)} /> : null}
      <LandingNav light={navLight} revealed={revealed} />
      <div ref={mainRef}>
        <IntroducingScene />
        <BeliefScene />
        <ScheduleScene />
        <LiveRoomScene />
        <SignalsScene />
        <CollaborateScene />
        <DoneScene />
      </div>
      <FinaleSection activeTheme={activeTheme} />
      <SideNav activeIndex={activeScene} />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene 1 — Introducing (dark photo, title + serif subtitle)
   ───────────────────────────────────────────────────────────── */

function IntroducingScene() {
  const reduce = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const photoOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.7, 0.35]);
  const copyY = useTransform(scrollYProgress, [0, 0.6], [0, -90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      id={SCENES[0].id}
      data-scene
      ref={sectionRef}
      className="relative h-[160vh] bg-[#302f2c]"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.img
          src={heroImg}
          alt="Two people working together at a table"
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={
            reduce
              ? undefined
              : { scale: photoScale, opacity: photoOpacity }
          }
        />
        <div className="absolute inset-0 bg-[#1f2724]/55" aria-hidden="true" />
        <motion.div
          className="relative z-10 px-6 text-center text-white"
          style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
        >
          <motion.h2
            className={`${displayClass} text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.98]`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            Introducing Jobly
          </motion.h2>
          <motion.p
            className={`${serifClass} mt-5 text-lg text-white/85 sm:text-2xl`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            The live interview room for fair technical hiring
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene 2 — Belief statement (pattern panel, staggered lines)
   ───────────────────────────────────────────────────────────── */

function BeliefScene() {
  const reduce = Boolean(useReducedMotion());

  return (
    <section
      id={SCENES[1].id}
      data-scene
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#302f2c] px-6 py-24 sm:px-10"
    >
      <div
        aria-hidden="true"
        className="absolute left-[7%] top-[16%] h-24 w-24 rotate-[20deg] border-[9px] border-black/15"
      />
      <div
        aria-hidden="true"
        className="absolute right-[12%] top-[14%] h-24 w-24 rotate-[38deg] border-[9px] border-black/15"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[14%] left-[14%] h-14 w-14 rotate-[17deg] border-[8px] border-black/15"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[12%] right-[10%] h-20 w-20 rounded-full border-[10px] border-black/15"
      />

      <div className="relative mx-auto max-w-4xl text-center text-white">
        {reduce ? (
          <BeliefLines />
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.22 } },
            }}
          >
            <BeliefLines />
          </motion.div>
        )}
        <p className="mt-16 text-lg text-white/60 sm:text-xl">
          Here&rsquo;s how Jobly works:
        </p>
      </div>
    </section>
  );
}

function BeliefLines() {
  const line = (children: React.ReactNode, big = false) =>
    big ? (
      <motion.h2
        className={`${displayClass} text-[clamp(3rem,8vw,7.5rem)] leading-[0.93]`}
        variants={{ hidden: { opacity: 0, y: 34 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.6 }}
      >
        {children}
      </motion.h2>
    ) : (
      <motion.p
        className={`${serifClass} text-2xl text-white/84 sm:text-3xl`}
        variants={{ hidden: { opacity: 0, y: 26 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.55 }}
      >
        {children}
      </motion.p>
    );

  return (
    <>
      {line("Because we believe")}
      <div className="mt-8">{line("Great Hires", true)}</div>
      <div className="mt-6">{line("Start With")}</div>
      <div className="mt-8">{line("Great Interviews", true)}</div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared scroll-scene machinery for the five product scenes
   ───────────────────────────────────────────────────────────── */

interface ProductSceneProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  paperClassName?: string;
  copyClassName?: string;
  backgroundImage?: string;
}

function ProductScene({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
  paperClassName = "",
  copyClassName = "",
  backgroundImage,
}: ProductSceneProps) {
  const reduce = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const paperY = useTransform(scrollYProgress, [0.1, 0.45], ["62vh", "0vh"]);
  const paperRotateX = useTransform(scrollYProgress, [0.1, 0.45], [16, 0]);
  const paperScale = useTransform(scrollYProgress, [0.1, 0.45], [0.86, 1]);
  const paperOpacity = useTransform(scrollYProgress, [0.08, 0.22], [0, 1]);

  const copyOpacity = useTransform(scrollYProgress, [0.3, 0.45, 0.85, 0.95], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0.3, 0.5], [40, 0]);

  return (
    <section
      id={id}
      data-scene
      ref={sectionRef}
      className={`relative h-[260vh] ${className}`}
    >
      <div
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
        style={{ perspective: "1500px" }}
      >
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          </>
        ) : null}

        <motion.div
          className={`relative z-10 mx-auto w-full max-w-lg ${paperClassName}`}
          style={
            reduce
              ? undefined
              : {
                  y: paperY,
                  rotateX: paperRotateX,
                  scale: paperScale,
                  opacity: paperOpacity,
                  transformStyle: "preserve-3d",
                }
          }
          initial={reduce ? { opacity: 0 } : undefined}
          whileInView={reduce ? { opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.3 }}
        >
          {children}
        </motion.div>

        <motion.div
          className={`absolute z-20 max-w-md px-6 ${copyClassName}`}
          style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
        >
          <p className="marker-num opacity-80">{eyebrow}</p>
          <h2 className={`${displayClass} mt-4 text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.98]`}>
            {title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed opacity-80">{description}</p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene 3 — Schedule (mint theme, schedule-card paper)
   ───────────────────────────────────────────────────────────── */

function ScheduleScene() {
  return (
    <ProductScene
      id={SCENES[2].id}
      eyebrow="Set the stage"
      title="Schedule in one click."
      description="Pick the role, pick the candidate, and Jobly mints a live room with the problem, the tools, and the team already in place."
      className="bg-[#a3cfc2]"
      copyClassName="left-6 top-[10%] text-ink sm:left-[7%] lg:left-[10%]"
    >
      <div className="relative aspect-[4/5] border border-[#86b4a6] bg-[#fffefd] p-7 text-[#2f302d] shadow-[0_40px_80px_-34px_rgb(0_0_0_/_0.55)] sm:p-9">
        <p className="text-sm text-[#2f302d]/45">Jobly interview</p>
        <p className={`${displayClass} mt-2 text-3xl sm:text-4xl`}>Senior React Developer</p>
        <p className="mt-2 text-sm text-[#2f302d]/60">with Ari Patel</p>

        <div className="mt-8 space-y-3">
          <div className="h-2 w-full bg-[#2f302d]/15" />
          <div className="h-2 w-4/5 bg-[#2f302d]/11" />
          <div className="h-2 w-3/5 bg-[#2f302d]/11" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="border border-[#d9ddd9] p-3">
            <p className="text-xs text-[#2f302d]/48">Room</p>
            <p className="mt-2 font-num text-sm font-bold">live-4f2a</p>
          </div>
          <div className="border border-[#d9ddd9] p-3">
            <p className="text-xs text-[#2f302d]/48">When</p>
            <p className="mt-2 font-num text-sm font-bold">Tomorrow · 10:00</p>
          </div>
        </div>

        <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between border-t border-[#d9ddd9] pt-5">
          <span className="rounded-full bg-[#d7ebe4] px-3 py-1 text-xs font-bold text-[#40685e]">
            Ready
          </span>
          <span className="font-num text-xs text-[#2f302d]/45">Scheduled by Sarah</span>
        </div>
      </div>
    </ProductScene>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene 4 — Live room (paper theme, IDE paper rising)
   ───────────────────────────────────────────────────────────── */

function LiveRoomScene() {
  const reduce = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const paperY = useTransform(scrollYProgress, [0.08, 0.4], ["64vh", "0vh"]);
  const paperRotateX = useTransform(scrollYProgress, [0.08, 0.4], [14, 0]);
  const paperScale = useTransform(scrollYProgress, [0.08, 0.4], [0.88, 1]);
  const paperOpacity = useTransform(scrollYProgress, [0.06, 0.2], [0, 1]);

  const copyOpacity = useTransform(scrollYProgress, [0.32, 0.48, 0.85, 0.95], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0.32, 0.52], [40, 0]);

  const tabHighlight = useTransform(scrollYProgress, [0.45, 0.55], [0, 1]);
  const codeLineProgress = useTransform(scrollYProgress, [0.4, 0.75], [0, 1]);

  return (
    <section
      id={SCENES[3].id}
      data-scene
      ref={sectionRef}
      className="relative h-[260vh] bg-[#f2f2f2]"
    >
      <div
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
        style={{ perspective: "1500px" }}
      >
        <motion.div
          className="relative z-10 mx-auto w-full max-w-2xl"
          style={
            reduce
              ? undefined
              : {
                  y: paperY,
                  rotateX: paperRotateX,
                  scale: paperScale,
                  opacity: paperOpacity,
                  transformStyle: "preserve-3d",
                }
          }
          initial={reduce ? { opacity: 0 } : undefined}
          whileInView={reduce ? { opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="overflow-hidden border border-[#d9ddd9] bg-[#fffefd] text-[#2f302d] shadow-[0_40px_80px_-34px_rgb(47_48_45_/_0.55)]">
            <div className="flex items-center justify-between border-b border-[#d9ddd9] bg-[#f7f8f6] px-4 py-2.5">
              <div className="flex items-center gap-1">
                {["solution.py", "tests", "notes"].map((tab, index) => (
                  <span
                    key={tab}
                    className={`rounded-md px-3 py-1 font-num text-xs ${
                      index === 0 ? "bg-[#302f2c] text-white" : "text-[#2f302d]/55"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#86b4a6]" />
                <span className="h-2 w-2 rounded-full bg-[#b8ddd2]" />
                <span className="h-2 w-2 rounded-full bg-[#2f302d]/20" />
              </div>
            </div>

            <div className="flex">
              <div className="w-8 border-r border-[#d9ddd9] py-4 text-right">
                <div className="space-y-2.5 pr-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <span key={index} className="font-num block text-[10px] text-[#2f302d]/30">
                      {index + 1}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-2.5 py-4 pl-4 font-num text-xs leading-relaxed">
                <motion.div
                  className="h-2 w-11/12 bg-[#2f302d]/18"
                  style={reduce ? undefined : { scaleX: codeLineProgress, originX: 0 }}
                />
                <div className="h-2 w-9/12 bg-[#2f302d]/11" />
                <div className="h-2 w-10/12 bg-[#2f302d]/11" />
                <div className="ml-4 h-2 w-8/12 bg-[#628c80]/35" />
                <div className="ml-4 h-2 w-7/12 bg-[#628c80]/28" />
                <div className="h-2 w-10/12 bg-[#2f302d]/11" />
                <div className="h-2 w-5/12 bg-[#2f302d]/11" />
                <div className="ml-4 h-2 w-9/12 bg-[#628c80]/28" />
                <div className="h-2 w-6/12 bg-[#2f302d]/11" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#d9ddd9] bg-[#f7f8f6] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#302f2c] px-2.5 py-1 font-num text-xs font-bold text-white">
                  Run
                </span>
                <span className="font-num text-xs text-[#2f302d]/50">python 3.12</span>
              </div>
              <motion.span
                className="font-num text-xs text-[#40685e]"
                style={reduce ? undefined : { opacity: tabHighlight }}
              >
                All tests passing
              </motion.span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute left-6 top-[10%] z-20 max-w-md sm:left-[7%] lg:left-[10%]"
          style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
        >
          <p className="marker-num text-[#628c80]">Run the live room</p>
          <h2
            className={`${displayClass} mt-4 text-[clamp(2.4rem,5vw,4.6rem)] text-ink leading-[0.98]`}
          >
            One room. Every tool.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            Shared IDE, whiteboard, video, and terminal — everything synced in real time for
            both sides of the table.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene 5 — Signals (dark theme + accent, timeline paper)
   ───────────────────────────────────────────────────────────── */

function SignalsScene() {
  const reduce = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const paperY = useTransform(scrollYProgress, [0.08, 0.4], ["64vh", "0vh"]);
  const paperRotateX = useTransform(scrollYProgress, [0.08, 0.4], [16, 0]);
  const paperScale = useTransform(scrollYProgress, [0.08, 0.4], [0.86, 1]);
  const paperOpacity = useTransform(scrollYProgress, [0.06, 0.2], [0, 1]);

  const copyOpacity = useTransform(scrollYProgress, [0.32, 0.48, 0.85, 0.95], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0.32, 0.52], [40, 0]);

  const markerTravel = useTransform(scrollYProgress, [0.4, 0.8], ["0%", "86%"]);

  const EVENTS = [
    { time: "00:42", label: "Clarifying question", tone: "mint" },
    { time: "04:15", label: "Hash map chosen", tone: "mint" },
    { time: "07:30", label: "Tests all passing", tone: "mint" },
    { time: "09:58", label: "Tradeoff explained", tone: "mint" },
  ];

  return (
    <section
      id={SCENES[4].id}
      data-scene
      ref={sectionRef}
      className="relative h-[260vh] bg-[#302f2c]"
    >
      <div
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
        style={{ perspective: "1500px" }}
      >
        <div
          aria-hidden="true"
          className="absolute bottom-[10%] left-[6%] h-16 w-16 rotate-[18deg] border-[8px] border-black/20"
        />

        <motion.div
          className="relative z-10 mx-auto w-full max-w-lg"
          style={
            reduce
              ? undefined
              : {
                  y: paperY,
                  rotateX: paperRotateX,
                  scale: paperScale,
                  opacity: paperOpacity,
                  transformStyle: "preserve-3d",
                }
          }
          initial={reduce ? { opacity: 0 } : undefined}
          whileInView={reduce ? { opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="border border-[#4d4c49] bg-[#fffefd] p-7 text-[#2f302d] shadow-[0_40px_80px_-34px_rgb(0_0_0_/_0.7)] sm:p-9">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#2f302d]/45">Live timeline</p>
                <p className={`${displayClass} mt-2 text-2xl`}>Every signal, kept</p>
              </div>
              <span className="rounded-full bg-[#d7ebe4] px-3 py-1 text-xs font-bold text-[#40685e]">
                Recording
              </span>
            </div>

            <div className="relative mt-8 pb-2">
              <div className="h-[3px] w-full rounded-full bg-[#2f302d]/12" />
              <motion.div
                className="absolute top-0 h-[3px] w-full origin-left rounded-full bg-[#2a9d7b]"
                style={reduce ? undefined : { scaleX: markerTravel }}
              />
              <motion.div
                className="absolute -top-[5px] h-3.5 w-3.5 rounded-full border-2 border-[#fffefd] bg-[#2a9d7b] shadow-[0_2px_8px_rgb(42_157_123_/_0.6)]"
                style={reduce ? undefined : { left: markerTravel }}
              />
            </div>

            <ol className="mt-6 space-y-3">
              {EVENTS.map((event) => (
                <li
                  key={event.time}
                  className="flex items-center justify-between border-b border-[#d9ddd9]/70 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#2a9d7b]" />
                    <span className="text-sm font-semibold">{event.label}</span>
                  </div>
                  <span className="font-num text-xs text-[#2f302d]/45">{event.time}</span>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-6 top-[10%] z-20 max-w-md text-right sm:right-[7%] lg:right-[10%]"
          style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
        >
          <p className="marker-num text-mint-light">Evidence, not memory</p>
          <h2
            className={`${displayClass} mt-4 text-[clamp(2.4rem,5vw,4.6rem)] text-white leading-[0.98]`}
          >
            Capture every signal.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            Checkpoints, transcripts, and code runs stream into one timeline — the interview
            writes its own record.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene 6 — Collaborate / decide (photo bg, scorecard paper)
   ───────────────────────────────────────────────────────────── */

function CollaborateScene() {
  const reduce = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const paperY = useTransform(scrollYProgress, [0.08, 0.4], ["64vh", "0vh"]);
  const paperRotateX = useTransform(scrollYProgress, [0.08, 0.4], [14, 0]);
  const paperScale = useTransform(scrollYProgress, [0.08, 0.4], [0.88, 1]);
  const paperOpacity = useTransform(scrollYProgress, [0.06, 0.2], [0, 1]);

  const copyOpacity = useTransform(scrollYProgress, [0.32, 0.48, 0.85, 0.95], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0.32, 0.52], [40, 0]);

  const barFill = useTransform(scrollYProgress, [0.4, 0.7], ["12%", "88%"]);

  return (
    <section
      id={SCENES[5].id}
      data-scene
      ref={sectionRef}
      className="relative h-[260vh] bg-[#f2f2f2]"
    >
      <div
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
        style={{ perspective: "1500px" }}
      >
        <img
          src={step4}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[#f2f2f2]/55" aria-hidden="true" />

        <motion.div
          className="relative z-10 mx-auto w-full max-w-lg"
          style={
            reduce
              ? undefined
              : {
                  y: paperY,
                  rotateX: paperRotateX,
                  scale: paperScale,
                  opacity: paperOpacity,
                  transformStyle: "preserve-3d",
                }
          }
          initial={reduce ? { opacity: 0 } : undefined}
          whileInView={reduce ? { opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="border border-[#d9ddd9] bg-[#fffefd] p-7 text-[#2f302d] shadow-[0_40px_80px_-34px_rgb(47_48_45_/_0.55)] sm:p-9">
            <p className="text-sm text-[#2f302d]/45">Scorecard</p>
            <p className={`${displayClass} mt-2 text-2xl`}>Four pillars, cited</p>

            <div className="mt-7 space-y-4">
              {["Problem solving", "Code quality", "System design", "Communication"].map(
                (pillar, index) => (
                  <div key={pillar}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{pillar}</span>
                      <span className="font-num text-xs text-[#2f302d]/50">{4 + (index % 2)} / 5</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2f302d]/12">
                      <motion.div
                        className="h-full rounded-full bg-[#628c80]"
                        style={
                          reduce ? { width: "80%" } : { width: barFill }
                        }
                      />
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="mt-7 flex items-center gap-2 border-t border-[#d9ddd9] pt-5">
              <span className="h-2 w-2 rounded-full bg-[#2a9d7b]" />
              <span className="text-xs text-[#2f302d]/55">
                Every score cites timeline evidence
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute left-6 top-[10%] z-20 max-w-md sm:left-[7%] lg:left-[10%]"
          style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
        >
          <p className="marker-num text-[#628c80]">Decide together</p>
          <h2
            className={`${displayClass} mt-4 text-[clamp(2.4rem,5vw,4.6rem)] text-ink leading-[0.98]`}
          >
            Decide with evidence.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            The scorecard links back to the exact moment it happened, so the whole team can
            see the why behind the hire.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene 7 — Done (dark, replay paper)
   ───────────────────────────────────────────────────────────── */

function DoneScene() {
  const reduce = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const paperY = useTransform(scrollYProgress, [0.08, 0.4], ["64vh", "0vh"]);
  const paperRotateX = useTransform(scrollYProgress, [0.08, 0.4], [16, 0]);
  const paperScale = useTransform(scrollYProgress, [0.08, 0.4], [0.86, 1]);
  const paperOpacity = useTransform(scrollYProgress, [0.06, 0.2], [0, 1]);

  const copyOpacity = useTransform(scrollYProgress, [0.32, 0.48, 0.85, 0.95], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0.32, 0.52], [40, 0]);

  const scrubTravel = useTransform(scrollYProgress, [0.42, 0.78], ["0%", "72%"]);

  return (
    <section
      id={SCENES[6].id}
      data-scene
      ref={sectionRef}
      className="relative h-[260vh] bg-[#302f2c]"
    >
      <div
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
        style={{ perspective: "1500px" }}
      >
        <div
          aria-hidden="true"
          className="absolute right-[10%] top-[14%] h-24 w-24 rotate-[24deg] border-[9px] border-black/18"
        />

        <motion.div
          className="relative z-10 mx-auto w-full max-w-lg"
          style={
            reduce
              ? undefined
              : {
                  y: paperY,
                  rotateX: paperRotateX,
                  scale: paperScale,
                  opacity: paperOpacity,
                  transformStyle: "preserve-3d",
                }
          }
          initial={reduce ? { opacity: 0 } : undefined}
          whileInView={reduce ? { opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="border border-[#4d4c49] bg-[#fffefd] p-7 text-[#2f302d] shadow-[0_40px_80px_-34px_rgb(0_0_0_/_0.7)] sm:p-9">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#2f302d]/45">Replay</p>
                <p className={`${displayClass} mt-2 text-2xl`}>Rewind the room</p>
              </div>
              <span className="rounded-full bg-[#d7ebe4] px-3 py-1 text-xs font-bold text-[#40685e]">
                18:24
              </span>
            </div>

            <div className="relative mt-8">
              <div className="h-[3px] w-full rounded-full bg-[#2f302d]/12" />
              {[18, 34, 52, 71, 86].map((left) => (
                <span
                  key={left}
                  className="absolute -top-[3px] h-[9px] w-[2px] rounded bg-[#628c80]"
                  style={{ left: `${left}%` }}
                />
              ))}
              <motion.div
                className="absolute -top-[5px] h-3.5 w-3.5 rounded-full border-2 border-[#fffefd] bg-[#302f2c]"
                style={reduce ? undefined : { left: scrubTravel }}
              />
            </div>

            <div className="mt-7 flex items-center gap-1.5">
              <span className="rounded-full bg-[#302f2c] px-3 py-1.5 font-num text-xs font-bold text-white">
                Play
              </span>
              {["0.5x", "1x", "2x"].map((speed, index) => (
                <span
                  key={speed}
                  className={`rounded-full px-2.5 py-1.5 font-num text-xs ${
                    index === 1 ? "bg-[#d7ebe4] text-[#40685e] font-bold" : "text-[#2f302d]/45"
                  }`}
                >
                  {speed}
                </span>
              ))}
            </div>

            <p className="mt-7 border-t border-[#d9ddd9]/70 pt-5 text-sm leading-relaxed text-[#2f302d]/60">
              Candidates get a practice plan. Recruiters get the evidence. Both sides leave
              with the same story.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-6 top-[10%] z-20 max-w-md text-right sm:right-[7%] lg:right-[10%]"
          style={reduce ? undefined : { opacity: copyOpacity, y: copyY }}
        >
          <p className="marker-num text-mint-light">After the room</p>
          <h2
            className={`${displayClass} mt-4 text-[clamp(2.4rem,5vw,4.6rem)] text-white leading-[0.98]`}
          >
            Done? Replay it.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            Time-travel through the code, the conversation, and the calls that shaped the
            decision.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Finale — features + morph signup (Beagle footer)
   ───────────────────────────────────────────────────────────── */

function FinaleSection({ activeTheme }: { activeTheme: SceneTheme }) {
  return (
    <section
      id="signup"
      className="relative bg-[#302f2c]"
      aria-label="Sign up for Jobly"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-20 sm:px-10 lg:py-32">
          <div className="max-w-md text-[#302f2c]">
            <div
              className={`transition-colors duration-500 ${
                activeTheme === "light" ? "text-[#302f2c]" : "text-[#302f2c]"
              }`}
            >
              <h2 className={`${displayClass} text-4xl leading-[1.05] sm:text-5xl`}>
                Create your own great interviews now
              </h2>
              <ul className="mt-10 space-y-6">
                <FeatureItem title="Free" lines={["during", "beta"]} />
                <FeatureItem title="Unlimited" lines={["interview rooms"]} />
                <FeatureItem
                  title="Plans"
                  lines={["for teams large", "and small (after beta)"]}
                />
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-[#353431] px-6 py-16 sm:px-10 lg:py-32">
          <div className="mx-auto w-full max-w-md">
            <h3 className="text-xl font-bold text-white">
              Sign up for the free beta
              <small className="mt-3 block text-sm font-normal text-white/50">
                Already have an account?{" "}
                <Link to="/auth" className="underline underline-offset-2 hover:text-white">
                  Sign in
                </Link>
              </small>
            </h3>

            <div className="mt-10">
              <SignupMorph />
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
              <Link to="/auth" className="transition-colors hover:text-white">
                Log in
              </Link>
              <span aria-hidden="true">·</span>
              <a href="#main" className="transition-colors hover:text-white">
                Back to top
              </a>
              <span aria-hidden="true">·</span>
              <span>Jobly — fair technical hiring</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ title, lines }: { title: string; lines: string[] }) {
  return (
    <li className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-current"
      >
        <span className="h-3.5 w-3.5 rounded-sm bg-current" />
      </span>
      <p className="text-lg font-semibold leading-snug">
        {title}
        <br />
        <span className="font-normal opacity-75">{lines.join(" ")}</span>
      </p>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sidenav — Beagle dots (right edge, hover labels)
   ───────────────────────────────────────────────────────────── */

function SideNav({ activeIndex }: { activeIndex: number }) {
  const activeTheme = SCENES[activeIndex]?.theme;
  /* Dots sit on light surfaces (paper/mint scenes) vs dark ones. */
  const onLight = activeTheme === "light" || activeTheme === "mint";

  return (
    <nav
      aria-label="Scene progress"
      className="fixed right-8 top-1/2 z-50 hidden -translate-y-1/2 lg:block"
    >
      <ol className="space-y-2">
        {SCENES.map((scene, index) => {
          const isActive = index === activeIndex;

          return (
            <li key={scene.id} className="group relative flex justify-end">
              <span
                className={`pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold transition-all duration-200 ${
                  onLight ? "text-ink/0 group-hover:text-ink/60" : "text-white/0 group-hover:text-white/70"
                } ${isActive ? (onLight ? "!text-ink/80" : "!text-white/90") : ""}`}
              >
                {scene.label}
              </span>
              <span
                aria-hidden="true"
                className={`h-[6px] w-[6px] rounded-full transition-all duration-300 ${
                  isActive
                    ? onLight
                      ? "scale-125 bg-ink shadow-[0_0_0_4px_rgb(47_48_45_/_0.15)]"
                      : "scale-125 bg-white shadow-[0_0_0_4px_rgb(255_255_255_/_0.18)]"
                    : onLight
                      ? "bg-ink/30"
                      : "bg-white/35"
                }`}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
