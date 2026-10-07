import { motion, useTransform, type MotionValue } from "framer-motion";
import { Check } from "lucide-react";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { getScoreGreenShade } from "@/components/ui/AtsScoreRing";
import { bezier, ramp, settle, squash, useVisible } from "./choreography";
import { MAILBOXES, type Candidate, type Mailbox } from "../sceneManifest";

/**
 * Beat 9: apply where you fit.
 *
 * The resume does not turn into three abstract "role cards" — it is copied,
 * and the copies are posted. You see the same sheet triplicate, fan out,
 * fly along three arcs, and drop through three slots. Each mailbox flap
 * lifts as its letter arrives, stamps itself received, and the best-fit box
 * flips to "Interview scheduled", which is the hand-off into beat 11.
 *
 * TIMING
 *   9.10 - 9.35  three mailboxes rise, lids shut
 *   9.20 - 9.40  the sheet splits into three copies that fan out
 *   9.35 - 10.05 copies fly, staggered 0.07, flap opens on approach
 *   9.70 - 10.15 Received stamps land
 *  10.10 - 10.45 the top box flips to Interview scheduled
 *  10.60 - 11.20 boxes recede as the room takes over
 *
 * Entry at 9.10 overlaps the laptop's pull-back (8.90-9.60) and the exit
 * overlaps InterviewRoom's entry at 10.75.
 */

interface MailboxFlightProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
  candidate: Candidate;
}

export function MailboxFlight({ pos, anchor, visibleLength, candidate }: MailboxFlightProps) {
  const visibility = useVisible(pos, anchor, visibleLength);

  return (
    <motion.div className="landing-postroom" style={{ visibility, zIndex: 30 }}>
      {MAILBOXES.map((box, i) => (
        <MailboxUnit key={box.id} pos={pos} box={box} index={i} />
      ))}
      {MAILBOXES.map((box, i) => (
        <ApplicationCopy key={`copy-${box.id}`} pos={pos} box={box} index={i} candidate={candidate} />
      ))}
    </motion.div>
  );
}

/** One company's mailbox: body, slot, flap, stamp, status. */
function MailboxUnit({
  pos,
  box,
  index,
}: {
  pos: MotionValue<number>;
  box: Mailbox;
  index: number;
}) {
  const rise = useTransform(pos, (p) => ramp(p, 9.1 + index * 0.06, 0.4));
  const leave = useTransform(pos, (p) => ramp(p, 10.6, 0.6));

  const transform = useTransform([rise, leave] as const, ([r, l]: number[]) => {
    const y = cubicOut(r, 0.4, -0.4, 1) + box.y + l * -0.55;
    const s = (0.9 + r * 0.1) * (1 - l * 0.12);
    return `translate3d(calc(-50% + ${box.x * 100}vw), calc(-50% + ${y * 100}vh), 0) scale(${s})`;
  });
  const opacity = useTransform([rise, leave] as const, ([r, l]: number[]) =>
    limit(r / 0.4, 0, 1) * (1 - l),
  );

  // The flap lifts as its letter approaches, then shuts behind it.
  const arriveAt = 9.35 + index * 0.07;
  const flap = useTransform(pos, (p) => {
    const open = ramp(p, arriveAt + 0.3, 0.2);
    const shut = ramp(p, arriveAt + 0.62, 0.22);
    const a = open * (1 - shut);
    return `${-a * 62 * settle(open, 0.06, 1)}deg`;
  });

  // Received stamp thumps down after the letter is in.
  const stamp = useTransform(pos, (p) => ramp(p, arriveAt + 0.66, 0.26));
  const stampScale = useTransform(stamp, (v) => (v <= 0 ? 1.5 : 1.5 - cubicOut(v, 0, 0.5, 1)));
  const stampOpacity = useTransform(stamp, (v) => limit(v / 0.3, 0, 1));
  const stampRot = useTransform(stamp, (v) => `${-9 + (1 - v) * 7}deg`);

  // Box shudders a little as the stamp lands.
  const thump = useTransform(stamp, (v) => {
    const t = limit(v / 0.35, 0, 1);
    return t > 0 && t < 1 ? 1 + Math.sin(t * Math.PI) * 0.03 : 1;
  });

  // Best-fit box flips to scheduled.
  const isTop = box.state === "scheduled";
  const flip = useTransform(pos, (p) => (isTop ? ramp(p, 10.1, 0.3) : 0));
  const receivedOpacity = useTransform(flip, (v) => 1 - v);
  const schedOpacity = useTransform(flip, (v) => v);
  const schedGlow = useTransform(flip, (v) => `0 0 ${v * 30}px rgba(127,210,177,${v * 0.45})`);

  const shade = getScoreGreenShade(box.fit);

  return (
    <motion.article className="landing-mailbox" style={{ transform, opacity }}>
      <motion.div className="landing-mailbox-shell" style={{ scale: thump, boxShadow: schedGlow }}>
        <div className="landing-mailbox-head">
          <span className="landing-mailbox-mark">{box.company.charAt(0)}</span>
          <div className="min-w-0">
            <p className="landing-mailbox-role">{box.role}</p>
            <p className="landing-mailbox-co">{box.company}</p>
          </div>
          <span className="landing-mailbox-fit" style={{ color: shade }}>
            {box.fit}
            <i>%</i>
          </span>
        </div>

        {/* the slot the letter drops through */}
        <div className="landing-mailbox-slot">
          <motion.span className="landing-mailbox-flap" style={{ rotateX: flap }} />
          <span className="landing-mailbox-mouth" />
        </div>

        <div className="landing-mailbox-foot">
          <motion.span
            className="landing-mailbox-stamp"
            style={{ opacity: stampOpacity, scale: stampScale, rotate: stampRot }}
          >
            <motion.span style={{ opacity: receivedOpacity }}>Received</motion.span>
            <motion.span className="landing-mailbox-sched" style={{ opacity: schedOpacity }}>
              <Check aria-hidden="true" /> Interview scheduled
            </motion.span>
          </motion.span>
        </div>
      </motion.div>
    </motion.article>
  );
}

