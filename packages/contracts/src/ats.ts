import { z } from "zod";
import { EvidenceRefSchema } from "./resume.js";

export const ATS_ANALYSIS_VERSION = "ats-analysis/2026-08-v1" as const;

export const AtsCategoryNameSchema = z.enum([
  "required_skills",
  "preferred_skills",
  "relevant_experience",
  "responsibilities",
  "impact_and_outcomes",
  "education_and_certifications",
  "ats_readability",
]);

export const AtsCategoryResultSchema = z.object({
  name: AtsCategoryNameSchema,
  label: z.string().min(1),
  score: z.number().min(0),
  maxPoints: z.number().min(1),
  percentage: z.number().min(0).max(100),
  weight: z.number().min(0).max(100),
  explanation: z.string().min(1),
  matchedCount: z.number().int().nonnegative().default(0),
  totalCount: z.number().int().nonnegative().default(0),
  evidenceIds: z.array(z.string()).default([]),
  redistributed: z.boolean().default(false),
}).strict();

export const RequirementEvidenceSchema = z.object({
  id: z.string().min(1),
  requirementKey: z.string().min(1),
  category: AtsCategoryNameSchema,
  label: z.string().min(1),
  isMustHave: z.boolean().default(false),
  weight: z.number().min(0.1).max(5).default(1),
  matchedSource: z.enum(["skills", "experience", "projects", "education", "certifications", "achievements"]),
  matchedText: z.string().min(1),
  evidenceRef: EvidenceRefSchema,
}).strict();

export const RequirementGapSchema = z.object({
  id: z.string().min(1),
  requirementKey: z.string().min(1),
  category: AtsCategoryNameSchema,
  label: z.string().min(1),
  isMustHave: z.boolean().default(false),
  importance: z.enum(["critical", "recommended", "optional"]),
  explanation: z.string().min(1),
  suggestedAction: z.string().min(1),
}).strict();

export const AtsSuggestionSchema = z.object({
  id: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  category: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  action: z.string().min(1).max(500),
  evidence: z.array(EvidenceRefSchema).default([]),
  safeToApply: z.boolean().default(true),
  dedupeKey: z.string().min(1),
}).strict();

export const EligibilityStatusSchema = z.enum(["met", "not_met", "unverified", "not_applicable"]);

export const HardRequirementCheckSchema = z.object({
  name: z.string().min(1),
  status: EligibilityStatusSchema,
  explanation: z.string().min(1),
  sourceRequirement: z.string().optional(),
}).strict();

export const EligibilityResultSchema = z.object({
  overallStatus: EligibilityStatusSchema,
  checks: z.array(HardRequirementCheckSchema).default([]),
}).strict();

export const AnalysisExclusionSchema = z.object({
  field: z.string().min(1),
  reason: z.string().min(1),
}).strict();

export const AtsAnalysisSchema = z.object({
  schemaVersion: z.literal(ATS_ANALYSIS_VERSION).default(ATS_ANALYSIS_VERSION),
  id: z.string().min(1),
  applicationId: z.string().nullable().optional(),
  resumeUploadId: z.string().min(1),
  resumeHash: z.string().regex(/^[a-f0-9]{64}$/i),
  jobId: z.string().nullable().optional(),
  jobRevision: z.number().int().nonnegative().nullable().optional(),
  calculatedAt: z.string().datetime(),
  status: z.enum(["completed", "partial", "failed"]),
  overallScore: z.number().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(1),
  categories: z.array(AtsCategoryResultSchema).default([]),
  matchedRequirements: z.array(RequirementEvidenceSchema).default([]),
  gaps: z.array(RequirementGapSchema).default([]),
  suggestions: z.array(AtsSuggestionSchema).default([]),
  eligibility: EligibilityResultSchema.optional(),
  exclusions: z.array(AnalysisExclusionSchema).default([]),
  engine: z.object({
    version: z.string().min(1),
    rulesetHash: z.string().min(1),
    taxonomyVersion: z.string().min(1),
  }).strict(),
}).strict();

export type AtsCategoryName = z.infer<typeof AtsCategoryNameSchema>;
export type AtsCategoryResult = z.infer<typeof AtsCategoryResultSchema>;
export type RequirementEvidence = z.infer<typeof RequirementEvidenceSchema>;
export type RequirementGap = z.infer<typeof RequirementGapSchema>;
export type AtsSuggestion = z.infer<typeof AtsSuggestionSchema>;
export type EligibilityStatus = z.infer<typeof EligibilityStatusSchema>;
export type HardRequirementCheck = z.infer<typeof HardRequirementCheckSchema>;
export type EligibilityResult = z.infer<typeof EligibilityResultSchema>;
export type AnalysisExclusion = z.infer<typeof AnalysisExclusionSchema>;
export type AtsAnalysis = z.infer<typeof AtsAnalysisSchema>;
