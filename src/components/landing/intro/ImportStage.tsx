import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicIn, cubicInOut, cubicOut, limit } from "../beagleEase";
import { bezier, ramp } from "../scenes/choreography";
import { PanelElement } from "../SwipeElement";
import { ANCHORS, COPY, SIBLINGS, type Sibling } from "./manifest";

/**
 * Steps 3 -> 7: the mint band opens, five siblings arrive, two headlines wipe
 * through their own centre rules, and everything that is not the resume clears
 * out of the way.
 *
 * The sheet itself used to live here. It does not any more: it is a protagonist
 * spanning 3.12 -> 8.0 and it outlives this scene by two whole beats, so it has
 * its own file (`ResumePage`). What is left here is the FURNITURE — the surface
 * the page arrives on, the clutter it is picked out from, and the titles.
 *
 * ── The scatter costs nothing ──
 *
 * There is no scatter animation in this file. The siblings' `out` positions are
 * simply the far end of the same interpolation that brought them in, and the
 * mint band retracts because `PanelElement` is already in its OUTRO phase by the
 * time `pos` passes 4.5. Step 5 exists to give that outro somewhere to play, and
 * then does two more jobs on top of it (see `manifest`).
 *
 * ── The mint band's window, worked backwards ──
 *
 * `PanelElement`'s intro reveal runs over `stepIndex` 0.5 -> 1, i.e. over
 * `pos` (anchor - length + 0.5) -> (anchor - length + 1). The band has to open
 * AFTER the ink panel has left (~3.15) and be settled by the rest at 4.0, which
 * fixes `anchor - length = 2.5`. Resting inside the hold phase additionally
 * needs `length > 5 - anchor`. `length = 1.5, anchor = 4` satisfies both: opens
 * over 3.0 -> 3.5, holds, retracts over 4.5 -> 5.5 and is culled exactly as it
 * finishes — which is the first third of step 5's triple duty.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ────────────────────────── the siblings ────────────────────────── */

function SiblingDoc({ sib, pos }: { sib: Sibling; pos: MotionValue<number> }) {
  const flight = useTransform(pos, (p) => {
    const ti = cubicOut(ramp(p, 3.7 + sib.lead, 0.24), 0, 1, 1);
    const to = cubicIn(ramp(p, 4.52, 0.62), 0, 1, 1);

    // A gentle arc on the way in — straight lines read mechanical.
    const cx = lerp(sib.from[0], sib.to[0], 0.5) * 0.62;
    const cy = lerp(sib.from[1], sib.to[1], 0.5) * 0.62 - 0.07;
    const [ax, ay] = bezier(ti, sib.from[0], sib.from[1], cx, cy, sib.to[0], sib.to[1]);

    const x = lerp(ax, sib.out[0], to);
    const y = lerp(ay, sib.out[1], to);
    return { x, y, t: ti, o: to };
  });

  const x = useTransform(flight, (f) => `calc(-50% + ${f.x * 100}vw)`);
  const y = useTransform(flight, (f) => `calc(-50% + ${f.y * 100}vh)`);
  const rotate = useTransform(flight, (f) =>
    lerp(lerp(sib.rot * 0.35, sib.rot, f.t), sib.rotOut, f.o),
  );
  /**
   * They fade to NOTHING, not to 15%. Previously the scatter left five ghosts
   * parked at the frame edges for the rest of the story, which was invisible
   * while step 5 was the last step and is not once there are two beats after it.
   */
  const opacity = useTransform(flight, (f) => limit(f.t * 2.4, 0, 1) * (1 - f.o));
  const visibility = useTransform(pos, (p) => (p > 3.4 && p < 5.3 ? "visible" : "hidden"));

  return (
    <motion.div
      aria-hidden="true"
      className="landing-sib"
      style={{ width: `${sib.w}vw`, height: `${sib.h}vh`, x, y, rotate, opacity, visibility }}
    >
      <span
        className={sib.vertical ? "landing-sib-title landing-sib-title--v" : "landing-sib-title"}
      >
        {sib.title}
      </span>
      <span className="landing-sib-rules" />
    </motion.div>
  );
}

/* ────────────────────────── the headlines ────────────────────────── */

interface HeadProps {
  pos: MotionValue<number>;
  zIndex: number;
  label: string;
  title: string;
  sub: string;
  /** Base of the wipe sequence; the four sub-windows hang off it. */
  at: number;
  /** When it starts leaving, and over how long. */
  leaveAt: number;
  leaveLen: number;
  /** Cull window. */
  from: number;
  to: number;
  /**
   * Shrink on the way out, for a title that is being REPLACED by something
   * smaller rather than simply leaving. Step two retires into the chip at the
   * top of the page, and the scale-down is what sells it as the same object.
   */
  shrink?: boolean;
}

