import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit } from "../beagleEase";
import { ramp, useFlight } from "../scenes/choreography";
import { CHIPS, SCAN, SCORE, scoreRowY, type Chip } from "./manifest";

/**
 * The keyword flight.
 *
 * As the band finishes painting a phrase, that phrase's skill pops off the page
 * and flies into the ATS category row it pays for. This is the connective tissue
 * the whole section rests on: the score is not a number that appears, it is
 * seven sentences arriving one at a time in the rows they bought.
 *
 * ── Why the launch points are authored, not measured ──
 *
 * The chips live on the STAGE, not inside the page, because they have to cross
 * the gutter between the sheet and the column. So they cannot read the page's
 * own layout. Instead `manifest.bulletPoint` walks the same `DOC` rhythm table
 * the stylesheet is built from and hands each chip a launch point in viewport
 * fractions. A vw or two of error there is invisible, because the row it comes
 * from leans forward at the same moment and the eye ties the two together.
 *
 * ── Why they dissolve rather than dock ──
 *
 * Keeping seven landed chips pinned to six rows would be truer to "nothing is
 * thrown away", and it also clutters a 26vw column into illegibility. So the
 * chip lands, the row flashes and fills on the same frame, and the chip fades
 * out over the next 0.06 of a step — the row's own `cited` marker carries the
 * proof from then on.
 */

export function KeywordFlight({ pos, zIndex }: { pos: MotionValue<number>; zIndex: number }) {
  return (
    <div className="landing-chip-layer" style={{ zIndex }} aria-hidden="true">
      {CHIPS.map((chip) => (
        <FlyingChip key={chip.id} pos={pos} chip={chip} />
      ))}
    </div>
  );
}

function FlyingChip({ pos, chip }: { pos: MotionValue<number>; chip: Chip }) {
  const at = SCAN.start + chip.order * SCAN.step + SCAN.chipLead;

  /**
   * Two phrases pay into `required_skills`, so they would land on the same
   * pixel. The second takes a lane: a little further right and a little higher,
   * which also makes them arrive as a pair rather than one correcting the other.
   */
  const to: [number, number] = [
    SCORE.chipX + chip.lane * 0.036,
    scoreRowY(chip.row) - chip.lane * 0.017,
  ];

  // Arc up and out. A straight line between two points reads mechanical; the
  // control point above both ends is what makes it look thrown.
  const control: [number, number] = [
    (chip.from[0] + to[0]) / 2 + 0.05,
    Math.min(chip.from[1], to[1]) - 0.15,
  ];

  const transform = useFlight(pos, at, SCAN.chipLen, [chip.from[0], chip.from[1]], control, to);
  const t = useTransform(pos, (p) => ramp(p, at, SCAN.chipLen));

  // In fast as the marker lets go, out over the row's flash as it is absorbed.
  // The out window is tied to the LANDING, so the last chip is gone by 6.96
  // rather than parked on its row for the whole of step 7.
  const opacity = useTransform(
    pos,
    (p) => ramp(p, at - 0.025, 0.05) * (1 - ramp(p, at + SCAN.chipLen - 0.005, 0.06)),
  );

  // Pops off the paper: small, overshoots, settles.
  const scale = useTransform(t, (v) => {
    const grow = cubicOut(limit(v / 0.3, 0, 1), 0.55, 0.5, 1);
    return grow - limit((v - 0.72) / 0.28, 0, 1) * 0.05;
  });
  const rotate = useTransform(t, (v) => (1 - v) * (chip.order % 2 === 0 ? 7 : -8));

  return (
    <motion.div className="landing-chip" style={{ transform }}>
      <motion.span className="landing-chip-body" style={{ opacity, scale, rotate }}>
        {chip.label}
      </motion.span>
    </motion.div>
  );
}
