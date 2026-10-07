import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicIn, cubicInOut, cubicOut, limit } from "../beagleEase";
import { ramp } from "../scenes/choreography";
import { HighlightedLine } from "../scenes/Highlighter";
import {
  ANCHORS,
  COPY,
  PAGE,
  PAGE_BOX,
  PAGE_SHIFT_X,
  PAGE_VARS,
  PAGE_Y,
  RESUME,
  RESUME_BODY,
  RESUME_BULLETS,
  SCAN,
  SCAN_END,
  bulletPaint,
  type ResumeBlock,
  type ResumeBullet,
} from "./manifest";

/**
 * THE PROTAGONIST — one sheet of paper, from 3.12 to 8.0.
 *
 * It rises into frame behind the opening mint band, types its own header,
 * GROWS across step 5 while its skeleton resolves into readable text, gets read
 * section by section at step 7, and lifts away into the CTA. It is never
 * unmounted in between, which is the entire reason step 5 reads as the same
 * document coming forward rather than one document leaving and another arriving.
 *
 * ── Why it scales rather than resizes ──
 *
 * Animating width/height is layout work on every frame. So the box is rendered
 * at its FINAL size (92vh tall) and scaled DOWN to 0.75 for step 4 — never up,
 * so the text is never a stretched bitmap. See `PAGE_BOX` for the geometry this
 * forces, and why it is locked to height.
 *
 * ── Why the resolve is a cross-fade ──
 *
 * A per-line "un-redact", the dark bars retracting off the text they were
 * covering, would be more clever. It would also read oddly: the bars are nearly
 * black and would look like something being erased rather than something
 * becoming legible. A cross-fade during a SCALE CHANGE is effectively invisible,
 * because the eye is tracking the size, not the glyphs:
 *
 *   4.30 - 4.80   skeleton bars out
 *   4.52 - 5.44   the page grows, 0.75 -> 1
 *   4.60 - 5.43   real lines in, staggered, each on a small rise
 *
 * ── Why the scan band is measured, not calculated ──
 *
 * The band has to park on each row and pause longer at section boundaries,
 * which needs the rows' real pixel positions — a formula would drift the moment
 * a sentence wrapped. So the row rects are read ONCE (plus on resize and on
 * `fonts.ready`) and everything after that is transform-only. `offsetTop` is
 * layout-based and completely unaffected by the ancestor `scale`, so the same
 * numbers hold at 0.75 and at 1.
 */

interface Rect {
  top: number;
  h: number;
}

const EMPTY: { rows: Rect[]; heads: Rect[] } = { rows: [], heads: [] };

/** Which section each bullet belongs to, by document position. */
const SECTION_OF: readonly number[] = RESUME_BODY.flatMap((block, si) =>
  block.bullets.map(() => si),
);

/**
 * Stagger order for the resolve. Heads and bullets interleave in document
 * order, with the skills line last, so the page fills top to bottom.
 */
const LINE_OF: ReadonlyMap<string, number> = (() => {
  const map = new Map<string, number>();
  let i = 0;
  for (const block of RESUME_BODY) {
    map.set(`h:${block.id}`, i++);
    for (const bullet of block.bullets) map.set(`b:${bullet.id}`, i++);
  }
  map.set("skills", i);
  return map;
})();

const RESOLVE_AT = 4.6;
const RESOLVE_STEP = 0.055;
const RESOLVE_LEN = 0.22;

/* ────────────────────────── measurement ────────────────────────── */

function useDocGeometry(host: RefObject<HTMLDivElement | null>) {
  const [geo, setGeo] = useState(EMPTY);
  const signature = useRef("");

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;

    const read = () => {
      const pick = (selector: string): Rect[] =>
        Array.from(el.querySelectorAll<HTMLElement>(selector)).map((node) => ({
          top: node.offsetTop,
          h: node.offsetHeight,
        }));
      const next = { rows: pick("[data-scan-row]"), heads: pick("[data-scan-head]") };
      // ResizeObserver fires on every layout pass; without this guard setting
      // state here would feed itself.
      const sig = JSON.stringify(next);
      if (sig === signature.current) return;
      signature.current = sig;
      setGeo(next);
    };

    read();

    const observer = new ResizeObserver(read);
    observer.observe(el);

    // Web fonts land after first paint and change every line box.
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) read();
    });

    return () => {
      live = false;
      observer.disconnect();
    };
  }, [host]);

  return geo;
}

