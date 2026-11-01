import { z } from "zod";

export const overrideBodySchema = z.object({
  rationale: z
    .string()
    .trim()
    .min(1, "A nonempty rationale is required to override an alert."),
  actor: z.string().trim().min(1).optional().default("Demo Clinician"),
});

export const confirmBodySchema = z.object({
  actor: z.string().trim().min(1).optional().default("Demo Clinician"),
});

export const patientIdSchema = z.string().regex(/^P\d{3}$/, "Invalid patient ID");
export const alertIdSchema = z.string().min(1);
export const sourceIdSchema = z.string().min(1);
