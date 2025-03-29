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
  autoOrient: z.boolean().default(true),
});

// TypeScript types from Zod schemas
export type PrintSettings = z.infer<typeof PrintSettingsSchema>;

export interface BambulabFTPConnectionDetails {
  type: "BambuLab FTP";
  ipAddress: string;
  accessCode: string;
}

export interface KlipperConnectionDetails {
  type: "Klipper";
  host: string;
  port: number;
  routePrefix: string | null;
  apiKey: string | null;
}

export interface PrinterDefinition {
  name: string;
  availableNozzleSizes: number[];
  availableMaterials: string[];
  defaultBuildPlate: string;
  popups?: {
    onSelect?: {
      title: { english: string; german: string };
      description: { english: string; german: string };
    };
  };
}

export function isPrinterWithBambuLabFTPConnectionDetails(
  printer: PrinterWithConnectionDefinition
): printer is PrinterWithConnectionDefinition<BambulabFTPConnectionDetails> {
  return printer.connection.type === "BambuLab FTP";
}

export function isPrinterWithKlipperConnectionDetails(
  printer: PrinterWithConnectionDefinition
): printer is PrinterWithConnectionDefinition<KlipperConnectionDetails> {
  return printer.connection.type === "Klipper";
}

type AnyConnectionType =
  | BambulabFTPConnectionDetails
  | KlipperConnectionDetails;
export interface PrinterWithConnectionDefinition<
  TConnectionType extends AnyConnectionType = AnyConnectionType
> extends PrinterDefinition {
  connection: TConnectionType;
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
