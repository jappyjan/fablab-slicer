"use server";

import { Console } from "@/utils/console";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

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

export async function getPrinterDefinition_serverOnly(
  manufacturer: string,
  model: string
): Promise<PrinterModelDefinition> {
  const printerConfigPath = join(
    process.cwd(),
    "slicer-configs",
    manufacturer,
    model,
    "printers.json"
  );

  if (!existsSync(printerConfigPath)) {
    Console.error("Printer config not found", printerConfigPath);
    throw new Error("Printer config not found");
  }

  const printerConfig = await readFile(printerConfigPath, "utf-8");

  const config = JSON.parse(printerConfig) as Omit<
    PrinterModelDefinition,
    "imagePath"
  >;

  return {
    ...config,
    manufacturer,
    model,
    imagePath: `/printer-thumbnail?manufacturer=${manufacturer}&model=${model}`,
  };
}

async function getPrinterDefinitionsOfManufacturer(
  manufacturer: string
): Promise<PrinterModelDefinition[]> {
  const models = await readdir(
    join(process.cwd(), "slicer-configs", manufacturer)
  );
  const printerConfigs = await Promise.all(
    models.map((model) => getPrinterDefinition_serverOnly(manufacturer, model))
  );

  return printerConfigs;
}

export async function getAllPrinterDefinitions_serverOnly(): Promise<
  PrinterWithModelDefinition[]
> {
  const manufacturers = await readdir(join(process.cwd(), "slicer-configs"));

  const definitions = (
    await Promise.all(manufacturers.map(getPrinterDefinitionsOfManufacturer))
  ).flat();

  return definitions
    .map((model) => {
      return model.printers.map((printer) => ({
        manufacturer: model.manufacturer,
        model: model.model,
        imagePath: model.imagePath,
        name: printer.name,
        availableNozzleSizes: printer.availableNozzleSizes,
        availableBuildPlates: model.availableBuildPlates,
        defaultBuildPlate: printer.defaultBuildPlate,
        connection: printer.connection,
      }));
    })
    .flat();
}

export async function getAllPrinterDefinitions(): Promise<
  PrinterWithModelDefinition[]
> {
  const definitions = await getAllPrinterDefinitions_serverOnly();
  return definitions.map((definition) => ({
    ...definition,
    connection: undefined,
  }));
}

interface ConfigurationFile {
  name: string;
  path: string;
  content: any;
}

export interface PrinterConfigurations {
  filament: ConfigurationFile[];
  machine: ConfigurationFile[];
  process: ConfigurationFile[];
}

async function getFilamentConfigurationsForNozzleSizeAndPrinter(
  configurationType: "filament" | "machine" | "process",
  manufacturer: string,
  model: string,
  nozzleSize: number
): Promise<ConfigurationFile[]> {
  const rootConfigDirectory = join(process.cwd(), "slicer-configs");
  const rootConfigurationFilePath = join(
    rootConfigDirectory,
    manufacturer,
    model,
    configurationType
  );

  const rootConfigurationFilePathWithNozzleSize = join(
    rootConfigurationFilePath,
    nozzleSize.toString()
  );

  let configurationsDirectory: string;
  switch (configurationType) {
    case "process":
      configurationsDirectory = rootConfigurationFilePathWithNozzleSize;
      break;
    case "filament":
      if (existsSync(rootConfigurationFilePathWithNozzleSize)) {
        configurationsDirectory = rootConfigurationFilePathWithNozzleSize;
      } else {
        configurationsDirectory = join(rootConfigurationFilePath, "generic");
      }
      break;
    default:
      configurationsDirectory = rootConfigurationFilePath;
  }

  const fullPrinterName = `${manufacturer} ${model} ${nozzleSize} nozzle`;

  if (configurationType === "machine") {
    const configFileName = join(
      configurationsDirectory,
      `${fullPrinterName}.json`
    );
    const content = await readFile(configFileName, "utf-8");
    const parsedContent = JSON.parse(content);
    return [
      {
        path: configFileName.substring(rootConfigDirectory.length),
        name: parsedContent.friendlyName || parsedContent.name,
        content: parsedContent,
      },
    ];
  }

  const configFileNames = await readdir(configurationsDirectory);

  const rawConfigFiles = await Promise.all(
    configFileNames.map(async (fileName) => {
      const fullConfigurationFilePath = join(configurationsDirectory, fileName);

      const content = await readFile(fullConfigurationFilePath, "utf-8");
      return { path: fullConfigurationFilePath, content };
    })
  );

  const parsedConfigFiles = rawConfigFiles.map((file) => ({
    path: file.path,
    content: JSON.parse(file.content),
  }));

  const matchingConfigFiles = parsedConfigFiles.filter((config) => {
    if (config.content.compatible_printers === undefined) {
      return true;
    }

    return config.content.compatible_printers.includes(fullPrinterName);
  });

  return matchingConfigFiles.map((config) => ({
    path: config.path.substring(rootConfigDirectory.length),
    name: config.content.friendlyName || config.content.name,
    content: config.content,
  }));
}

export async function getPrinterConfigurations(
  manufacturer: string,
  model: string,
  nozzleSize: number
): Promise<PrinterConfigurations> {
  const filamentConfigFiles =
    await getFilamentConfigurationsForNozzleSizeAndPrinter(
      "filament",
      manufacturer,
      model,
      nozzleSize
    );

  const machineConfigFiles =
    await getFilamentConfigurationsForNozzleSizeAndPrinter(
      "machine",
      manufacturer,
      model,
      nozzleSize
    );

  const processConfigFiles =
    await getFilamentConfigurationsForNozzleSizeAndPrinter(
      "process",
      manufacturer,
      model,
      nozzleSize
    );

  return {
    filament: filamentConfigFiles,
    machine: machineConfigFiles,
    process: processConfigFiles,
  };
}