/**
 * One copy of the application, in flight. Three of these leave the same
 * origin — the resume's rest position — which is what makes it read as the
 * same document being sent, not three new objects.
 */
function ApplicationCopy({
  pos,
  box,
  index,
  candidate,
}: {
  pos: MotionValue<number>;
  box: Mailbox;
  index: number;
  candidate: Candidate;
}) {
  const launchAt = 9.35 + index * 0.07;
  const from: [number, number] = [-0.02, 0.02];
  const fan: [number, number] = [-0.02 + (index - 1) * 0.07, -0.04];
  const to: [number, number] = [box.x, box.y - 0.012];

  const transform = useTransform(pos, (p) => {
    // fan out of the stack first
    const spread = ramp(p, 9.2, 0.2);
    let x = from[0] + (fan[0] - from[0]) * cubicOut(spread, 0, 1, 1);
    let y = from[1] + (fan[1] - from[1]) * cubicOut(spread, 0, 1, 1);
    let r = (index - 1) * 5 * spread;
    let s = 0.34;

    const fly = ramp(p, launchAt, 0.62);
    if (fly > 0) {
      const t = cubicInOut(fly, 0, 1, 1);
      const [bx, by] = bezier(t, fan[0], fan[1], (fan[0] + to[0]) / 2, fan[1] - 0.26, to[0], to[1]);
      x = bx;
      y = by;
      r = (index - 1) * 5 + Math.sin(t * Math.PI) * (index - 1) * 14;
      // shrinks as it posts through the slot
      s = 0.34 - t * 0.2;
    }

    const [sx, sy] = squash(ramp(p, launchAt, 0.16), 0.2);
    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${s * sx}, ${s * sy})`;
  });

  const opacity = useTransform(pos, (p) => {
    const appear = ramp(p, 9.18, 0.18);
    // swallowed by the slot
    const swallow = ramp(p, launchAt + 0.5, 0.16);
    return appear * (1 - swallow);
  });

  // paper flutter in flight
  const flutter = useTransform(pos, (p) => {
    const t = ramp(p, launchAt, 0.62);
    return t > 0 && t < 1 ? `${Math.sin(t * Math.PI * 7) * 4}deg` : "0deg";
  });

  return (
    <motion.div className="landing-appcopy" style={{ transform, opacity }}>
      <motion.div className="landing-appcopy-sheet" style={{ rotateY: flutter }}>
        <span className="landing-appcopy-name">{candidate.name}</span>
        <span className="landing-appcopy-line" />
        <span className="landing-appcopy-line is-short" />
        <span className="landing-appcopy-badge">{candidate.scoreBefore}</span>
      </motion.div>
    </motion.div>
  );
}
