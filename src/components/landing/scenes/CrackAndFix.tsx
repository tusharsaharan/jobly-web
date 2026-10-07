import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit } from "../beagleEase";
import { ramp, settle, useVisible } from "./choreography";
import { STUDY_TOPICS, WEAK_EVIDENCE } from "../sceneManifest";

/**
 * Beat 13: what to fix.
 *
 * You are back with your sheet. The two weak lines — the same two the
 * interview flagged and the same two whose comments just flew into the
 * improvement column — physically break. A jagged fracture runs through
 * each one, shards lift off and spin away, and the shards land as the three
 * study cards. Then in beat 14 the marker repairs the lines and the cracks
 * heal.
 *
 * The breaking is the point: you can SEE which lines cost you, instead of
 * reading a list that claims they did.
 *
 * TIMING
 *  13.30 - 13.45  sheet settles back, cracks hairline in
 *  13.45 - 13.85  fracture opens, shards detach and fly
 *  13.60 - 14.05  study cards assemble where the shards land
 *  14.10 - 14.55  marker repairs: cracks close, lines regrow, text rewrites
 *  14.60 - 15.10  cards bank away; the folder takes over
 */

interface CrackAndFixProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}

export function CrackAndFix({ pos, anchor, visibleLength }: CrackAndFixProps) {
  const visibility = useVisible(pos, anchor, visibleLength);

  return (
    <motion.div className="landing-fixstage" style={{ visibility, zIndex: 29 }}>
      <ShardField pos={pos} />
      <div className="landing-studycards">
        {STUDY_TOPICS.map((topic, i) => (
          <StudyCard key={topic.id} pos={pos} index={i} topic={topic} />
        ))}
      </div>
      <RepairBadge pos={pos} />
    </motion.div>
  );
}

/**
 * The shards. Twelve fragments torn out of the two weak lines, each with its
 * own spin and gravity, converging on the study card that will own it.
 */
function ShardField({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 13.45, 0.2) * (1 - ramp(p, 14.15, 0.3)));
  return (
    <motion.div className="landing-shards" style={{ opacity }} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <Shard key={i} pos={pos} index={i} />
      ))}
    </motion.div>
  );
}

function Shard({ pos, index }: { pos: MotionValue<number>; index: number }) {
  // Which weak line this shard came from, and which card it feeds.
  const source = index % WEAK_EVIDENCE.length;
  const target = index % STUDY_TOPICS.length;
  const originY = -0.04 + source * 0.055;
  const targetX = -0.3 + target * 0.3;

  const transform = useTransform(pos, (p) => {
    const t = ramp(p, 13.48 + (index % 4) * 0.035, 0.52);
    const e = cubicOut(t, 0, 1, 1);
    // torn out sideways, then pulled toward its card
    const spread = Math.sin((index / 12) * Math.PI * 2) * 0.1;
    const x = -0.14 + spread * (1 - e) + (targetX + 0.14 - spread) * e;
    const y = originY - Math.sin(e * Math.PI) * 0.12 + e * 0.18;
    const r = (index % 2 ? 1 : -1) * (40 + index * 14) * e;
    const s = 1 - e * 0.5;
    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${s})`;
  });

  // Each shard is a different torn quadrilateral.
  const shapes = [
    "polygon(0 0, 100% 12%, 88% 100%, 6% 82%)",
    "polygon(8% 0, 100% 0, 78% 100%, 0 70%)",
    "polygon(0 18%, 92% 0, 100% 86%, 14% 100%)",
    "polygon(0 0, 86% 8%, 100% 92%, 10% 78%)",
  ];

  return (
    <motion.span
      className="landing-shard"
      style={{ transform, clipPath: shapes[index % shapes.length] }}
    />
  );
}

/**
 * A study card, assembled from the shards that just landed. Names the
 * feedback line it came from, so the chain resume → interview → feedback →
 * topic stays visible on one screen.
 */
function StudyCard({
  pos,
  index,
  topic,
}: {
  pos: MotionValue<number>;
  index: number;
  topic: (typeof STUDY_TOPICS)[number];
}) {
  const build = useTransform(pos, (p) => ramp(p, 13.62 + index * 0.08, 0.4));
  const out = useTransform(pos, (p) => ramp(p, 14.6, 0.5));

  const transform = useTransform([build, out] as const, ([b, o]: number[]) => {
    const e = cubicOut(b, 0, 1, 1);
    const x = -0.3 + index * 0.3;
    const y = 0.16 + (1 - e) * 0.1 - o * 0.5;
    const s = (0.86 + e * 0.14) * settle(b, 0.06, 1);
    const r = (index - 1) * 2.2 * (1 - e) + o * (index - 1) * 8;
    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${s})`;
  });

  const opacity = useTransform(
    [build, out] as const,
    ([b, o]: number[]) => limit(b / 0.4, 0, 1) * (1 - o),
  );

  // The card's own seams knit together as it assembles.
  const seam = useTransform(build, (v) => 1 - limit(v / 0.7, 0, 1));

  return (
    <motion.article className="landing-study-card" style={{ transform, opacity }}>
      <motion.span className="landing-study-seam" style={{ opacity: seam }} aria-hidden="true" />
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

/** "Repaired" confirmation on the rewrite beat. */
function RepairBadge({ pos }: { pos: MotionValue<number> }) {
  const t = useTransform(pos, (p) => ramp(p, 14.3, 0.3));
  const opacity = useTransform(pos, (p) => ramp(p, 14.3, 0.3) * (1 - ramp(p, 15.1, 0.35)));
  const scale = useTransform(t, (v) => settle(v, 0.12, 1));
  const count = useTransform(t, (v) => String(Math.round(cubicOut(v, 0, 2, 1))));

  return (
    <motion.div className="landing-repair" style={{ opacity, scale }}>
      <span className="landing-repair-tick">✓</span>
      <motion.span className="landing-repair-num">{count}</motion.span>
      <span className="landing-repair-cap">lines rewritten with evidence</span>
    </motion.div>
  );
}