/**
 * The headline opens outward from a hairline rule on its own midline: the rule
 * scales out from the centre first, then the type unmasks vertically away from
 * it in both directions at once. That is the mid-wipe frame in the reference —
 * two half-height slivers of a word, growing apart.
 *
 * Used twice, identically, because step 6 is step 4's promise kept: same
 * treatment, same mechanism, one step further into the product.
 */
function BeatHead({
  pos,
  zIndex,
  label,
  title,
  sub,
  at,
  leaveAt,
  leaveLen,
  from,
  to,
  shrink = false,
}: HeadProps) {
  // Premium center-out line: grows from the midline (scaleX, origin center),
  // holds for a beat while the type unmasks, then dissolves BEFORE the rest —
  // so it never sits through the glyphs at hold. It is also painted BEHIND the
  // type (see CSS z-index), so even mid-wipe it reads as a reveal, not a strike.
  const ruleScale = useTransform(pos, (p) => cubicInOut(ramp(p, at + 0.04, 0.14), 0, 1, 1));
  const ruleOpacity = useTransform(pos, (p) => 1 - ramp(p, at + 0.16, 0.09));
  const wipe = useTransform(pos, (p) => cubicInOut(ramp(p, at + 0.1, 0.13), 0, 1, 1));

  const clipPath = useTransform(wipe, (v) => `inset(${(1 - v) * 50}% 0 ${(1 - v) * 50}% 0)`);
  const labelOpacity = useTransform(pos, (p) => ramp(p, at, 0.12));
  const subOpacity = useTransform(pos, (p) => ramp(p, at + 0.19, 0.12));

  const out = useTransform(pos, (p) => cubicInOut(ramp(p, leaveAt, leaveLen), 0, 1, 1));
  const opacity = useTransform(out, (v) => 1 - v);
  const scale = useTransform(out, (v) => (shrink ? 1 - v * 0.14 : 1));
  const visibility = useTransform(pos, (p) => (p > from && p < to ? "visible" : "hidden"));

  return (
    <motion.div className="landing-import-head" style={{ zIndex, opacity, scale, visibility }}>
      <motion.p className="landing-import-label" style={{ opacity: labelOpacity }}>
        {label}
      </motion.p>
      <div className="landing-import-titlewrap">
        <motion.span
          className="landing-import-rule"
          aria-hidden="true"
          style={{ scaleX: ruleScale, opacity: ruleOpacity }}
        />
        <motion.h2 className="landing-import-title" style={{ clipPath }}>
          {title}
        </motion.h2>
      </div>
      <motion.p className="landing-import-sub" style={{ opacity: subOpacity }}>
        {sub}
      </motion.p>
    </motion.div>
  );
}

/* ────────────────────────── composition ────────────────────────── */

export function ImportStage({ pos }: { pos: MotionValue<number> }) {
  return (
    <>
      <PanelElement
        pos={pos}
        anchor={ANCHORS.mintPanel.anchor}
        visibleLength={ANCHORS.mintPanel.length}
        color="var(--lp-mint-deep)"
        marginAspect={1.1}
        zIndex={16}
      >
        <div className="landing-grain absolute inset-0" />
      </PanelElement>

      <div className="landing-sib-layer" style={{ zIndex: 26 }} aria-hidden="true">
        {SIBLINGS.map((sib) => (
          <SiblingDoc key={sib.id} sib={sib} pos={pos} />
        ))}
      </div>

      {/* step 4 — the title holds through the rest, then leaves with the clutter.
          It clears by 4.82 rather than 4.95: the page is growing underneath it
          from 4.52, and because the head sits at z 42 the last few percent of
          opacity read as a grey ghost of "Upload Resume" lying ON the sheet. */}
      <BeatHead
        pos={pos}
        zIndex={42}
        label={COPY.import.label}
        title={COPY.import.title}
        sub={COPY.import.subheader}
        at={3.76}
        leaveAt={4.5}
        leaveLen={0.32}
        from={3.6}
        to={5.1}
      />

      {/* step 6 — arrives as the page finishes growing, then retires into its
          chip. It is GONE by 6.22, which is the frame the first phrase starts
          painting on: the veil under it lifts on the same window, so the title
          dissolving and the document coming into focus are one gesture. */}
      <BeatHead
        pos={pos}
        zIndex={42}
        label={COPY.calc.label}
        title={COPY.calc.title}
        sub={COPY.calc.subheader}
        at={5.76}
        leaveAt={6}
        leaveLen={0.22}
        from={5.6}
        to={6.3}
        shrink
      />
    </>
  );
}
