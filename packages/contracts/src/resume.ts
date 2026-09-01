import { z } from "zod";

export const RESUME_SCHEMA_VERSION = "resume-profile/1" as const;

export const EvidenceRefSchema = z.object({
  section: z.enum([
    "contact",
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "custom",
  ]),
  pageNumber: z.number().int().positive().nullable().optional(),
  charStart: z.number().int().nonnegative().nullable().optional(),
  charEnd: z.number().int().nonnegative().nullable().optional(),
  quote: z.string().max(240, "Evidence quote must be 240 characters or fewer"),
}).strict();

export const ParseWarningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  field: z.string().optional(),
}).strict();

export const ExperienceEntrySchema = z.object({
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  startDate: z.string().nullable().optional(), // YYYY-MM or null
  endDate: z.string().nullable().optional(),   // YYYY-MM or null
  isCurrent: z.boolean().default(false),
  location: z.string().nullable().optional(),
  bullets: z.array(z.string().max(1000)).max(40).default([]),
  skills: z.array(z.string().max(100)).max(50).default([]),
  evidence: z.array(EvidenceRefSchema).default([]),
}).strict();

export const ProjectEntrySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  bullets: z.array(z.string().max(1000)).max(40).default([]),
  links: z.array(z.string().url().max(500)).max(10).default([]),
  skills: z.array(z.string().max(100)).max(50).default([]),
  evidence: z.array(EvidenceRefSchema).default([]),
}).strict();

export const EducationEntrySchema = z.object({
  qualification: z.string().min(1).max(200),
  fieldOfStudy: z.string().max(200).nullable().optional(),
  institution: z.string().min(1).max(200),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  gpa: z.number().nullable().optional(),
  gpaScale: z.union([z.literal(4), z.literal(10), z.literal(100)]).nullable().optional(),
  evidence: z.array(EvidenceRefSchema).default([]),
}).strict();

export const CertificationEntrySchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  issueDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  credentialId: z.string().max(100).nullable().optional(),
  url: z.string().url().max(500).nullable().optional(),
  evidence: z.array(EvidenceRefSchema).default([]),
}).strict();

export const AchievementEntrySchema = z.object({
  text: z.string().min(1).max(1000),
  quantifiedOutcome: z.string().max(500).nullable().optional(),
  evidence: z.array(EvidenceRefSchema).default([]),
}).strict();

export const ResumeSkillSchema = z.object({
  canonicalId: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
  aliasesObserved: z.array(z.string().max(100)).default([]),
  evidence: z.array(EvidenceRefSchema).default([]),
}).strict();

export const ResumeProfileSchema = z.object({
  schemaVersion: z.literal(RESUME_SCHEMA_VERSION).default(RESUME_SCHEMA_VERSION),
  source: z.object({
    uploadId: z.string().min(1),
    fileName: z.string().min(1).max(255),
    mimeType: z.literal("application/pdf"),
    sha256: z.string().regex(/^[a-f0-9]{64}$/i, "Must be a valid 64-character SHA-256 hex string"),
    extractedAt: z.string().datetime({ message: "Must be ISO 8601 UTC timestamp" }),
    extractor: z.enum(["gemini", "fallback", "manual"]),
    extractionConfidence: z.number().min(0).max(1),
  }).strict(),
  contact: z.object({
    email: z.string().email().nullable().optional(),
    phone: z.string().max(50).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    links: z.array(z.object({
      kind: z.enum(["linkedin", "github", "portfolio", "other"]),
      url: z.string().url().max(500),
    }).strict()).max(10).default([]),
  }).strict(),
  headline: z.string().max(300).nullable().optional(),
  summary: z.string().max(4000).nullable().optional(),
  skills: z.array(ResumeSkillSchema).max(100).default([]),
  experience: z.array(ExperienceEntrySchema).max(40).default([]),
  projects: z.array(ProjectEntrySchema).max(40).default([]),
  education: z.array(EducationEntrySchema).max(20).default([]),
  certifications: z.array(CertificationEntrySchema).max(30).default([]),
  achievements: z.array(AchievementEntrySchema).max(50).default([]),
  sectionsDetected: z.array(z.enum([
    "contact",
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "custom",
  ])).default([]),
  parseWarnings: z.array(ParseWarningSchema).default([]),
}).strict();

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
export type ParseWarning = z.infer<typeof ParseWarningSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type CertificationEntry = z.infer<typeof CertificationEntrySchema>;
export type AchievementEntry = z.infer<typeof AchievementEntrySchema>;
export type ResumeSkill = z.infer<typeof ResumeSkillSchema>;
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
