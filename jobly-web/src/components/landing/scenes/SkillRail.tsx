import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit } from "../beagleEase";
import { ramp, settle } from "./choreography";
import { RAIL } from "./geometry";
import { evidencePaint } from "./ParsePage";
import { EVIDENCE } from "../sceneManifest";

/**
 * Beat 7: the skill rail — the slots the peeled phrases fly into.
 *
 * The rail draws itself one empty slot at a time, slightly AHEAD of the
 * token that will fill it, so there is always a visible destination in
 * flight. The chips themselves live in `EvidenceLayer`; this is only the
 * furniture, which is what lets a chip keep its identity on the way to the
 * score rows in beat 8.
 */
export function SkillRail({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 6.95, 0.3) * (1 - ramp(p, 8.35, 0.45)));
  const x = useTransform(pos, (p) => `${ramp(p, 8.15, 0.5) * 6}%`);

  const count = useTransform(pos, (p) => {
    let n = 0;
    for (let i = 0; i < EVIDENCE.length; i += 1) {
      if (ramp(p, 7.05 + i * 0.05 + 0.4, 0.2) > 0.5) n += 1;
    }
    return String(n).padStart(2, "0");
  });

  return (
    <motion.aside className="landing-rail" style={{ opacity, x }} aria-hidden="true">
      <header className="landing-rail-head">
        <span className="landing-rail-cap">Skills found</span>
        <motion.span className="landing-rail-count">{count}</motion.span>
      </header>
      <ul className="landing-rail-slots">
        {EVIDENCE.map((atom, i) => (
          <RailSlot key={atom.id} pos={pos} index={i} />
        ))}
      </ul>
      <p className="landing-rail-foot">Each one lifted off the sentence that proves it</p>
    </motion.aside>
  );
}

function RailSlot({ pos, index }: { pos: MotionValue<number>; index: number }) {
  // Slot opens just before its chip arrives.
  const open = useTransform(pos, (p) => ramp(p, 7.02 + index * 0.05, 0.22));
  // Flashes as the chip lands.
  const land = useTransform(pos, (p) => ramp(p, 7.05 + index * 0.05 + 0.42, 0.22));

  const opacity = useTransform(open, (v) => limit(v / 0.5, 0, 1));
  const scaleX = useTransform(open, (v) => cubicOut(v, 0.6, 0.4, 1));
  const glow = useTransform(land, (v) => Math.sin(Math.PI * v));
  const borderColor = useTransform(glow, (v) => `rgba(127, 210, 177, ${0.14 + v * 0.6})`);
  const background = useTransform(glow, (v) => `rgba(127, 210, 177, ${v * 0.1})`);
  const height = `${RAIL.gap * 100 * 0.78}vh`;

  return (
    <motion.li
      className="landing-rail-slot"
      style={{ opacity, scaleX, borderColor, background, height }}
    />
  );
}

/**
 * Beat 8: the seven weighted categories.
 *
 * A row only fills when its evidence token actually docks into it, and a
 * tether is drawn from the row back to the quote that paid for it — the
 * literal "every point traced to a quote" claim, animated.
 */
export function ScoreBreakdown({
  pos,
  categories,
  score,
}: {
  pos: MotionValue<number>;
  categories: readonly { id: string; label: string; max: number; earned: number }[];
  score: MotionValue<number>;
}) {
  const opacity = useTransform(pos, (p) => ramp(p, 8.1, 0.3) * (1 - ramp(p, 8.95, 0.4)));

  return (
    <motion.div className="landing-rows" style={{ opacity }}>
      <ul className="landing-rows-list">
        {categories.map((cat, i) => (
          <ScoreRow key={cat.id} pos={pos} index={i} category={cat} />
        ))}
      </ul>
      <QuoteTethers pos={pos} />
      <ScoreTotal pos={pos} score={score} />
    </motion.div>
  );
}

