import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { ramp } from "../scenes/choreography";
import { useStepIndex } from "../SwipeElement";
import { heroImg } from "../sceneAssets";
import { ANCHORS, CARDS, CENTRE_INSET, COPY, type Card } from "./manifest";

/**
 * Step 0 -> 1: the hero photograph becomes a triptych.
 *
 * ── Why the frame closes instead of the image shrinking ──
 *
 * The obvious implementation is to scale the centre card up until it covers the
 * viewport, then scale it down. That does not work. Covering 100vw x 100vh from
 * a 32vw x 77vh box needs scaleX 3.125 and scaleY 1.30: non-uniform distorts the
 * photograph, and a uniform 3.125 magnifies the image more than threefold, so
 * step 0 would open on a heavily zoomed crop rather than the full frame.
 *
 * So the image never moves. A `clip-path: inset()` closes around it, from
 * `inset(0)` to the centre card's rect. The pixels stay exactly where they are
 * and the window onto them narrows — the frame shortens, not the photograph.
 * Composited, no layout, and continuity is perfect because it is never anything
 * other than the same pixels.
 *
 * ── Why the backdrop blur is static ──
 *
 * Animating `filter: blur()` forces the compositor to re-rasterise the layer on
 * every frame, which is the single most expensive thing you can do here. The
 * blurred, desaturated copy is therefore a SECOND layer carrying a STATIC
 * filter, faded in by opacity alone. Same convention as `landing-story.css`.
 */

/** The centre card's rect, as an animatable `clip-path`. `t` 0 = full bleed. */
function insetAt(t: number): string {
  const v = cubicInOut(limit(t, 0, 1), 0, 1, 1);
  const top = v * CENTRE_INSET.top;
  const side = v * CENTRE_INSET.side;
  return `inset(${top}vh ${side}vw ${top}vh ${side}vw round ${v * 3}px)`;
}

/** One sibling crop. Scale + grade are static; only transform/opacity animate. */
function SideCard({
  card,
  pos,
  delay,
}: {
  card: Card;
  pos: MotionValue<number>;
  delay: number;
}) {
  // They arrive in the back half of the move, staggered, so the centre frame has
  // already begun closing before anything else enters. Entering together reads
  // as a grid assembling; entering late and staggered reads as composition.
  const t = useTransform(pos, (p) => cubicOut(ramp(p, 0.42 + delay, 0.52), 0, 1, 1));

  const x = useTransform(t, (v) => `calc(-50% + ${card.x + (card.fromX ?? 0) * (1 - v)}vw)`);
  const y = useTransform(t, (v) => `calc(-50% + ${card.y + 3 * (1 - v)}vh)`);
  const opacity = useTransform(t, (v) => limit(v * 1.25, 0, 1));
  const scale = useTransform(t, (v) => 0.94 + 0.06 * v);

  return (
    <motion.div
      aria-hidden="true"
      className="landing-tri-card"
      style={{
        width: `${card.w}vw`,
        height: `${card.h}vh`,
        backgroundImage: `url(${heroImg})`,
        backgroundSize: card.size,
        backgroundPosition: card.position,
        filter: card.filter,
        x,
        y,
        opacity,
        scale,
      }}
    />
  );
}

