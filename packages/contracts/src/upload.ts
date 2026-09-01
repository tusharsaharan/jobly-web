import { z } from "zod";
import { ParseWarningSchema } from "./resume.js";

export const ResumeUploadStateSchema = z.enum([
  "received",
  "scanning",
  "text_extracting",
  "profile_extracting",
  "validating",
  "health_analyzing",
  "rescoring_applications",
  "completed",
  "completed_with_warnings",
  "failed",
]);

export const ResumeUploadStatusSchema = z.object({
  uploadId: z.string().min(1),
  state: ResumeUploadStateSchema,
  progress: z.number().min(0).max(100),
  messageCode: z.string().min(1),
  updatedAt: z.string().datetime(),
  warnings: z.array(ParseWarningSchema).default([]),
  analysisId: z.string().nullable().optional(),
  healthScore: z.number().min(0).max(100).nullable().optional(),
  errorMessage: z.string().nullable().optional(),
}).strict();

export type ResumeUploadState = z.infer<typeof ResumeUploadStateSchema>;
export type ResumeUploadStatus = z.infer<typeof ResumeUploadStatusSchema>;