function ScoreRow({
  pos,
  index,
  category,
}: {
  pos: MotionValue<number>;
  index: number;
  category: { id: string; label: string; max: number; earned: number };
}) {
  // Fills when the token that belongs to this category docks.
  const owner = EVIDENCE.findIndex((e) => e.atsCat === category.id);
  const dockAt = 8.15 + (owner >= 0 ? owner : index) * 0.045 + 0.42;

  const t = useTransform(pos, (p) => ramp(p, dockAt, 0.26));
  const appear = useTransform(pos, (p) => ramp(p, 8.08 + index * 0.03, 0.2));
  const pct = (category.earned / category.max) * 100;

  const width = useTransform(t, (v) => `${cubicOut(v, 0, pct, 1)}%`);
  const points = useTransform(t, (v) => Math.round(cubicOut(v, 0, category.earned, 1)));
  const glow = useTransform(t, (v) => Math.sin(Math.PI * v));
  const rowBg = useTransform(glow, (v) => `rgba(184, 221, 210, ${0.04 + v * 0.16})`);
  const rowBorder = useTransform(glow, (v) => `rgba(127, 210, 177, ${0.08 + v * 0.5})`);
  const rowScale = useTransform(t, (v) => settle(limit(v, 0, 1), 0.035, 1));
  const liveOpacity = useTransform(t, (v) => (v > 0.02 && v < 0.95 ? 1 : 0));

  return (
    <motion.li
      className="landing-row"
      style={{
        opacity: appear,
        backgroundColor: rowBg,
        borderColor: rowBorder,
        scale: rowScale,
      }}
    >
      <div className="landing-row-top">
        <span className="landing-row-label">{category.label}</span>
        <span className="landing-row-pts">
          <motion.span>{points}</motion.span>
          <span className="landing-row-max">/{category.max}</span>
        </span>
      </div>
      <div className="landing-row-track">
        <motion.div className="landing-row-fill" style={{ width }} />
      </div>
      <motion.span className="landing-row-live" style={{ opacity: liveOpacity }}>
        cited
      </motion.span>
    </motion.li>
  );
}

/**
 * The tethers. One bezier per atom, drawn from the category row back to the
 * left where its quote still sits, with a pulse travelling along it.
 */
function QuoteTethers({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 8.3, 0.3) * (1 - ramp(p, 8.85, 0.35)));
  return (
    <motion.svg
      className="landing-tethers"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {EVIDENCE.map((atom, i) => (
        <Tether key={atom.id} pos={pos} index={i} />
      ))}
    </motion.svg>
  );
}

function Tether({ pos, index }: { pos: MotionValue<number>; index: number }) {
  const draw = useTransform(pos, (p) => ramp(p, 8.32 + index * 0.04, 0.3));
  const y1 = 90 + index * 62;
  const y2 = 70 + index * 64;
  const d = `M 300 ${y1} C 400 ${y1}, 440 ${y2}, 560 ${y2}`;
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="rgba(127,210,177,0.5)"
      strokeWidth="1.2"
      strokeDasharray="3 7"
      style={{ pathLength: draw }}
    />
  );
}

/** The ring total, sitting under the rows — sums only what has docked. */
function ScoreTotal({ pos, score }: { pos: MotionValue<number>; score: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 8.2, 0.3));
  const pulse = useTransform(pos, (p) => settle(ramp(p, 8.62, 0.3), 0.05, 1));
  const dash = useTransform(score, (v) => `${(v / 100) * 326.7} 326.7`);

  return (
    <motion.div className="landing-total" style={{ opacity, scale: pulse }}>
      <svg className="-rotate-90" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
        <motion.circle
          cx="56"
          cy="56"
          r="52"
          fill="none"
          stroke="#7fd2b1"
          strokeWidth="7"
          strokeLinecap="round"
          style={{ strokeDasharray: dash }}
        />
      </svg>
      <div className="landing-total-mid">
        <motion.span className="landing-total-num">{score}</motion.span>
        <span className="landing-total-cap">ATS score</span>
      </div>
    </motion.div>
  );
}
