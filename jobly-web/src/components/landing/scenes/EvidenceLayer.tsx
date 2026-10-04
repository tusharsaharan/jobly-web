import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { bezier, ramp, settle } from "./choreography";
import { evidencePaint } from "./ParsePage";
import {
  commentSlot,
  folderSlot,
  mailboxSlot,
  pageSlot,
  railSlot,
  rowSlot,
  studySlot,
} from "./geometry";
import { EVIDENCE, WEAK_EVIDENCE, type Evidence } from "../sceneManifest";

/**
 * ══ THE CONNECTIVE TISSUE ══
 *
 * Seven tokens, mounted exactly once, alive from beat 7 to beat 16. Each one
 * is a single evidence atom — a phrase the highlighter marked — and it is the
 * SAME DOM NODE every time you see it again:
 *
 *   7   peels off the resume line it was highlighted on
 *   7   lands in the skill rail as a chip
 *   8   docks into its weighted ATS category row
 *   9   rides into the company mailbox its evidence convinces
 *  11   stays out of frame while the interview runs
 *  12   returns as the feedback comment that moment produced
 *  13   weak atoms fly out as study shards; strong ones bank away
 *  16   everything files into the folder
 *
 * Because position is a pure function of `pos`, the transitions between those
 * lives are continuous by construction: there is no state machine to fall out
 * of sync, and scrubbing backwards runs the whole story in reverse.
 *
 * This is what fixes "nothing feels connected" — not more animation, but the
 * refusal to ever destroy and recreate an object.
 */

const WINDOWS = {
  /** peel off the page and fly to the rail */
  peel: { at: 7.05, len: 0.6, stagger: 0.05 },
  /** rail -> weighted category row */
  dock: { at: 8.15, len: 0.6, stagger: 0.045 },
  /** row -> mailbox */
  post: { at: 9.25, len: 0.7, stagger: 0.05 },
  /** hidden across the interview */
  hide: { at: 10.3, len: 0.5 },
  /** interview moment -> feedback comment */
  comment: { at: 12.25, len: 0.7, stagger: 0.07 },
  /** weak atoms shatter toward the study cards */
  shard: { at: 13.45, len: 0.65, stagger: 0.08 },
  /** everything files into the folder */
  file: { at: 16.2, len: 0.7, stagger: 0.06 },
} as const;

interface EvidenceLayerProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}

export function EvidenceLayer({ pos, anchor, visibleLength }: EvidenceLayerProps) {
  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );

  return (
    <motion.div
      className="landing-evidence-layer"
      style={{ visibility, zIndex: 34 }}
      aria-hidden="true"
    >
      {EVIDENCE.map((atom, i) => (
        <EvidenceToken key={atom.id} pos={pos} atom={atom} index={i} />
      ))}
    </motion.div>
  );
}

