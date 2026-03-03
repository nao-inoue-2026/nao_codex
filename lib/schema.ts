import { z } from "zod";

export const signalSchema = z.object({
  type: z.enum(["news", "hiring", "product", "funding", "other"]),
  summary: z.string().min(1),
  evidence: z.string().min(1)
});

export const hypothesisSchema = z.object({
  pain: z.string().min(1),
  why_now: z.string().min(1),
  confidence: z.number().int().min(0).max(100)
});

export const approachItemSchema = z.object({
  priority: z.enum(["A", "B", "C"]),
  target_role: z.string().min(1),
  message_angle: z.string().min(1),
  opening_line: z.string().min(1),
  questions: z.array(z.string().min(1)).min(3),
  next_action: z.string().min(1)
});

export const outputSchema = z.object({
  company_overview: z.string().min(1),
  signals: z.array(signalSchema).min(1),
  hypotheses: z.array(hypothesisSchema).min(1),
  approach_list: z.array(approachItemSchema).min(1),
  followup_email: z.object({
    subject: z.string().min(1),
    body: z.string().min(1)
  }),
  risks: z.array(z.string().min(1)).min(1)
});

export const inputSchema = z.object({
  company_name: z.string().min(1, "company_nameは必須です"),
  company_url: z.string().optional(),
  raw_web_info: z.string().min(1, "raw_web_infoは必須です"),
  our_product: z.string().min(1, "our_productは必須です"),
  target_persona: z.string().optional(),
  stage: z.string().optional()
});

export const historyRecordSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  input: inputSchema,
  output: outputSchema
});

export const historyListSchema = z.array(historyRecordSchema);

export type InputPayload = z.infer<typeof inputSchema>;
export type OutputPayload = z.infer<typeof outputSchema>;
export type HistoryRecord = z.infer<typeof historyRecordSchema>;
