import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit } from "../beagleEase";
import { ramp, settle, useVisible } from "./choreography";
import { VERDICT_COLS } from "./geometry";
import { EVIDENCE, MOMENT_EVIDENCE, PILLARS, VERDICT, WEAK_EVIDENCE } from "../sceneManifest";

/**
 * Beat 12: the verdict, assembled.
 *
 * The previous build printed the strengths and the improvement areas as
 * static text, which is exactly why they felt arbitrary. Here the card
 * arrives EMPTY: two labelled columns, four unfilled pillars and a blank
 * rating. The comments are the evidence tokens from `EvidenceLayer` flying
 * in from the code pane, and each pillar's dots only fill once the comment
 * that earned them has landed. The rating counts up as the last one docks.
 *
 * Nothing on this card exists before the moment that produced it.
 *
 * TIMING
 *  12.05 - 12.3  empty card rises, columns draw
 *  12.25 - 12.95 comments fly in (owned by EvidenceLayer), staggered 0.07
 *  12.45 - 13.0  pillar dots fill as their comments land
 *  12.9  - 13.15 overall rating counts up
 *  13.2  - 13.7  card recedes; weak comments continue into the fix beat
 */

interface FeedbackAssemblyProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}

export function FeedbackAssembly({ pos, anchor, visibleLength }: FeedbackAssemblyProps) {
  const visibility = useVisible(pos, anchor, visibleLength);
  const t = useTransform(pos, (p) => ramp(p, 12.05, 0.42));
  const out = useTransform(pos, (p) => ramp(p, 13.2, 0.5));

  const y = useTransform([t, out] as const, ([v, o]: number[]) => {
    const rise = cubicOut(v, 0.4, -0.4, 1);
    return `${(rise + o * 0.6) * 100}vh`;
  });
  const opacity = useTransform(
    [t, out] as const,
    ([v, o]: number[]) => limit(v / 0.4, 0, 1) * (1 - o),
  );

  // Rating counts as the final comment lands.
  const rate = useTransform(pos, (p) => ramp(p, 12.9, 0.3));
  const ratingNum = useTransform(rate, (v) => cubicOut(v, 0, VERDICT.overall, 1).toFixed(1));
  const ratingPulse = useTransform(rate, (v) => settle(v, 0.09, 1));

  const landedCount = useTransform(pos, (p) => {
    let n = 0;
    EVIDENCE.forEach((_, i) => {
      if (ramp(p, 12.25 + i * 0.07 + 0.5, 0.2) > 0.5) n += 1;
    });
    return n;
  });
  const assembling = useTransform(landedCount, (n) =>
    n < MOMENT_EVIDENCE.length + WEAK_EVIDENCE.length ? 1 : 0,
  );

  return (
    <motion.div
      className="landing-verdict"
      style={{ y, opacity, visibility, zIndex: 31, willChange: "transform, opacity" }}
    >
      <div className="landing-verdict-head">
        <motion.div className="landing-verdict-overall" style={{ scale: ratingPulse }}>
          <motion.span className="landing-verdict-num">{ratingNum}</motion.span>
          <span className="landing-verdict-den">/5</span>
        </motion.div>
        <div>
          <p className="landing-verdict-kicker">Overall rating</p>
          <p className="landing-verdict-sub">Backed by timeline evidence</p>
        </div>
        <motion.span className="landing-verdict-live" style={{ opacity: assembling }}>
          <i /> assembling from your session
        </motion.span>
      </div>

      <ul className="landing-pillars">
        {PILLARS.map((pillar, i) => (
          <Pillar key={pillar.id} pos={pos} index={i} pillar={pillar} />
        ))}
      </ul>

      {/* The two columns the comment tokens fly into. Headers and guide rails
          only — the content is the evidence layer. */}
      <div className="landing-verdict-cols">
        <CommentColumn
          pos={pos}
          title="Strengths"
          tone="is-good"
          count={MOMENT_EVIDENCE.filter((e) => !e.weak).length}
        />
        <CommentColumn
          pos={pos}
          title="Improvement areas"
          tone="is-gap"
          count={WEAK_EVIDENCE.length}
        />
      </div>

      <div className="landing-outcomes">
        {VERDICT.outcomes.map((o, i) => (
          <Outcome key={o.id} pos={pos} index={i} outcome={o} />
        ))}
      </div>
    </motion.div>
  );
}

