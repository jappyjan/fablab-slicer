"use server";

import {
  ConfigurationFile,
  PrinterConfigurations,
  PrinterModelDefinition,
  PrinterWithModelDefinition,
} from "@/types/printer";
import {
  BackendErrorResponse,
  BackendResponse,
  BackendSuccessResponse,
  ErrorType,
  sendError,
  sendSuccess,
} from "@/utils/backend";
import { Console } from "@/utils/console";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

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
    Console.error(`Printer config not found at "${printerConfigPath}"`);
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
    models.map((model) => {
      if (model.startsWith(".")) {
        return null;
      }
      return getPrinterDefinition_serverOnly(manufacturer, model);
    })
  );

  return printerConfigs.filter((config) => config !== null);
}

export async function getAllPrinterDefinitions_serverOnly(): Promise<
  PrinterWithModelDefinition[]
> {
  const manufacturersDirectories = await readdir(
    join(process.cwd(), "slicer-configs")
  );
  const manufacturers = manufacturersDirectories.filter(
    (dir) => !dir.startsWith(".")
  );

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
        availableMaterials: printer.availableMaterials,
        availableBuildPlates: model.availableBuildPlates,
        defaultBuildPlate: printer.defaultBuildPlate,
        connection: printer.connection,
        popups: printer.popups,
      }));
    })
    .flat();
}

export async function getAllPrinterDefinitions(): Promise<
  BackendResponse<PrinterWithModelDefinition[]>
> {
  const definitions = await getAllPrinterDefinitions_serverOnly();
  return sendSuccess(
    definitions.map((definition) => ({
      ...definition,
      connection: undefined,
    }))
  );
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

  if (configurationType === "machine") {
    const configFileName = join(
      configurationsDirectory,
      `${nozzleSize} nozzle.json`
    );
    const content = await readFile(configFileName, "utf-8");
    const parsedContent = JSON.parse(content);
    return [
      {
        path: configFileName.substring(rootConfigDirectory.length),
        name: parsedContent.name,
        content: parsedContent,
      },
    ];
  }

  const configFileNamesAll = await readdir(configurationsDirectory);
  const configFileNames = configFileNamesAll.filter(
    (fileName) => !fileName.startsWith(".")
  );

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

  return parsedConfigFiles.map((config) => ({
    path: config.path.substring(rootConfigDirectory.length),
    name: config.content.name,
    content: config.content,
  }));
}

export async function getPrinterConfigurations(
  manufacturer: string,
  model: string,
  nozzleSize: number
): Promise<BackendResponse<PrinterConfigurations>> {
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

  return sendSuccess({
    filament: filamentConfigFiles,
    machine: machineConfigFiles,
    process: processConfigFiles,
  });
}