function EvidenceToken({
  pos,
  atom,
  index,
}: {
  pos: MotionValue<number>;
  atom: Evidence;
  index: number;
}) {
  const weakIndex = WEAK_EVIDENCE.findIndex((e) => e.id === atom.id);
  const isWeak = atom.weak;
  const raisesMoment = atom.moment >= 0;

  const from = pageSlot(index);
  const rail = railSlot(index);
  const row = rowSlot(atom.atsCat);
  const box = mailboxSlot(atom.mailbox);
  const note = commentSlot(atom.id);
  const study = isWeak ? studySlot(weakIndex) : [atom.mailbox === "orbit" ? -0.4 : 0.4, -0.3];
  const folder = folderSlot();

  /* ── the single position track: one branch per life ── */
  const transform = useTransform(pos, (p) => {
    let x = from[0];
    let y = from[1];
    let s = 0.82;
    let r = 0;

    // 1. peel off the page, arc to the rail
    const peel = ramp(p, WINDOWS.peel.at + index * WINDOWS.peel.stagger, WINDOWS.peel.len);
    if (peel > 0) {
      const t = cubicInOut(peel, 0, 1, 1);
      // lift up and out before settling right — paper does not slide, it flies
      const [bx, by] = bezier(t, from[0], from[1], (from[0] + rail[0]) / 2, from[1] - 0.14, rail[0], rail[1]);
      x = bx;
      y = by;
      s = 0.82 + t * 0.18;
      r = Math.sin(t * Math.PI) * -7;
    }

    // 2. rail -> weighted category row
    const dock = ramp(p, WINDOWS.dock.at + index * WINDOWS.dock.stagger, WINDOWS.dock.len);
    if (dock > 0) {
      const t = cubicInOut(dock, 0, 1, 1);
      const [bx, by] = bezier(t, rail[0], rail[1], rail[0] + 0.08, (rail[1] + row[1]) / 2, row[0], row[1]);
      x = bx;
      y = by;
      s = 1 - t * 0.22;
      r = Math.sin(t * Math.PI) * 4;
    }

    // 3. row -> mailbox, with a dip as it is thrown
    const post = ramp(p, WINDOWS.post.at + index * WINDOWS.post.stagger, WINDOWS.post.len);
    if (post > 0) {
      const t = cubicInOut(post, 0, 1, 1);
      const [bx, by] = bezier(t, row[0], row[1], (row[0] + box[0]) / 2, row[1] - 0.2, box[0], box[1]);
      x = bx;
      y = by;
      s = 0.78 - t * 0.28;
      r = Math.sin(t * Math.PI) * 12;
    }

    // 4. hidden across the interview — parked at the mailbox
    // (opacity handles the hide; position holds so the return reads as a return)

    // 5. interview moment -> feedback comment
    const comment = ramp(p, WINDOWS.comment.at + index * WINDOWS.comment.stagger, WINDOWS.comment.len);
    if (comment > 0) {
      const t = cubicOut(comment, 0, 1, 1);
      // enters from the code pane on the left, banks into its column
      const originX = -0.34;
      const originY = -0.05 + (atom.moment >= 0 ? atom.moment * 0.012 : 0);
      const [bx, by] = bezier(t, originX, originY, (originX + note[0]) / 2, originY - 0.16, note[0], note[1]);
      x = bx;
      y = by;
      s = 0.5 + t * 0.5;
      r = (1 - t) * -8;
    }

    // 6. weak atoms shatter out toward the study cards; strong ones bank away
    const shard = ramp(p, WINDOWS.shard.at + Math.max(0, weakIndex) * WINDOWS.shard.stagger, WINDOWS.shard.len);
    if (shard > 0) {
      const t = cubicInOut(shard, 0, 1, 1);
      const [bx, by] = bezier(
        t,
        note[0],
        note[1],
        (note[0] + study[0]) / 2,
        note[1] - 0.22,
        study[0],
        study[1],
      );
      x = bx;
      y = by;
      s = 1 - t * (isWeak ? 0.18 : 0.5);
      r = Math.sin(t * Math.PI) * (isWeak ? -14 : 24);
    }

    // 7. file into the folder
    const file = ramp(p, WINDOWS.file.at + index * WINDOWS.file.stagger, WINDOWS.file.len);
    if (file > 0) {
      const t = cubicInOut(file, 0, 1, 1);
      const [bx, by] = bezier(t, x, y, (x + folder[0]) / 2, Math.min(y, folder[1]) - 0.18, folder[0], folder[1]);
      x = bx;
      y = by;
      s = s * (1 - t * 0.82);
      r = r + t * 18;
    }

    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${s})`;
  });

  /* ── visibility across the nine lives ── */
  const opacity = useTransform(pos, (p) => {
    // born the moment its phrase is fully painted
    const born = limit((evidencePaint(p, index) - 0.62) / 0.3, 0, 1);
    if (p < WINDOWS.peel.at) return born * 0.0; // the phrase itself is still on the page
    const appear = ramp(p, WINDOWS.peel.at + index * WINDOWS.peel.stagger - 0.02, 0.18);

    // out of frame across the interview
    const hidden = ramp(p, 10.2, 0.4) * (1 - ramp(p, WINDOWS.comment.at - 0.1, 0.3));

    // strong atoms leave after the study beat; weak ones persist into the folder
    const gone = isWeak ? 0 : ramp(p, 14.1, 0.5) * (1 - ramp(p, WINDOWS.file.at - 0.1, 0.3));

    // fully consumed by the folder
    const filed = ramp(p, WINDOWS.file.at + index * WINDOWS.file.stagger + 0.45, 0.3);

    return appear * (1 - hidden) * (1 - gone) * (1 - filed);
  });

  /* ── the two faces: skill chip, and the feedback comment ── */
  const chipFace = useTransform(pos, (p) => 1 - ramp(p, WINDOWS.comment.at + 0.1, 0.25));
  const noteFace = useTransform(pos, (p) => ramp(p, WINDOWS.comment.at + 0.1, 0.25));

  // Lands with a small overshoot at every destination.
  const landScale = useTransform(pos, (p) => {
    const marks = [
      WINDOWS.peel.at + index * WINDOWS.peel.stagger + WINDOWS.peel.len,
      WINDOWS.dock.at + index * WINDOWS.dock.stagger + WINDOWS.dock.len,
      WINDOWS.comment.at + index * WINDOWS.comment.stagger + WINDOWS.comment.len,
    ];
    let k = 1;
    for (const m of marks) {
      const t = ramp(p, m - 0.12, 0.2);
      if (t > 0 && t < 1) k *= settle(t, 0.1, 1);
    }
    return k;
  });

  const tone = isWeak ? "is-weak" : raisesMoment ? "is-moment" : "is-plain";

  return (
    <motion.div className="landing-evi-token" style={{ transform, opacity }}>
      <motion.div className={`landing-evi-card ${tone}`} style={{ scale: landScale }}>
        <motion.span className="landing-evi-face" style={{ opacity: chipFace }}>
          <span className="landing-evi-skill">{atom.skill}</span>
          <span className="landing-evi-pts">+{atom.pts}</span>
        </motion.span>
        <motion.span className="landing-evi-face landing-evi-face--note" style={{ opacity: noteFace }}>
          <span className="landing-evi-note">{atom.comment}</span>
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
