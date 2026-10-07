import { ATS_CATEGORIES, EVIDENCE, MAILBOXES, PILLARS } from "../sceneManifest";

/**
 * Shared stage geometry.
 *
 * `EvidenceLayer` flies the tokens; `SkillRail`, `ScoreBreakdown`,
 * `MailboxFlight` and `FeedbackAssembly` draw the frames they land in. Both
 * sides read their slot positions from here, so a token always lands exactly
 * in its slot instead of near it.
 *
 * All coordinates are viewport fractions measured from the centre of the
 * stage: x in vw, y in vh, so (0, 0) is dead centre and (-0.5, 0) is the
 * left edge. This matches the `translate3d(calc(-50% + Nvw), ...)` pattern
 * used by every other scene.
 */

/* ── beat 6: the parse page lines, inside the laptop screen ── */
export const PAGE = {
  x: -0.17,
  firstY: -0.2,
  lineGap: 0.078,
} as const;

export const pageSlot = (index: number): [number, number] => [
  PAGE.x,
  PAGE.firstY + index * PAGE.lineGap,
];

/* ── beat 7: the skill rail, right-hand side of the screen ── */
export const RAIL = {
  x: 0.26,
  firstY: -0.2,
  gap: 0.066,
} as const;

export const railSlot = (index: number): [number, number] => [
  RAIL.x,
  RAIL.firstY + index * RAIL.gap,
];

/* ── beat 8: the seven weighted category rows ── */
export const ROWS = {
  x: 0.21,
  firstY: -0.21,
  gap: 0.07,
} as const;

export const rowIndexOf = (atsCat: string): number =>
  Math.max(0, ATS_CATEGORIES.findIndex((c) => c.id === atsCat));

export const rowSlot = (atsCat: string): [number, number] => {
  const i = rowIndexOf(atsCat);
  return [ROWS.x, ROWS.firstY + i * ROWS.gap];
};

/* ── beat 9: the three mailboxes ── */
export const mailboxIndexOf = (id: string): number =>
  Math.max(0, MAILBOXES.findIndex((m) => m.id === id));

export const mailboxSlot = (id: string): [number, number] => {
  const m = MAILBOXES[mailboxIndexOf(id)];
  return [m.x, m.y - 0.02];
};

/* ── beat 12: the scorecard's two comment columns ── */
export const VERDICT_COLS = {
  strengthX: -0.14,
  gapX: 0.28,
  firstY: 0.02,
  gap: 0.045,
} as const;

export const pillarIndexOf = (id: string): number =>
  Math.max(0, PILLARS.findIndex((pl) => pl.id === id));

/**
 * Comment slots are assigned per column (strengths left, improvements right)
 * in the order the atoms appear, so two comments never stack on one line.
 */
export function commentSlot(evidenceId: string): [number, number] {
  const atom = EVIDENCE.find((e) => e.id === evidenceId);
  if (!atom) return [0, 0];
  const column = atom.weak ? 1 : 0;
  const peers = EVIDENCE.filter((e) => e.weak === atom.weak && (atom.weak || e.moment >= 0));
  const slot = Math.max(0, peers.findIndex((e) => e.id === evidenceId));
  return [
    VERDICT_COLS.strengthX + column * VERDICT_COLS.gapX,
    VERDICT_COLS.firstY + slot * VERDICT_COLS.gap,
  ];
}

/* ── beats 13-14: the study cards ── */
export const STUDY = {
  firstX: -0.3,
  gapX: 0.3,
  y: 0.16,
} as const;

export const studySlot = (index: number): [number, number] => [
  STUDY.firstX + index * STUDY.gapX,
  STUDY.y,
];

/* ── beats 15-16: the folder mouth, where everything files away ── */
export const FOLDER = {
  mouthX: 0,
  mouthY: 0.1,
} as const;

export const folderSlot = (): [number, number] => [FOLDER.mouthX, FOLDER.mouthY];
