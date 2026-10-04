import { motion, useTransform, type MotionValue } from "framer-motion";
import { Mic, PenLine, Terminal, Video } from "lucide-react";
import { cubicOut, limit } from "../beagleEase";
import { ramp, settle, useVisible } from "./choreography";
import {
  MOMENT_EVIDENCE,
  ROOM_CODE,
  ROOM_FEATURES,
  ROOM_MESSAGES,
} from "../sceneManifest";

/**
 * Beat 11: the live room.
 *
 * Same panes as the real product — editor, whiteboard, video, terminal —
 * but now the room DOES something the next beat can consume. Four lines of
 * code are flagged as moments while the candidate works through them, and
 * those flags are the exact comments that fly out in beat 12. The feedback
 * is literally assembled from what you watched happen.
 *
 * Additions over the previous build:
 *   · a real caret that types, line by line, with a blink
 *   · whiteboard edges that draw themselves after their nodes land
 *   · a live mic waveform on the video tile
 *   · a terminal strip that runs the tests and goes green
 *   · moment flags that latch onto specific code lines
 *
 * TIMING  10.75 enters · 11.0-11.75 plays · 11.9-12.4 exits (overlaps beat 12)
 */

interface InterviewRoomProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}

export function InterviewRoom({ pos, anchor, visibleLength }: InterviewRoomProps) {
  const visibility = useVisible(pos, anchor, visibleLength);
  const t = useTransform(pos, (p) => ramp(p, 10.75, 0.5));
  const out = useTransform(pos, (p) => ramp(p, 11.9, 0.5));

  const y = useTransform([t, out] as const, ([v, o]: number[]) => {
    const rise = cubicOut(v, 0.42, -0.42, 1);
    return `${(rise + o * 0.62) * 100}vh`;
  });
  const opacity = useTransform(
    [t, out] as const,
    ([v, o]: number[]) => limit(v / 0.4, 0, 1) * (1 - o),
  );
  const scale = useTransform([t, out] as const, ([v, o]: number[]) =>
    cubicOut(v, 0.93, 0.07, 1) * (1 - o * 0.06),
  );

  // typing runs across the hold window so it is readable
  const typed = useTransform(pos, (p) => ramp(p, 10.92, 0.62));

  return (
    <motion.div
      className="landing-room"
      style={{ y, opacity, scale, visibility, zIndex: 30, willChange: "transform, opacity" }}
    >
      <div className="landing-room-bar">
        <span className="landing-room-dot" style={{ background: "#ff5f57" }} />
        <span className="landing-room-dot" style={{ background: "#febc2e" }} />
        <span className="landing-room-dot" style={{ background: "#28c840" }} />
        <span className="landing-room-key">Technical Interview · live</span>
        <span className="landing-room-rec">
          <span className="landing-room-rec-dot" /> REC
        </span>
      </div>

      <div className="landing-room-body">
        <div className="landing-room-code">
          {ROOM_CODE.map((line, i) => (
            <CodeLine key={i} pos={pos} line={line} index={i} typed={typed} />
          ))}
          <TerminalStrip pos={pos} />
        </div>

        <div className="landing-room-rail">
          <div className="landing-room-video">
            <div className="landing-room-avatar">AP</div>
            <MicWave pos={pos} />
            <span className="landing-room-vlabel">
              <Mic className="h-3 w-3" aria-hidden="true" /> Ari
            </span>
          </div>
          <div className="landing-room-board">
            <Whiteboard pos={pos} />
            <span className="landing-room-vlabel">
              <PenLine className="h-3 w-3" aria-hidden="true" /> Whiteboard
            </span>
          </div>
        </div>
      </div>

      <div className="landing-room-ai">
        {ROOM_MESSAGES.map((m, i) => (
          <RoomMessage key={i} pos={pos} index={i} message={m} />
        ))}
      </div>

      <ul className="landing-room-feats">
        {ROOM_FEATURES.map((f, i) => (
          <li key={f}>
            {i === 0 ? <Terminal className="h-3 w-3" aria-hidden="true" /> : null}
            {i === 2 ? <Video className="h-3 w-3" aria-hidden="true" /> : null}
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/** A code line that types itself, and latches a moment flag if it owns one. */
function CodeLine({
  pos,
  line,
  index,
  typed,
}: {
  pos: MotionValue<number>;
  line: string;
  index: number;
  typed: MotionValue<number>;
}) {
  const start = index / ROOM_CODE.length;
  const reveal = useTransform(typed, (t) => limit((t - start * 0.86) / 0.1, 0, 1));
  const shown = useTransform(reveal, (v) => Math.round(v * line.length));
  const text = useTransform(shown, (n) => line.slice(0, n));
  const caretOn = useTransform(reveal, (v) => (v > 0.02 && v < 0.98 ? 1 : 0));

  const moment = MOMENT_EVIDENCE.find((e) => e.moment === index);
  const flagAt = 11.2 + MOMENT_EVIDENCE.findIndex((e) => e.moment === index) * 0.1;
  const flag = useTransform(pos, (p) => (moment ? ramp(p, flagAt, 0.26) : 0));
  const lineBg = useTransform(flag, (v) => `rgba(247, 245, 163, ${v * 0.1})`);
  const lineBorder = useTransform(flag, (v) => `rgba(247, 245, 163, ${v * 0.55})`);

  return (
    <motion.div
      className="landing-code-line"
      style={{ opacity: reveal, backgroundColor: lineBg, borderLeftColor: lineBorder }}
    >
      <span className="landing-code-num">{index + 1}</span>
      <code>
        <motion.span>{text}</motion.span>
        <motion.span className="landing-code-caret" style={{ opacity: caretOn }} />
      </code>
      {moment ? (
        <motion.span
          className="landing-code-flag"
          style={{ opacity: flag, scale: useTransform(flag, (v) => settle(v, 0.16, 1)) }}
        >
          moment
        </motion.span>
      ) : null}
    </motion.div>
  );
}

/** Tests run and pass — a small beat of competence before the verdict. */
function TerminalStrip({ pos }: { pos: MotionValue<number> }) {
  const run = useTransform(pos, (p) => ramp(p, 11.46, 0.3));
  const opacity = useTransform(pos, (p) => ramp(p, 11.4, 0.22));
  const label = useTransform(run, (v): string =>
    v < 0.45 ? "› running tests…" : "✓ 12 passed · 0 failed",
  );
  const color = useTransform(run, (v) => (v < 0.45 ? "rgba(255,255,255,0.5)" : "#7fd2b1"));
  const barScale = useTransform(run, (v) => limit(v / 0.45, 0, 1));

  return (
    <motion.div className="landing-room-term" style={{ opacity }}>
      <motion.span className="landing-room-term-text" style={{ color }}>
        {label}
      </motion.span>
      <span className="landing-room-term-track">
        <motion.span style={{ scaleX: barScale }} />
      </span>
    </motion.div>
  );
}

/** Live mic waveform — twelve bars reacting while the candidate talks. */
function MicWave({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 11.05, 0.25) * (1 - ramp(p, 11.85, 0.3)));
  return (
    <motion.div className="landing-room-wave" style={{ opacity }} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <WaveBar key={i} pos={pos} index={i} />
      ))}
    </motion.div>
  );
}

function WaveBar({ pos, index }: { pos: MotionValue<number>; index: number }) {
  const h = useTransform(pos, (p) => {
    const t = ramp(p, 11.05, 0.8);
    const wobble = Math.abs(Math.sin(p * 9 + index * 0.8)) * 0.8 + 0.2;
    return `${t * wobble * 100}%`;
  });
  return <motion.span style={{ height: h }} />;
}

/** Whiteboard: nodes land, then the edges draw between them. */
function Whiteboard({ pos }: { pos: MotionValue<number> }) {
  const nodes = useTransform(pos, (p) => ramp(p, 11.12, 0.3));
  const edges = useTransform(pos, (p) => ramp(p, 11.34, 0.34));

  return (
    <svg viewBox="0 0 120 70" className="h-full w-full" aria-hidden="true">
      {[
        { x: 8, y: 10 },
        { x: 80, y: 10 },
        { x: 44, y: 44 },
      ].map((n, i) => (
        <WhiteboardNode key={i} pos={pos} index={i} x={n.x} y={n.y} nodes={nodes} />
      ))}
      <motion.path d="M38 19 H80" className="landing-board-edge" style={{ pathLength: edges }} />
      <motion.path d="M23 28 V44 H44" className="landing-board-edge" style={{ pathLength: edges }} />
      <motion.path d="M95 28 V44 H76" className="landing-board-edge" style={{ pathLength: edges }} />
    </svg>
  );
}

function WhiteboardNode({
  index,
  x,
  y,
  nodes,
}: {
  pos: MotionValue<number>;
  index: number;
  x: number;
  y: number;
  nodes: MotionValue<number>;
}) {
  const t = useTransform(nodes, (v) => limit((v - index * 0.18) / 0.5, 0, 1));
  const opacity = useTransform(t, (v) => v);
  const scale = useTransform(t, (v) => settle(v, 0.14, 1));
  return (
    <motion.rect
      x={x}
      y={y}
      width="30"
      height="18"
      rx="3"
      className="landing-board-node"
      style={{ opacity, scale, transformOrigin: `${x + 15}px ${y + 9}px` }}
    />
  );
}

function RoomMessage({
  pos,
  index,
  message,
}: {
  pos: MotionValue<number>;
  index: number;
  message: (typeof ROOM_MESSAGES)[number];
}) {
  const start = 11.08 + index * 0.16;
  const t = useTransform(pos, (p) => ramp(p, start, 0.28));
  const opacity = useTransform(
    [t, pos] as const,
    ([v, p]: number[]) => v * (1 - ramp(p, 11.85, 0.35)),
  );
  const y = useTransform(t, (v) => `${(1 - cubicOut(v, 0, 1, 1)) * 14}px`);
  const scale = useTransform(t, (v) => settle(v, 0.06, 1));

  return (
    <motion.div
      className={`landing-room-msg ${message.from === "ai" ? "is-ai" : "is-you"}`}
      style={{ opacity, y, scale }}
    >
      <span className="landing-room-msg-from">{message.from === "ai" ? "AI copilot" : "You"}</span>
      <p>{message.text}</p>
    </motion.div>
  );
}
