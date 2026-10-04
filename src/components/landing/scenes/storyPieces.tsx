import { motion, useTransform, type MotionValue } from "framer-motion";
import { Check, Mic, PenLine, Terminal, Video } from "lucide-react";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { getScoreGreenShade } from "@/components/ui/AtsScoreRing";
import { PAPER_SHADOW } from "./paper";
import {
  PILLARS,
  ROLE_CARDS,
  ROOM_CODE,
  ROOM_FEATURES,
  ROOM_MESSAGES,
  STUDY_TOPICS,
  VERDICT,
} from "../sceneManifest";

const useVisibility = (pos: MotionValue<number>, anchor: number, visibleLength: number) =>
  useTransform(pos, (p) => (Math.abs(anchor - p) < visibleLength ? "visible" : "hidden"));

/* ══════════════════ step 6 · role fit ══════════════════ */

/**
 * Three matched roles, each carrying the role-fit percentage the candidate
 * sees before spending an application. The top card flips to "Interview
 * scheduled" — the hand-off that sets up step 7.
 */
export function RoleCards({
  pos,
  anchor,
  visibleLength,
}: {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}) {
  const visibility = useVisibility(pos, anchor, visibleLength);
  return (
    <motion.div className="absolute inset-0 z-30" style={{ visibility }}>
      {ROLE_CARDS.map((role, i) => (
        <RoleCard key={role.id} pos={pos} index={i} role={role} />
      ))}
    </motion.div>
  );
}