/**
 * A column of empty landing rails. Each rail brightens as its comment docks,
 * so you can see the card filling up rather than just appearing full.
 */
function CommentColumn({
  pos,
  title,
  tone,
  count,
}: {
  pos: MotionValue<number>;
  title: string;
  tone: string;
  count: number;
}) {
  const headOpacity = useTransform(pos, (p) => ramp(p, 12.12, 0.25));
  const isGap = tone === "is-gap";

  return (
    <div className="landing-verdict-col">
      <motion.p className={`landing-verdict-h ${tone}`} style={{ opacity: headOpacity }}>
        {title}
      </motion.p>
      <ul className="landing-verdict-rails">
        {Array.from({ length: count }).map((_, i) => (
          <CommentRail key={i} pos={pos} index={i} isGap={isGap} />
        ))}
      </ul>
    </div>
  );
}

function CommentRail({
  pos,
  index,
  isGap,
}: {
  pos: MotionValue<number>;
  index: number;
  isGap: boolean;
}) {
  // Match the stagger EvidenceLayer uses for the comment flight.
  const owners = isGap ? WEAK_EVIDENCE : MOMENT_EVIDENCE.filter((e) => !e.weak);
  const atom = owners[index];
  const globalIndex = atom ? EVIDENCE.findIndex((e) => e.id === atom.id) : index;
  const landAt = 12.25 + globalIndex * 0.07 + 0.46;

  const open = useTransform(pos, (p) => ramp(p, 12.16 + index * 0.05, 0.24));
  const land = useTransform(pos, (p) => ramp(p, landAt, 0.24));

  const opacity = useTransform(open, (v) => limit(v / 0.5, 0, 1) * 0.9);
  const scaleX = useTransform(open, (v) => cubicOut(v, 0.5, 0.5, 1));
  const glow = useTransform(land, (v) => Math.sin(Math.PI * v));
  const borderColor = useTransform(glow, (v) =>
    isGap ? `rgba(200, 150, 80, ${0.18 + v * 0.55})` : `rgba(127, 210, 177, ${0.18 + v * 0.55})`,
  );
  const height = `${VERDICT_COLS.gap * 100 * 0.72}vh`;

  return (
    <motion.li
      className="landing-verdict-rail"
      style={{ opacity, scaleX, borderColor, height }}
    />
  );
}

/** A pillar fills only when the comments tied to it have landed. */
function Pillar({
  pos,
  index,
  pillar,
}: {
  pos: MotionValue<number>;
  index: number;
  pillar: (typeof PILLARS)[number];
}) {
  const owners = EVIDENCE.filter((e) => e.pillar === pillar.id);
  const lastOwner = owners.length
    ? Math.max(...owners.map((o) => EVIDENCE.findIndex((e) => e.id === o.id)))
    : index;
  const fillAt = 12.25 + lastOwner * 0.07 + 0.42;

  const appear = useTransform(pos, (p) => ramp(p, 12.18 + index * 0.04, 0.24));
  const t = useTransform(pos, (p) => ramp(p, fillAt, 0.3));
  const x = useTransform(appear, (v) => `${(1 - v) * 10}px`);

  return (
    <motion.li style={{ opacity: appear, x }}>
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
  const fill = useTransform(t, (v) => (filled ? limit((v - (n - 1) * 0.13) / 0.22, 0, 1) : 1));
  const scale = useTransform(fill, (v) => (filled ? settle(v, 0.3, 1) : 1));
  return (
    <motion.span
      className={`landing-pillar-dot ${filled ? "is-on" : ""}`}
      style={filled ? { opacity: fill, scale } : undefined}
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
  const t = useTransform(pos, (p) => ramp(p, 13.0 + index * 0.07, 0.26));
  const opacity = useTransform(t, (v) => limit(v / 0.4, 0, 1));
  const y = useTransform(t, (v) => `${(1 - cubicOut(v, 0, 1, 1)) * 10}px`);

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