/* ────────────────────────── the typed header ────────────────────────── */

/**
 * A line of type the page writes into itself.
 *
 * `MotionValue<string>` rendered straight as a child — Framer subscribes and
 * writes `textContent` directly, so a 25-character reveal costs zero React
 * renders. Same technique as `InterviewRoom.CodeLine`.
 */
function Typed({
  pos,
  at,
  len,
  text,
  className,
}: {
  pos: MotionValue<number>;
  at: number;
  len: number;
  text: string;
  className: string;
}) {
  const reveal = useTransform(pos, (p) => ramp(p, at, len));
  const shown = useTransform(reveal, (v) => text.slice(0, Math.round(v * text.length)));
  const caret = useTransform(reveal, (v) => (v > 0.02 && v < 0.99 ? 1 : 0));

  return (
    <div className={className}>
      <motion.span>{shown}</motion.span>
      <motion.span className="landing-page-caret" style={{ opacity: caret }} />
    </div>
  );
}

/* ────────────────────────── the skeleton ────────────────────────── */

/** Grows from the left, so it reads as text being laid in. */
function BodyLine({ pos, i, w }: { pos: MotionValue<number>; i: number; w: number }) {
  const t = useTransform(pos, (p) => cubicOut(ramp(p, 3.86 + i * 0.015, 0.045), 0, 1, 1));
  const scaleX = useTransform(t, (v) => v);
  const opacity = useTransform(t, (v) => limit(v * 3, 0, 1) * 0.5);
  return (
    <motion.span className="landing-page-line" style={{ width: `${w * 100}%`, scaleX, opacity }} />
  );
}

function Skeleton({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => 1 - ramp(p, 4.3, 0.5));
  const visibility = useTransform(pos, (p) => (p < 4.84 ? "visible" : "hidden"));

  return (
    <motion.div className="landing-page-skel" style={{ opacity, visibility }}>
      <Typed pos={pos} at={3.86} len={0.05} text={PAGE.section} className="landing-page-section" />
      <div className="landing-page-body">
        {PAGE.lines.map((w, i) => (
          <BodyLine key={i} pos={pos} i={i} w={w} />
        ))}
      </div>
    </motion.div>
  );
}

/* ────────────────────────── the real document ────────────────────────── */

function SectionHead({ pos, block }: { pos: MotionValue<number>; block: ResumeBlock }) {
  const line = LINE_OF.get(`h:${block.id}`) ?? 0;
  const appear = useTransform(pos, (p) => ramp(p, RESOLVE_AT + line * RESOLVE_STEP, RESOLVE_LEN));
  const y = useTransform(appear, (v) => `${(1 - v) * 7}px`);

  // Brightens as the band arrives at its first bullet.
  const firstOrder = block.bullets[0].order;
  const lit = useTransform(pos, (p) => ramp(p, SCAN.start + firstOrder * SCAN.step - 0.05, 0.16));
  const color = useTransform(lit, (v) => `rgb(47 48 45 / ${0.4 + v * 0.48})`);

  return (
    <motion.p className="landing-doc-head" data-scan-head style={{ opacity: appear, y, color }}>
      {block.label}
      <motion.span className="landing-doc-head-bar" style={{ scaleX: lit }} />
    </motion.p>
  );
}

function Bullet({ pos, bullet }: { pos: MotionValue<number>; bullet: ResumeBullet }) {
  const line = LINE_OF.get(`b:${bullet.id}`) ?? 0;
  const appear = useTransform(pos, (p) => ramp(p, RESOLVE_AT + line * RESOLVE_STEP, RESOLVE_LEN));
  const paint = useTransform(pos, (p) => bulletPaint(p, bullet.order));

  // The row the band is on leans toward the reader. Same device as the long
  // story's `ParseLine`, which is why the two beats feel like one engine.
  const focus = useTransform(pos, (p) => {
    const centre = SCAN.start + bullet.order * SCAN.step + SCAN.paint / 2;
    return limit(1 - Math.abs(p - centre) / 0.17, 0, 1);
  });
  const x = useTransform(focus, (v) => `${v * 5}px`);
  const y = useTransform(appear, (v) => `${(1 - v) * 7}px`);
  const dotScale = useTransform(paint, (v) => 1 + Math.sin(Math.PI * v) * 0.6);
  const dotOpacity = useTransform(paint, (v) => 0.28 + v * 0.62);

  return (
    <motion.p className="landing-doc-line" data-scan-row style={{ opacity: appear, x, y }}>
      <motion.span className="landing-doc-dot" style={{ scale: dotScale, opacity: dotOpacity }} />
      <span className="landing-doc-text">
        {/*
          The long story's highlighter, unchanged except for its two surface
          colours — the marker, the chisel ends, the overshoot-and-pull-back, the
          second darker pass and the ink pool all come for free.
        */}
        <HighlightedLine
          paint={paint}
          before={bullet.before}
          phrase={bullet.phrase}
          after={bullet.after}
          rest="rgb(47 48 45 / 0.84)"
          inked="#1b2c23"
          body="rgb(47 48 45 / 0.76)"
        />
      </span>
    </motion.p>
  );
}

