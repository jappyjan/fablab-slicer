import { z } from "zod";

// Zod schemas
export const PrintSettingsSchema = z.object({
  printerManufacturer: z.string(),
  printerModel: z.string(),
  printerName: z.string(),
  nozzleSize: z.number(),
  processConfigFile: z.string(),
  filamentConfigFile: z.string(),
  needsSupports: z.boolean(),
  buildPlateType: z.string().optional(),
});

// TypeScript types from Zod schemas
export type PrintSettings = z.infer<typeof PrintSettingsSchema>;