function RoleCard({
  pos,
  index,
  role,
}: {
  pos: MotionValue<number>;
  index: number;
  role: (typeof ROLE_CARDS)[number];
}) {
  const start = 5.35 + index * 0.1;
  const t = useTransform(pos, (p) => limit((p - start) / 0.5, 0, 1));
  const out = useTransform(pos, (p) => limit((p - 6.4) / 0.5, 0, 1));

  const y = useTransform([t, out] as const, ([v, o]: number[]) => {
    const rise = cubicOut(v, 0.45, -0.45, 1);
    return `${(rise - o * 0.8) * 100}vh`;
  });
  // Rests in the left half — the card is ~28vw wide, so anything past about
  // -0.3 pushes its text off the viewport edge.
  const x = useTransform(t, (v) => `${cubicOut(v, -0.44, 0.17, 1) * 100}vw`);
  const opacity = useTransform(
    [t, out] as const,
    ([v, o]: number[]) => limit(v / 0.4, 0, 1) * (1 - o),
  );

  // the top card flips to "scheduled" and LANDS before the rest point at 6
  const flip = useTransform(pos, (p) =>
    role.state === "scheduled" ? limit((p - 5.86) / 0.28, 0, 1) : 0,
  );
  const openOpacity = useTransform(flip, (f) => 1 - f);
  const schedOpacity = useTransform(flip, (f) => f);

  // Clears the title band (which owns roughly the top 38% at this step).
  const top = `${35 + index * 16.5}%`;
  const shade = getScoreGreenShade(role.fit);

  return (
    <motion.article
      className="landing-role-card"
      style={{ top, x, y, opacity, boxShadow: PAPER_SHADOW, willChange: "transform, opacity" }}
    >
      <span className="landing-role-mark" aria-hidden="true">
        {role.company.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="landing-role-title">{role.title}</p>
        <p className="landing-role-co">{role.company}</p>

        <div className="relative mt-2 h-[18px]">
          <motion.span className="landing-role-state" style={{ opacity: openOpacity }}>
            Open · apply now
          </motion.span>
          <motion.span
            className="landing-role-state landing-role-state--sched absolute left-0 top-0"
            style={{ opacity: schedOpacity }}
          >
            <Check className="h-3 w-3" aria-hidden="true" /> Interview scheduled
          </motion.span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="landing-role-fit" style={{ color: shade }}>
          {role.fit}
          <span className="landing-role-fit-pct">%</span>
        </span>
        <span className="landing-role-fit-cap">role fit</span>
      </div>
    </motion.article>
  );
}

/* ══════════════════ step 7 · the live room ══════════════════ */

/**
 * The interview room, assembled from the panes the real room actually has:
 * collaborative editor, shared whiteboard, live video, runnable terminal —
 * plus the AI co-interviewer prompting the human.
 *
 * TIMING CONTRACT: 7 is a resting beat, so everything here must be FINISHED by
 * 6.9 and hold. The exit only starts after the pass-through at 7, once the
 * verdict beat begins to take over.
 */
export function InterviewRoom({
  pos,
  anchor,
  visibleLength,
}: {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}) {
  const visibility = useVisibility(pos, anchor, visibleLength);
  const t = useTransform(pos, (p) => limit((p - 6.35) / 0.5, 0, 1));
  const out = useTransform(pos, (p) => limit((p - 7.7) / 0.4, 0, 1));

  const y = useTransform([t, out] as const, ([v, o]: number[]) => {
    const rise = cubicOut(v, 0.4, -0.4, 1);
    return `${(rise - o * 0.7) * 100}vh`;
  });
  const opacity = useTransform([t, out] as const, ([v, o]: number[]) => limit(v / 0.4, 0, 1) * (1 - o));
  const scale = useTransform(t, (v) => cubicOut(v, 0.94, 0.06, 1));

  // typing reveal on the code pane, complete well before the rest point
  const typed = useTransform(pos, (p) => limit((p - 6.42) / 0.45, 0, 1));

  return (
    <motion.div
      className="landing-room"
      style={{ y, opacity, scale, visibility, willChange: "transform, opacity" }}
    >
      {/* chrome */}
      <div className="landing-room-bar">
        <span className="landing-room-dot" style={{ background: "#ff5f57" }} />
        <span className="landing-room-dot" style={{ background: "#febc2e" }} />
        <span className="landing-room-dot" style={{ background: "#28c840" }} />
        <span className="landing-room-key">Technical Interview · live</span>
        <span className="landing-room-rec">
          <span className="landing-room-rec-dot" /> REC
        </span>
      </div>

      <div className="landing-room-body">
        {/* code */}
        <div className="landing-room-code">
          {ROOM_CODE.map((line, i) => (
            <CodeLine key={i} line={line} index={i} typed={typed} />
          ))}
        </div>

        {/* right rail */}
        <div className="landing-room-rail">
          <div className="landing-room-video">
            <div className="landing-room-avatar">AP</div>
            <span className="landing-room-vlabel">
              <Mic className="h-3 w-3" aria-hidden="true" /> Ari
            </span>
          </div>
          <div className="landing-room-board">
            <svg viewBox="0 0 120 70" className="h-full w-full">
              <rect x="8" y="10" width="30" height="18" rx="3" className="landing-board-node" />
              <rect x="80" y="10" width="30" height="18" rx="3" className="landing-board-node" />
              <rect x="44" y="44" width="32" height="18" rx="3" className="landing-board-node" />
              <path d="M38 19 H80" className="landing-board-edge" />
              <path d="M23 28 V44 H44" className="landing-board-edge" />
              <path d="M95 28 V44 H76" className="landing-board-edge" />
            </svg>
            <span className="landing-room-vlabel">
              <PenLine className="h-3 w-3" aria-hidden="true" /> Whiteboard
            </span>
          </div>
        </div>
      </div>

      {/* AI co-interviewer */}
      <div className="landing-room-ai">
        {ROOM_MESSAGES.map((m, i) => (
          <RoomMessage key={i} pos={pos} index={i} message={m} />
        ))}
      </div>

      {/* capability strip */}
      <ul className="landing-room-feats">
        {ROOM_FEATURES.map((f, i) => (
          <li key={f}>
            {i === 0 ? <Terminal className="h-3 w-3" aria-hidden="true" /> : null}
            {i === 2 ? <Video className="h-3 w-3" aria-hidden="true" /> : null}
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function CodeLine({
  line,
  index,
  typed,
}: {
  line: string;
  index: number;
  typed: MotionValue<number>;
}) {
  const start = index / ROOM_CODE.length;
  const opacity = useTransform(typed, (t) => limit((t - start * 0.85) / 0.12, 0, 1));
  return (
    <motion.div className="landing-code-line" style={{ opacity }}>
      <span className="landing-code-num">{index + 1}</span>
      <code>{line}</code>
    </motion.div>
  );
}

function RoomMessage({
  pos,
  index,
  message,
}: {
  pos: MotionValue<number>;
  index: number;
  message: (typeof ROOM_MESSAGES)[number];
}) {
  const start = 6.5 + index * 0.14;
  const t = useTransform(pos, (p) => limit((p - start) / 0.26, 0, 1));
  const opacity = useTransform(
    [t, pos] as const,
    ([v, p]: number[]) => v * (1 - limit((p - 7.7) / 0.35, 0, 1)),
  );
  const y = useTransform(t, (v) => `${(1 - v) * 10}px`);

  return (
    <motion.div
      className={`landing-room-msg ${message.from === "ai" ? "is-ai" : "is-you"}`}
      style={{ opacity, y }}
    >
      <span className="landing-room-msg-from">{message.from === "ai" ? "AI copilot" : "You"}</span>
      <p>{message.text}</p>
    </motion.div>
  );
}

/* ══════════════════ step 8 · the verdict ══════════════════ */

/**
 * The candidate-safe feedback view: overall 1-5, the four real competency
 * pillars, strengths and improvement areas. Both outcomes are shown — the
 * improvement areas are what step 9 turns into a study plan either way.
 */
export function Scorecard({
  pos,
  anchor,
  visibleLength,
}: {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}) {
  const visibility = useVisibility(pos, anchor, visibleLength);
  const t = useTransform(pos, (p) => limit((p - 7.4) / 0.55, 0, 1));
  const out = useTransform(pos, (p) => limit((p - 8.45) / 0.5, 0, 1));
  const y = useTransform([t, out] as const, ([v, o]: number[]) => {
    const rise = cubicOut(v, 0.42, -0.42, 1);
    return `${(rise - o * 0.8) * 100}vh`;
  });
  const opacity = useTransform(
    [t, out] as const,
    ([v, o]: number[]) => limit(v / 0.4, 0, 1) * (1 - o),
  );

  const rating = useTransform(pos, (p) => limit((p - 7.7) / 0.4, 0, 1));
  const ratingNum = useTransform(rating, (r) => cubicOut(r, 0, VERDICT.overall, 1).toFixed(1));

  return (
    <motion.div
      className="landing-scorecard"
      style={{ y, opacity, visibility, willChange: "transform, opacity" }}
    >
      <div className="landing-scorecard-head">
        <div className="landing-scorecard-overall">
          <motion.span className="landing-scorecard-num">{ratingNum}</motion.span>
          <span className="landing-scorecard-den">/5</span>
        </div>
        <div>
          <p className="landing-scorecard-kicker">Overall rating</p>
          <p className="landing-scorecard-sub">Backed by timeline evidence</p>
        </div>
      </div>

      <ul className="landing-pillars">
        {PILLARS.map((pillar, i) => (
          <Pillar key={pillar.id} pos={pos} index={i} pillar={pillar} />
        ))}
      </ul>

      <div className="landing-verdict-cols">
        <div>
          <p className="landing-verdict-h is-good">Strengths</p>
          {VERDICT.strengths.map((s) => (
            <p key={s} className="landing-verdict-item">
              {s}
            </p>
          ))}
        </div>
        <div>
          <p className="landing-verdict-h is-gap">Improvement areas</p>
          {VERDICT.improvements.map((s) => (
            <p key={s} className="landing-verdict-item">
              {s}
            </p>
          ))}
        </div>
      </div>

      {/* both outcomes — the loop is the point */}
      <div className="landing-outcomes">
        {VERDICT.outcomes.map((o, i) => (
          <Outcome key={o.id} pos={pos} index={i} outcome={o} />
        ))}
      </div>
    </motion.div>
  );
}

function Pillar({
  pos,
  index,
  pillar,
}: {
  pos: MotionValue<number>;
  index: number;
  pillar: (typeof PILLARS)[number];
}) {
  const start = 7.82 + index * 0.07;
  const t = useTransform(pos, (p) => limit((p - start) / 0.3, 0, 1));
  const opacity = useTransform(t, (v) => limit(v / 0.4, 0, 1));
  const x = useTransform(t, (v) => `${(1 - v) * 10}px`);

  return (
    <motion.li style={{ opacity, x }}>
      <span className="landing-pillar-label" title={pillar.label}>
        {pillar.short}
      </span>
      <span className="landing-pillar-dots">
        {[1, 2, 3, 4, 5].map((n) => (
          <PillarDot key={n} filled={n <= pillar.score} t={t} n={n} />
        ))}
      </span>
    </motion.li>
  );
}

function PillarDot({ filled, t, n }: { filled: boolean; t: MotionValue<number>; n: number }) {
  const opacity = useTransform(t, (v) => (filled ? limit((v - (n - 1) * 0.12) / 0.2, 0, 1) : 1));
  return (
    <motion.span
      className={`landing-pillar-dot ${filled ? "is-on" : ""}`}
      style={filled ? { opacity, scale: opacity } : undefined}
    />
  );
}

function Outcome({
  pos,
  index,
  outcome,
}: {
  pos: MotionValue<number>;
  index: number;
  outcome: (typeof VERDICT.outcomes)[number];
}) {
  const start = 8.05 + index * 0.12;
  const t = useTransform(pos, (p) => limit((p - start) / 0.3, 0, 1));
  const opacity = useTransform(t, (v) => limit(v / 0.4, 0, 1));
  const y = useTransform(t, (v) => `${(1 - v) * 8}px`);

  return (
    <motion.div
      className={`landing-outcome ${outcome.id === "hired" ? "is-hired" : "is-next"}`}
      style={{ opacity, y }}
    >
      <p className="landing-outcome-label">{outcome.label}</p>
      <p className="landing-outcome-detail">{outcome.detail}</p>
    </motion.div>
  );
}

/* ══════════════════ step 9 · the study plan ══════════════════ */

/**
 * The improvement areas from step 8, turned into named topics against the
 * real taxonomy (DSA / CS Fundamentals / HLD / LLD). Each card names the
 * feedback line it came from, so the causal link is visible on screen.
 */
export function StudyTopics({
  pos,
  anchor,
  visibleLength,
}: {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}) {
  const visibility = useVisibility(pos, anchor, visibleLength);
  return (
    <motion.div className="absolute inset-0 z-30" style={{ visibility }}>
      {STUDY_TOPICS.map((topic, i) => (
        <StudyCard key={topic.id} pos={pos} index={i} topic={topic} />
      ))}
    </motion.div>
  );
}

function StudyCard({
  pos,
  index,
  topic,
}: {
  pos: MotionValue<number>;
  index: number;
  topic: (typeof STUDY_TOPICS)[number];
}) {
  const start = 8.45 + index * 0.12;
  const t = useTransform(pos, (p) => limit((p - start) / 0.5, 0, 1));
  const out = useTransform(pos, (p) => limit((p - 9.45) / 0.5, 0, 1));

  const y = useTransform([t, out] as const, ([v, o]: number[]) => {
    const rise = cubicOut(v, 0.4, -0.4, 1);
    return `${(rise - o * 0.85) * 100}vh`;
  });
  const opacity = useTransform(
    [t, out] as const,
    ([v, o]: number[]) => limit(v / 0.4, 0, 1) * (1 - o),
  );
  const rot = useTransform(
    t,
    (v) => `${cubicInOut(v, (index - 1) * 2.5, -(index - 1) * 1.6, 1)}deg`,
  );

  const left = `${22 + index * 28}%`;

  return (
    <motion.article
      className="landing-study-card"
      style={{ left, y, opacity, rotate: rot, boxShadow: PAPER_SHADOW, willChange: "transform" }}
    >
      <span className={`landing-study-cat is-${topic.category.replace(/\s+/g, "-").toLowerCase()}`}>
        {topic.category}
      </span>
      <h4 className="landing-study-topic">{topic.topic}</h4>
      <p className="landing-study-from">
        <span className="landing-study-from-cap">From your feedback</span>
        {topic.from}
      </p>
      <ul className="landing-study-res">
        {topic.resources.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </motion.article>
  );
}
