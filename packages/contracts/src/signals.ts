import { z } from "zod";

export const SIGNAL_ENGINE_VERSION = "signals-engine/2026-08-v1" as const;

export const SignalCategorySchema = z.enum([
  "coding",
  "communication",
  "whiteboard",
  "attention",
  "execution",
]);

export const SignalIndicatorSchema = z.enum([
  "positive",
  "neutral",
  "concern",
]);

export const EvidenceTypeSchema = z.enum([
  "TRANSCRIPT",
  "CODE_CHECKPOINT",
  "EXECUTION_RESULT",
  "WHITEBOARD_SNAPSHOT",
  "TIMELINE_EVENT",
]);

export const EvidenceLocatorSchema = z.object({
  file: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  quote: z.string().max(500).optional(),
  speaker: z.string().optional(),
  snapshotVersion: z.number().int().optional(),
  testCaseIndex: z.number().int().optional(),
  eventType: z.string().optional(),
}).strict();

export const EvidenceReferenceSchema = z.object({
  id: z.string().min(1),
  type: EvidenceTypeSchema,
  timelineEventId: z.string().min(1),
  offsetMs: z.number().int().nonnegative(),
  locator: EvidenceLocatorSchema,
  summary: z.string().min(1).max(300),
  verificationHash: z.string().min(8),
}).strict();

export const CompetencyPillarSchema = z.enum([
  "problem_solving",
  "coding_algorithms",
  "system_design",
  "communication",
]);

export const RubricLevelSchema = z.enum([
  "unsatisfactory",
  "needs_growth",
  "competent",
  "strong",
  "exceptional",
]);

// Strict plan spec: pillar, score 1-5, confidence 0-1, rationale 1-1000, evidenceReferences min(1)
// Extended fields label/rubricLevel kept optional for backwards compat but strict schema allows them
export const CompetencyRatingSchema = z.object({
  pillar: CompetencyPillarSchema,
  score: z.number().min(1).max(5),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1).max(1000),
  evidenceReferences: z.array(EvidenceReferenceSchema).min(1),
  signalsObserved: z.array(z.string()).default([]),
  label: z.string().min(1).optional(),
  rubricLevel: RubricLevelSchema.optional(),
}).strict();

export const HiringDecisionSchema = z.enum([
  "STRONG_HIRE",
  "HIRE",
  "LEAN_HIRE",
  "LEAN_REJECT",
  "REJECT",
]);

export const InterviewSignalSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  category: SignalCategorySchema,
  name: z.string().min(1),
  indicator: SignalIndicatorSchema,
  weight: z.number().min(0.1).max(5.0).default(1.0),
  offsetMs: z.number().int().nonnegative(),
  payload: z.record(z.any()).default({}),
  evidenceRef: EvidenceReferenceSchema.optional(),
  createdAt: z.string().datetime(),
  engineVersion: z.string().min(1).default(SIGNAL_ENGINE_VERSION).optional(),
}).strict();

export const SignalExclusionSchema = z.object({
  field: z.string().min(1),
  reason: z.string().min(1),
}).strict();

export const ScorecardEvaluationSchema = z.object({
  schemaVersion: z.literal(SIGNAL_ENGINE_VERSION).default(SIGNAL_ENGINE_VERSION),
  id: z.string().min(1),
  sessionId: z.string().min(1),
  candidateId: z.string().min(1),
  interviewerId: z.string().optional(),
  recommendedDecision: HiringDecisionSchema,
  overallScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(1),
  competencies: z.array(CompetencyRatingSchema).min(1),
  strengths: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
  evidenceReferences: z.array(EvidenceReferenceSchema).default([]),
  exclusions: z.array(SignalExclusionSchema).default([
    { field: "protected_characteristics", reason: "Jobly strictly excludes race, gender, accent, age, religion, and protected data from evaluation." },
    { field: "background_environment", reason: "Jobly does not evaluate candidates based on background audio or camera environment." },
  ]),
  calculatedAt: z.string().datetime(),
  engineVersion: z.string().min(1).default(SIGNAL_ENGINE_VERSION),
}).strict();

export type SignalCategory = z.infer<typeof SignalCategorySchema>;
export type SignalIndicator = z.infer<typeof SignalIndicatorSchema>;
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type EvidenceLocator = z.infer<typeof EvidenceLocatorSchema>;
export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;
export type CompetencyPillar = z.infer<typeof CompetencyPillarSchema>;
export type RubricLevel = z.infer<typeof RubricLevelSchema>;
export type CompetencyRating = z.infer<typeof CompetencyRatingSchema>;
export type HiringDecision = z.infer<typeof HiringDecisionSchema>;
export type InterviewSignal = z.infer<typeof InterviewSignalSchema>;
export type SignalExclusion = z.infer<typeof SignalExclusionSchema>;
export type ScorecardEvaluation = z.infer<typeof ScorecardEvaluationSchema>;
