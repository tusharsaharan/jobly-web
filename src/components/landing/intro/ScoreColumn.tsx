import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit } from "../beagleEase";
import { ramp, settle } from "../scenes/choreography";
import {
  ANCHORS,
  ATS_CATEGORIES,
  COPY,
  SCAN_END,
  SCORE,
  SCORE_COL_H,
  catProgress,
  liveScore,
} from "./manifest";

/**
 * The score column — the one new element step 7 is allowed.
 *
 * It appears on the RIGHT only; the left margin stays empty. That restraint is
 * the whole reason the beat reads as premium rather than as a dashboard: the
 * reference's settled frames carry a title, a subline, a sheet and some drifting
 * shapes, and nothing else.
 *
 * ── The number is honest ──
 *
 * `liveScore` is the sum of each category's `earned` weighted by how much of
 * that row has actually been SCANNED, so the ring can never be ahead of the
 * reading. It lands on 82 — `CANDIDATES[0].scoreBefore` — because the seven
 * `earned` values sum to exactly that.
 *
 * Six categories are paid for by sentences. `ats_readability` is structural, has
 * no sentence to cite and therefore no chip; it lands last, on its own, which is
 * precisely what the real `useLiveScore` did.
 *
 * ── Why the geometry is authored in vh ──
 *
 * `scoreRowY` has to be able to say where row `k` IS without measuring, because
 * `KeywordFlight` aims at it from a different component and a different stacking
 * context. So every box here is sized from `SCORE` rather than left to flow, and
 * the inline styles below are what keep the rendered column and the flight
 * targets the same shape.
 */

export function ScoreColumn({ pos, zIndex }: { pos: MotionValue<number>; zIndex: number }) {
  /**
   * Arrives with the page's settle (6.06 -> 6.6), not after it. The first cut
   * brought the column in at 6.4 and the first chip landed at 6.46 — into
   * something a third of the way faded up, which made the flight look like it
   * was aimed at nothing. It has to be solid before anything is thrown at it.
   */
  const opacity = useTransform(pos, (p) => ramp(p, 6.1, 0.26) * (1 - ramp(p, 7.46, 0.32)));
  // Slides in from the right as the page settles left — they clear each other.
  const x = useTransform(pos, (p) => `${(1 - cubicOut(ramp(p, 6.1, 0.4), 0, 1, 1)) * 5}vw`);
  const visibility = useTransform(pos, (p) =>
    Math.abs(ANCHORS.scoreColumn.anchor - p) < ANCHORS.scoreColumn.length ? "visible" : "hidden",
  );

  const score = useTransform(pos, (p) => liveScore(p));
  const shown = useTransform(score, (v) => Math.round(v));
  const dash = useTransform(score, (v) => `${(v / 100) * SCORE.circ} ${SCORE.circ}`);
  // One quiet pulse as the last category lands, so the total reads as a verdict.
  const ringScale = useTransform(pos, (p) => settle(ramp(p, SCAN_END - 0.05, 0.22), 0.045, 1));

  return (
    <motion.aside
      className="landing-score"
      aria-hidden="true"
      style={{
        right: `${SCORE.right}vw`,
        width: `${SCORE.w}vw`,
        height: `${SCORE_COL_H}vh`,
        zIndex,
        opacity,
        x,
        visibility,
      }}
    >
      <motion.div
        className="landing-score-ring"
        style={{ height: `${SCORE.ringH}vh`, scale: ringScale }}
      >
        <svg viewBox="0 0 112 112" className="-rotate-90" aria-hidden="true">
          <circle
            cx="56"
            cy="56"
            r={SCORE.r}
            fill="none"
            stroke="rgb(47 48 45 / 0.12)"
            strokeWidth="6"
          />
          <motion.circle
            cx="56"
            cy="56"
            r={SCORE.r}
            fill="none"
            stroke="var(--lp-deep)"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ strokeDasharray: dash }}
          />
        </svg>
        <div className="landing-score-mid">
          <motion.span className="landing-score-num">{shown}</motion.span>
          <span className="landing-score-cap">{COPY.scan.cap}</span>
        </div>
      </motion.div>

      <ul
        className="landing-score-rows"
        style={{ marginTop: `${SCORE.headGap}vh`, gap: `${SCORE.rowGap}vh` }}
      >
        {ATS_CATEGORIES.map((cat, i) => (
          <ScoreRow key={cat.id} pos={pos} index={i} category={cat} />
        ))}
      </ul>

      <p className="landing-score-foot" style={{ marginTop: `${SCORE.footGap}vh` }}>
        {COPY.scan.foot}
      </p>
    </motion.aside>
  );
}

interface Category {
  id: string;
  label: string;
  max: number;
  earned: number;
}

function ScoreRow({
  pos,
  index,
  category,
}: {
  pos: MotionValue<number>;
  index: number;
  category: Category;
}) {
  // The row exists before it fills, so there is always a visible destination in
  // flight — same reason the long story's rail opens its slots early.
  const appear = useTransform(pos, (p) => ramp(p, 6.12 + index * 0.022, 0.2));
  const fill = useTransform(pos, (p) => catProgress(p, category.id));

  const pct = (category.earned / category.max) * 100;
  const width = useTransform(fill, (v) => `${cubicOut(v, 0, pct, 1)}%`);
  const points = useTransform(fill, (v) => Math.round(cubicOut(v, 0, category.earned, 1)));

  // Flashes as a chip is absorbed. `sin` over the fill gives one clean swell
  // per arrival, including the half-swell when a two-quote row fills in stages.
  const glow = useTransform(fill, (v) => Math.sin(Math.PI * limit(v, 0, 1)));
  const borderColor = useTransform(glow, (v) => `rgb(30 112 88 / ${0.1 + v * 0.46})`);
  const background = useTransform(glow, (v) => `rgb(30 112 88 / ${0.02 + v * 0.07})`);
  const rowScale = useTransform(fill, (v) => settle(limit(v, 0, 1), 0.028, 1));
  const citedOpacity = useTransform(fill, (v) => limit((v - 0.55) / 0.3, 0, 1));

  /**
   * `ats_readability` has nothing to cite, so it says what it actually is. The
   * label changing is the point — six rows are bought by quotes and one is
   * bought by structure, and pretending otherwise would be the one dishonest
   * frame in the section.
   */
  const cited = category.id === "ats_readability" ? "structural" : "cited";

  return (
    <motion.li
      className="landing-score-row"
      style={{
        height: `${SCORE.rowH}vh`,
        opacity: appear,
        borderColor,
        background,
        scale: rowScale,
      }}
    >
      <div className="landing-score-row-top">
        <span className="landing-score-row-label">{category.label}</span>
        <span className="landing-score-row-pts">
          <motion.span>{points}</motion.span>
          <span className="landing-score-row-max">/{category.max}</span>
        </span>
      </div>
      {/* The marker shares the track's line rather than floating above the row.
          Absolutely positioned at a negative offset it landed on the previous
          row's bar, which read as a rendering fault on every row but the first. */}
      <div className="landing-score-row-foot">
        <div className="landing-score-row-track">
          <motion.span className="landing-score-row-fill" style={{ width }} />
        </div>
        <motion.span className="landing-score-row-cited" style={{ opacity: citedOpacity }}>
          {cited}
        </motion.span>
      </div>
    </motion.li>
  );
}
