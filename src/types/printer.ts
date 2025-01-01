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

interface BambulabFTPConnectionDetails {
  type: "BambuLab FTP";
  ipAddress: string;
  accessCode: string;
}

export interface PrinterDefinition {
  name: string;
  availableNozzleSizes: number[];
  defaultBuildPlate: string;
}

export interface PrinterWithConnectionDefinition extends PrinterDefinition {
  connection: BambulabFTPConnectionDetails;
}

export interface PrinterModelDefinition {
  manufacturer: string;
  model: string;
  imagePath: string;
  printers: PrinterWithConnectionDefinition[];
  availableBuildPlates: string[];
}

export type PrinterWithModelDefinition = Omit<
  PrinterModelDefinition,
  "printers"
> &
  PrinterDefinition;

export type PrinterWithConnectionAndModelDefinition = Omit<
  PrinterModelDefinition,
  "printers"
> &
  PrinterWithConnectionDefinition;

export interface ConfigurationFile {
  name: string;
  path: string;
  content: any;
}

export interface PrinterConfigurations {
  filament: ConfigurationFile[];
  machine: ConfigurationFile[];
  process: ConfigurationFile[];
}
