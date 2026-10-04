import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit } from "../beagleEase";
import { getScoreGreenShade } from "@/components/ui/AtsScoreRing";
import { ATS_CATEGORIES, ATS_PROOF, type Candidate } from "../sceneManifest";

/**
 * Step 5 — the laptop.
 *
 * The resume shrinks and fades exactly where this screen lights up (see
 * ResumeSheet's 4 -> 5 branch), so the document appears to be ingested. The
 * ring then counts up and the seven real ATS categories fill in sequence.
 *
 * TIMING CONTRACT: every animation here must COMPLETE before pos 5.0, because
 * 5 is a resting beat — a visitor who stops there has to see the finished
 * result, not a half-counted number. All windows below end at or before 5.0.
 *
 * Numbers are live from `jobly-api/src/modules/ats/score-role-fit.js`.
 */

/** Rest pose: below the title band, which owns the top ~48% of the viewport. */
const REST_Y = 0.235;

interface LaptopProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
  candidate: Candidate;
}

export function Laptop({ pos, anchor, visibleLength, candidate }: LaptopProps) {
  const enter = useTransform(pos, (p) => limit((p - 4.12) / 0.6, 0, 1));
  const exit = useTransform(pos, (p) => limit((p - 5.35) / 0.6, 0, 1));

  const y = useTransform([enter, exit] as const, ([e, x]: number[]) => {
    const rise = cubicOut(e, REST_Y + 0.5, -0.5, 1);
    return `calc(-50% + ${(rise - x * 0.95) * 100}vh)`;
  });
  const opacity = useTransform([enter, exit] as const, ([e, x]: number[]) =>
    limit(e / 0.3, 0, 1) * (1 - x),
  );
  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );

  // lid opens while the resume is still arriving
  const lid = useTransform(pos, (p) => limit((p - 4.28) / 0.32, 0, 1));
  const lidRotate = useTransform(lid, (l) => `${-68 + l * 68}deg`);
  // screen wakes the instant the resume is absorbed (4.62)
  const screenOn = useTransform(pos, (p) => limit((p - 4.56) / 0.2, 0, 1));

  // the score counts up and LANDS before the rest point
  const scoreT = useTransform(pos, (p) => limit((p - 4.64) / 0.3, 0, 1));
  const score = useTransform(scoreT, (t) => Math.round(cubicOut(t, 0, candidate.scoreBefore, 1)));
  const ringDash = useTransform(scoreT, (t) => {
    const pct = cubicOut(t, 0, candidate.scoreBefore, 1) / 100;
    return `${pct * 326.7} 326.7`;
  });
  const ringColor = useTransform(score, (s) => getScoreGreenShade(s));

  return (
    <motion.div
      className="landing-laptop-wrap"
      style={{ y, opacity, visibility, willChange: "transform, opacity" }}
    >
      <div className="landing-laptop">
        <motion.div
          className="landing-laptop-lid"
          style={{ rotateX: lidRotate, transformOrigin: "bottom center" }}
        >
          <motion.div className="landing-laptop-screen" style={{ opacity: screenOn }}>
            <div className="landing-laptop-inner">
              {/* the score */}
              <div className="landing-laptop-ring">
                <svg className="-rotate-90" viewBox="0 0 112 112">
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,.13)"
                    strokeWidth="7"
                  />
                  <motion.circle
                    cx="56"
                    cy="56"
                    r="52"
                    fill="none"
                    strokeWidth="7"
                    strokeLinecap="round"
                    style={{ stroke: ringColor, strokeDasharray: ringDash }}
                  />
                </svg>
                <div className="landing-laptop-ring-mid">
                  <motion.span className="landing-laptop-score">{score}</motion.span>
                  <span className="landing-laptop-score-cap">ATS score</span>
                </div>
              </div>

              {/* the seven real categories */}
              <ul className="landing-cats">
                {ATS_CATEGORIES.map((cat, i) => (
                  <CategoryBar key={cat.id} pos={pos} index={i} category={cat} />
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>

        <div className="landing-laptop-base">
          <div className="landing-laptop-notch" />
        </div>
      </div>

      <motion.ul className="landing-laptop-proof" style={{ opacity: screenOn }}>
        {ATS_PROOF.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

function CategoryBar({
  pos,
  index,
  category,
}: {
  pos: MotionValue<number>;
  index: number;
  category: (typeof ATS_CATEGORIES)[number];
}) {
  // staggered, last one lands at 4.70 + 6*0.022 + 0.18 = 4.97 — before the rest.
  const start = 4.7 + index * 0.022;
  const t = useTransform(pos, (p) => limit((p - start) / 0.18, 0, 1));
  const pct = (category.earned / category.max) * 100;
  const width = useTransform(t, (v) => `${cubicOut(v, 0, pct, 1)}%`);
  const opacity = useTransform(t, (v) => limit(v / 0.35, 0, 1));
  const shade = getScoreGreenShade(pct);

  return (
    <motion.li style={{ opacity }}>
      <div className="landing-cat-row">
        <span className="landing-cat-label">{category.label}</span>
        <span className="landing-cat-pts">
          {category.earned}
          <span className="landing-cat-max">/{category.max}</span>
        </span>
      </div>
      <div className="landing-cat-track">
        <motion.div className="landing-cat-fill" style={{ width, backgroundColor: shade }} />
      </div>
    </motion.li>
  );
}