function SkillsLine({ pos }: { pos: MotionValue<number> }) {
  const line = LINE_OF.get("skills") ?? 0;
  const appear = useTransform(pos, (p) => ramp(p, RESOLVE_AT + line * RESOLVE_STEP, RESOLVE_LEN));
  const y = useTransform(appear, (v) => `${(1 - v) * 7}px`);

  return (
    <motion.div className="landing-doc-skills" style={{ opacity: appear, y }}>
      <span className="landing-doc-rule" />
      <p className="landing-doc-head">{RESUME.skillsLabel}</p>
      <p className="landing-doc-skills-line">{RESUME.skills.join("  ·  ")}</p>
    </motion.div>
  );
}

/* ────────────────────────── the scan ────────────────────────── */

/**
 * The band that travels down the document.
 *
 * It parks on each row for `SCAN.hold` of that row's slot and then eases to the
 * next, and the pause is LONGER when the next row starts a new section — so the
 * movement itself says "that block is finished, now this one".
 */
function ScanBand({ pos, rows }: { pos: MotionValue<number>; rows: Rect[] }) {
  const n = rows.length;

  const yPx = useTransform(pos, (p) => {
    if (n === 0) return 0;
    const f = limit((p - SCAN.start) / SCAN.step, 0, n - 1);
    const i = Math.floor(f);
    const j = Math.min(n - 1, i + 1);
    const local = f - i;
    const hold = SECTION_OF[i] === SECTION_OF[j] ? SCAN.hold : SCAN.holdSection;
    const t = local <= hold ? 0 : cubicInOut((local - hold) / (1 - hold), 0, 1, 1);
    const a = rows[i].top + rows[i].h / 2;
    const b = rows[j].top + rows[j].h / 2;
    return a + (b - a) * t;
  });

  const y = useTransform(yPx, (v) => `calc(${v}px - 50%)`);
  const opacity = useTransform(
    pos,
    (p) => ramp(p, SCAN.start - 0.12, 0.14) * (1 - ramp(p, SCAN_END - 0.05, 0.17)),
  );

  return <motion.span className="landing-scan-band" style={{ y, opacity }} aria-hidden="true" />;
}

/**
 * At rest the driven band is gone and this takes over: a faint continuous
 * sweep, as a CSS animation for the same reason the glyphs drift that way —
 * it keeps moving while the user is stationary, which is exactly when a static
 * frame starts to look like a screenshot. Quiet enough to read as "live
 * document" rather than "still loading".
 */
