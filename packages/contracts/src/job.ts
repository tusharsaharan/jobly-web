import { z } from "zod";

export const JOB_ATS_PROFILE_VERSION = "job-ats-profile/1" as const;

export const RequiredSkillSchema = z.object({
  canonicalId: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
  required: z.boolean().default(false),
  weight: z.number().int().min(1).max(5).default(3),
  synonyms: z.array(z.string().max(100)).default([]),
}).strict();

export const RequiredCredentialSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().max(200).optional(),
  required: z.boolean().default(false),
}).strict();

export const KeywordRequirementSchema = z.object({
  phrase: z.string().min(1).max(200),
  weight: z.number().min(0.1).max(5).default(1),
  source: z.enum(["recruiter", "approved-extractor"]),
}).strict();

export const JobAtsProfileSchema = z.object({
  schemaVersion: z.literal(JOB_ATS_PROFILE_VERSION).default(JOB_ATS_PROFILE_VERSION),
  targetTitles: z.array(z.string().min(1).max(200)).min(1),
  mustHaveSkills: z.array(RequiredSkillSchema).default([]),
  preferredSkills: z.array(RequiredSkillSchema).default([]),
  responsibilityPhrases: z.array(z.string().min(1).max(300)).default([]),
  minimumExperienceYears: z.number().nonnegative().max(50).nullable().optional(),
  requiredEducation: z.object({
    degrees: z.array(z.string().max(100)).default([]),
    fieldsOfStudy: z.array(z.string().max(100)).default([]),
    required: z.boolean().default(false),
  }).strict().default({ degrees: [], fieldsOfStudy: [], required: false }),
  certifications: z.array(RequiredCredentialSchema).default([]),
  keywords: z.array(KeywordRequirementSchema).default([]),
}).strict();

export type RequiredSkill = z.infer<typeof RequiredSkillSchema>;
export type RequiredCredential = z.infer<typeof RequiredCredentialSchema>;
export type KeywordRequirement = z.infer<typeof KeywordRequirementSchema>;
export type JobAtsProfile = z.infer<typeof JobAtsProfileSchema>;