export function HeroTriptych({
  pos,
  onHintClick,
  zIndex = 5,
}: {
  pos: MotionValue<number>;
  onHintClick: () => void;
  zIndex?: number;
}) {
  const { anchor, length } = ANCHORS.heroPhoto;

  /**
   * The whole hero layer retires over pos 1.15 -> 1.85, uncovering the cream
   * stage underneath. That IS the "background turns whitish" moment — there is
   * no cream panel, because the stage is already cream; the photograph simply
   * stops covering it.
   */
  const layerOpacity = useTransform(pos, (p) => 1 - ramp(p, 1.15, 0.7));
  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < length ? "visible" : "hidden",
  );

  // Sharp layer: the closing window.
  const clipPath = useTransform(pos, (p) => insetAt(p));
  // A breath of scale so the photograph is not completely inert at rest.
  const photoScale = useTransform(pos, (p) => 1.06 - 0.06 * limit(p, 0, 1));

  // Blurred layer: static filter, faded in as the frame closes.
  const blurOpacity = useTransform(pos, (p) => cubicInOut(ramp(p, 0.08, 0.84), 0, 1, 1));
  // The wash toward cream rides the same ramp, slightly behind it.
  const veilOpacity = useTransform(pos, (p) => ramp(p, 0.3, 0.75) * 0.34);

  return (
    <motion.div
      className="landing-tri-layer"
      style={{ zIndex, opacity: layerOpacity, visibility }}
    >
      {/* ── the desaturated, blurred backdrop ── */}
      <motion.div className="landing-tri-blur" aria-hidden="true" style={{ opacity: blurOpacity }}>
        <img src={heroImg} alt="" className="landing-tri-img" />
      </motion.div>
      <motion.div
        className="landing-tri-veil"
        aria-hidden="true"
        style={{ opacity: veilOpacity }}
      />

      {/* ── the sharp photograph, inside the closing window ── */}
      <motion.div className="landing-tri-centre" style={{ clipPath }}>
        <motion.img
          src={heroImg}
          alt="Two people working through a resume together at a sunlit table"
          className="landing-tri-img"
          style={{ scale: photoScale }}
        />
        <div className="landing-tri-scrim" aria-hidden="true" />
        <div className="landing-vignette absolute inset-0" aria-hidden="true" />
      </motion.div>

      {/* ── the two siblings ── */}
      {CARDS.filter((c) => c.id !== "centre").map((card, i) => (
        <SideCard key={card.id} card={card} pos={pos} delay={i * 0.1} />
      ))}

      {/* ── the title, which retires as the frame closes ── */}
      <HeroTitle pos={pos} />

      <HeroHint pos={pos} onClick={onHintClick} />
    </motion.div>
  );
}

/**
 * Positioned the way `TitleCard` is — `inset-x-0` plus a `top` — rather than via
 * `SwipeElement`. `SwipeElement` anchors at `left/top: 50%` without a
 * compensating -50% translate, because it owns the whole `transform` string, so
 * centring a block of unknown height inside it needs a fixed height and a
 * negative margin. The house pattern avoids all of that.
 */
function HeroTitle({ pos }: { pos: MotionValue<number> }) {
  const { anchor, length } = ANCHORS.heroTitle;
  const stepIndex = useStepIndex(pos, anchor, length);
  const outroStart = 2 * length - 1;

  const opacity = useTransform(stepIndex, (si) =>
    si < 1 ? limit(si / 0.4, 0, 1) : limit(1 - (si - outroStart) / 0.42, 0, 1),
  );
  const y = useTransform(stepIndex, (si) =>
    si < 1 ? `${cubicOut(limit(si, 0, 1), 7, -7, 1)}vh` : `${-limit((si - outroStart) / 0.5, 0, 1) * 7}vh`,
  );
  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < length ? "visible" : "hidden",
  );

  return (
    <motion.div
      className="landing-intro-herotitle"
      style={{ opacity, y, visibility, zIndex: 40 }}
    >
      <h1 className="landing-intro-h1">{COPY.hero.title}</h1>
      <p className="landing-intro-sub">{COPY.hero.subheader}</p>
    </motion.div>
  );
}

/**
 * `NextPagePixiElement` — the bobbing ring at 90% height. Rebuilt rather than
 * reused from `scenes/pieces` so it can live inside the hero layer and retire
 * with it, and so the intro section carries no dependency on the long story's
 * manifest.
 */
function HeroHint({ pos, onClick }: { pos: MotionValue<number>; onClick: () => void }) {
  const opacity = useTransform(pos, (p) =>
    p < 0 ? limit(p + 1, 0, 1) : 1 - ramp(p, 0.05, 0.3),
  );
  const visibility = useTransform(pos, (p) => (p > -0.99 && p < 0.42 ? "visible" : "hidden"));

  return (
    <motion.div className="landing-intro-hint" style={{ opacity, visibility }}>
      <button type="button" onClick={onClick} aria-label="Scroll to the next section" data-no-drag>
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>
    </motion.div>
  );
}