function IdleSweep({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(
    pos,
    (p) => ramp(p, SCAN_END + 0.04, 0.22) * (1 - ramp(p, 7.46, 0.3)),
  );
  return <motion.span className="landing-scan-idle" style={{ opacity }} aria-hidden="true" />;
}

/**
 * Focus blooms — faint warm radials that PERSIST where the band has already
 * looked, so by the end the page carries a record of how it was read. Wide at
 * the top of each section and narrowing down the list, which builds up
 * something F-pattern-ish without ever claiming to be real eye-tracking.
 *
 * Static gradients faded by opacity, never animated filters.
 */
function FocusBlooms({ pos, rows }: { pos: MotionValue<number>; rows: Rect[] }) {
  const shape = useMemo(() => {
    let local = 0;
    return RESUME_BULLETS.map((bullet, i) => {
      const first = i === 0 || SECTION_OF[i] !== SECTION_OF[i - 1];
      local = first ? 0 : local + 1;
      return {
        order: bullet.order,
        w: first ? 94 : Math.max(36, 76 - local * 13),
        // Deliberately low. At 0.6/0.42 seven of these stacked up turned the
        // whole sheet yellow by the last row, which stopped reading as "where it
        // has looked" and started reading as "the paper is stained".
        op: first ? 0.3 : 0.2,
      };
    });
  }, []);

  return (
    <span className="landing-bloom-layer" aria-hidden="true">
      {shape.map((s, i) =>
        rows[i] ? <Bloom key={s.order} pos={pos} rect={rows[i]} w={s.w} op={s.op} /> : null,
      )}
    </span>
  );
}

function Bloom({
  pos,
  rect,
  w,
  op,
}: {
  pos: MotionValue<number>;
  rect: Rect;
  w: number;
  op: number;
}) {
  const opacity = useTransform(pos, (p) => ramp(p, SCAN.start - 0.02, 0.3) * op);
  return (
    <motion.span
      className="landing-bloom"
      style={{
        top: rect.top + rect.h / 2,
        width: `${w}%`,
        height: rect.h * 3.2,
        opacity,
      }}
    />
  );
}

/**
 * The focus pull.
 *
 * Step 4 gets away with a 9.4vh headline over the sheet because the sheet is
 * nearly empty there. Step 6 cannot: by then the page is a full page, and
 * "ATS Calculation" in front of seven dark sentences reads as a collision rather
 * than a composition — the kicker lands on top of a bullet and the sub-line cuts
 * a sentence in half.
 *
 * So the paper stays solid white and only its INK recedes. The document is still
 * unmistakably a document — structure, rules, section blocks, the shape of a
 * page — while the title owns the frame. Then the veil lifts exactly as the band
 * arrives, which makes the scan beat read as the document coming into focus. One
 * element, no layout change, and the collision becomes the point.
 *
 * Sequenced deliberately against the resolve: the text finishes resolving at
 * 5.43 IN FULL VIEW (that is the payoff of the grow), and only then is it
 * washed back.
 */
function Veil({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 5.5, 0.34) * (1 - ramp(p, 6, 0.22)) * 0.78);
  const visibility = useTransform(pos, (p) => (p > 5.45 && p < 6.25 ? "visible" : "hidden"));
  return (
    <motion.span className="landing-page-veil" style={{ opacity, visibility }} aria-hidden="true" />
  );
}

/**
 * The retired headline. At step 6 "ATS Calculation" is a 9.4vh display line in
 * front of the sheet; it cannot stay there once the sheet has to be READ, so it
 * comes back as this. Titles holding at rest is the Beagle convention, and this
 * is a deliberate departure from it — the alternative is keeping the headline
 * and accepting that the bottom two thirds of the resume is never legible.
 */
function ScanChip({ pos }: { pos: MotionValue<number> }) {
  const appear = useTransform(pos, (p) => ramp(p, 6.1, 0.2));
  const opacity = useTransform(pos, (p) => ramp(p, 6.1, 0.2) * (1 - ramp(p, 7.46, 0.3)));
  const scale = useTransform(appear, (v) => 0.88 + 0.12 * v);
  const section = useTransform(pos, (p) => {
    const f = limit((p - SCAN.start) / SCAN.step, 0, RESUME_BULLETS.length - 1);
    return `Section ${SECTION_OF[Math.floor(f)] + 1} of ${RESUME_BODY.length}`;
  });

  return (
    <motion.div className="landing-scan-chip" style={{ opacity, scale }}>
      <span className="landing-scan-chip-pulse" />
      <span>{COPY.scan.chip}</span>
      <span className="landing-scan-chip-sep">·</span>
      <motion.span className="landing-scan-chip-sec">{section}</motion.span>
    </motion.div>
  );
}

/* ────────────────────────── composition ────────────────────────── */

export function ResumePage({ pos, zIndex }: { pos: MotionValue<number>; zIndex: number }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const { rows } = useDocGeometry(bodyRef);

  /* ── the four moves, each a pure function of pos ── */
  const rise = useTransform(pos, (p) => cubicOut(ramp(p, 3.12, 0.56), 0, 1, 1));
  const grow = useTransform(pos, (p) => cubicInOut(ramp(p, 4.52, 0.92), 0, 1, 1));
  const settle = useTransform(pos, (p) => cubicInOut(ramp(p, 6.06, 0.54), 0, 1, 1));
  /**
   * The leave has to FINISH inside the scrollable range. At 7.52 + 0.5 the
   * window ends at 8.02 — past `END_STEP` — and `cubicIn` only reaches 0.885 by
   * then, which left a legible ghost of seven sentences hanging over the CTA.
   * Everything on this beat now clears by 7.84.
   */
  const leave = useTransform(pos, (p) => cubicIn(ramp(p, 7.42, 0.42), 0, 1, 1));

  const x = useTransform(settle, (s) => `calc(-50% + ${s * PAGE_SHIFT_X}vw)`);
  const y = useTransform([rise, grow, settle, leave], ([r, g, s, l]: number[]) => {
    const vh = (1 - r) * 16 + g * PAGE_Y.grown + s * (PAGE_Y.settled - PAGE_Y.grown) - l * 32;
    return `calc(-50% + ${vh}vh)`;
  });
  const scale = useTransform([rise, grow, leave], ([r, g, l]: number[]) => {
    const span = PAGE_BOX.fullScale - PAGE_BOX.smallScale;
    return PAGE_BOX.smallScale - 0.05 + 0.05 * r + span * g - l * 0.04;
  });
  /**
   * It leaves COMPLETELY. Fading to 0.08 left a legible ghost of seven sentences
   * hanging over the CTA, which is worse than either showing it or not.
   */
  const opacity = useTransform([rise, leave], ([r, l]: number[]) => limit(r * 2, 0, 1) * (1 - l));
  const ruleScale = useTransform(pos, (p) => cubicOut(ramp(p, 3.82, 0.1), 0, 1, 1));

  /**
   * SOFT TEXT GUARD. A 92vh composited layer carrying 12px type can rasterise
   * at the layer's creation scale in Chrome and stay soft after the transform
   * settles. Pinning `will-change` makes that permanent, so it is only promised
   * while the page is actually MOVING and dropped at every rest.
   *
   * Driven as a MotionValue rather than React state on purpose: assigning the
   * same string to a style property is a no-op in Blink, so this costs one
   * string compare per frame instead of a re-render of eleven children mid
   * transition.
   */
  const willChange = useTransform(pos, (p) =>
    (p > 3 && p < 5.62) || (p > 5.94 && p < 6.72) || p > 7.42 ? "transform, opacity" : "auto",
  );

  const visibility = useTransform(pos, (p) =>
    Math.abs(ANCHORS.resumePage.anchor - p) < ANCHORS.resumePage.length ? "visible" : "hidden",
  );

  return (
    <motion.section
      className="landing-page"
      aria-label="Resume being read and scored"
      style={{ ...PAGE_VARS, zIndex, x, y, scale, opacity, visibility, willChange }}
    >
      <span className="landing-page-fold" aria-hidden="true" />

      <Typed pos={pos} at={3.5} len={0.1} text={RESUME.tag} className="landing-page-tag" />
      <Typed pos={pos} at={3.58} len={0.18} text={RESUME.name} className="landing-page-name" />
      <Typed
        pos={pos}
        at={3.74}
        len={0.14}
        text={`${RESUME.role} · ${RESUME.org}`}
        className="landing-page-role"
      />

      <motion.span className="landing-page-rule" style={{ scaleX: ruleScale }} />

      <ScanChip pos={pos} />

      {/* Both blocks occupy the same slot, so the cross-fade has nowhere to jump to. */}
      <div className="landing-page-stack">
        <Skeleton pos={pos} />

        <div className="landing-page-real" ref={bodyRef}>
          <FocusBlooms pos={pos} rows={rows} />
          {RESUME_BODY.map((block) => (
            <div key={block.id} className="landing-doc-block">
              <SectionHead pos={pos} block={block} />
              {block.bullets.map((bullet) => (
                <Bullet key={bullet.id} pos={pos} bullet={bullet} />
              ))}
            </div>
          ))}
          <SkillsLine pos={pos} />
          <ScanBand pos={pos} rows={rows} />
          <IdleSweep pos={pos} />
        </div>
      </div>

      {/* Above the ink, below the chip — so the title beat reads as a focus pull. */}
      <Veil pos={pos} />
    </motion.section>
  );
}
