"use server";

import {
  BambulabFTPConnectionDetails,
  KlipperConnectionDetails,
  PrinterWithConnectionDefinition,
  PrintSettings,
  PrintSettingsSchema,
  isPrinterWithKlipperConnectionDetails,
  isPrinterWithBambuLabFTPConnectionDetails,
} from "@/types/printer";
import { unlink, writeFile, readFile, mkdir } from "fs/promises";
import { nanoid } from "nanoid";
import { existsSync } from "fs";
import { join } from "path";
import { Client as FTPClient } from "basic-ftp";
import { getPrinterDefinition_serverOnly } from "./printerConfigService";
import { execSync } from "child_process";
import { LOG_LEVEL, SLICER_EXECUTABLE_PATH } from "@/utils/config";
import { Console } from "@/utils/console";
import { BackendResponse, sendError, sendSuccess } from "@/utils/backend";
import { mergeDeep } from "@/utils/object";

let _tempDirExistanceChecked = false;
async function getTempFileName(
  filename: string,
  options: { includeTimestamp: boolean; includeTmpDir: boolean } = {
    includeTimestamp: true,
    includeTmpDir: true,
  }
) {
  const now = new Date();
  const fileTimestamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}T${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;

  let tempName = `${filename}_${nanoid(4)}`;

  if (options.includeTimestamp) {
    tempName = `${fileTimestamp}_${tempName}`;
  }

  if (options.includeTmpDir) {
    const tmpDir = join(process.cwd(), "tmp");
    if (!_tempDirExistanceChecked || !existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
      _tempDirExistanceChecked = true;
    }
    tempName = join(tmpDir, tempName);
  }

  return tempName;
}

async function cleanupConfig(
  configFileName: string,
  temporaryConfigFileName: string,
  additionalSettings: Record<string, any> = {}
) {
  const content = await readFile(configFileName, "utf-8");
  const parsedContent = JSON.parse(content);

  const cleanedConfig = JSON.stringify(
    mergeDeep(parsedContent, additionalSettings),
    null,
    2
  );
  await writeFile(temporaryConfigFileName, cleanedConfig);

  Console.debug("Cleaned config", temporaryConfigFileName, cleanedConfig);
}

// https://github.com/bambulab/BambuStudio/wiki/Command-Line-Usage
async function sliceSTL(file: File, settings: PrintSettings): Promise<string> {
  const inputFileName = `${await getTempFileName("input")}.stl`;
  const outputFileName = `${await getTempFileName("output")}.3mf`;
  const temporaryMachineConfigurationFileName = `${await getTempFileName(
    "machineConfiguration"
  )}.json`;
  const temporaryProcessConfigurationFileName = `${await getTempFileName(
    "processConfiguration"
  )}.json`;
  const temporaryFilamentConfigurationFileName = `${await getTempFileName(
    "filamentConfiguration"
  )}.json`;

  if (!SLICER_EXECUTABLE_PATH) {
    Console.error("SLICER_EXECUTABLE_PATH is not set");
    throw new Error("SLICER_EXECUTABLE_PATH is not set");
  }
  if (!existsSync(SLICER_EXECUTABLE_PATH)) {
    Console.error(
      "SLICER_EXECUTABLE_PATH does not exist",
      SLICER_EXECUTABLE_PATH
    );
    throw new Error(
      `SLICER_EXECUTABLE_PATH ${SLICER_EXECUTABLE_PATH} does not exist`
    );
  }

  const settingsPath = join(process.cwd(), "slicer-configs");

  const machineConfigurationFileName = join(
    settingsPath,
    settings.printerManufacturer,
    settings.printerModel,
    "machine",
    `${settings.nozzleSize} nozzle.json`
  );

  if (!existsSync(machineConfigurationFileName)) {
    Console.error(
      "Machine configuration file does not exist",
      machineConfigurationFileName
    );
    throw new Error(
      `Machine configuration file ${machineConfigurationFileName} does not exist`
    );
  }

  const processConfigurationFileName = join(
    settingsPath,
    settings.processConfigFile
  );

  if (!existsSync(processConfigurationFileName)) {
    Console.error(
      "Process configuration file does not exist",
      processConfigurationFileName
    );
    throw new Error(
      `Process configuration file ${processConfigurationFileName} does not exist`
    );
  }

  const filamentConfigurationFileName = join(
    settingsPath,
    settings.filamentConfigFile
  );

  if (!existsSync(filamentConfigurationFileName)) {
    Console.error(
      "Filament configuration file does not exist",
      filamentConfigurationFileName
    );
    throw new Error(
      `Filament configuration file ${filamentConfigurationFileName} does not exist`
    );
  }
  Console.debug("Validated configuration files");

  Console.debug("Writing stl to temporary file", inputFileName);
  await writeFile(inputFileName, Buffer.from(await file.arrayBuffer()));

  Console.debug(
    "Writing machine configuration to temporary file",
    temporaryMachineConfigurationFileName
  );
  await cleanupConfig(
    machineConfigurationFileName,
    temporaryMachineConfigurationFileName
  );

  const fullMachineName = `${settings.printerManufacturer} ${settings.printerModel} ${settings.nozzleSize} nozzle`;
  Console.debug("Writing process configuration to temporary file", {
    temporaryProcessConfigurationFileName,
    fullMachineName,
  });
  await cleanupConfig(
    processConfigurationFileName,
    temporaryProcessConfigurationFileName,
    {
      enable_support: settings.needsSupports ? "1" : "0",
      support_type: "tree(auto)",
      compatible_printers: [
        fullMachineName,
        `MyKlipper ${settings.nozzleSize} nozzle`,
      ],
    }
  );

  Console.debug(
    "Writing filament configuration to temporary file",
    temporaryFilamentConfigurationFileName
  );
  await cleanupConfig(
    filamentConfigurationFileName,
    temporaryFilamentConfigurationFileName
  );

  const command = `"${SLICER_EXECUTABLE_PATH}"
--orient 1
--arrange 1
--load-settings "${temporaryMachineConfigurationFileName}"
--load-settings "${temporaryProcessConfigurationFileName}"
--load-filaments "${temporaryFilamentConfigurationFileName}"
--curr-bed-type="${settings.buildPlateType ?? "unknown"}"
--slice 0
--debug 4
--ensure-on-bed
--min-save
--export-3mf "${outputFileName}"
"${inputFileName}"`;

  const formattedCommand = command.split("\n").join(" ");

  try {
    Console.debug("Executing Slicer", formattedCommand);
    await execSync(formattedCommand, {
      stdio: LOG_LEVEL === "debug" ? "inherit" : "ignore",
    });
    Console.debug("Slicer finished");

    return outputFileName;
  } catch (error) {
    Console.debug("Slicer failed");
    const readableErrorMessage = (error as Error).message.substring(
      `Command failed: ${command}`.length
    );
    Console.error("Error slicing STL", readableErrorMessage);
    throw new Error(readableErrorMessage.split(settingsPath).join(""));
  } finally {
    if (existsSync(inputFileName)) {
      Console.debug("Deleting input file", inputFileName);
      await unlink(inputFileName).catch(() => {
        Console.error(`Failed to delete input file ${inputFileName}`);
      });
    }

    if (existsSync(temporaryMachineConfigurationFileName)) {
      Console.debug(
        "Deleting temporary machine configuration file",
        temporaryMachineConfigurationFileName
      );
      await unlink(temporaryMachineConfigurationFileName).catch(() => {
        Console.error(
          `Failed to delete temporary machine configuration file ${temporaryMachineConfigurationFileName}`
        );
      });
    }

    if (existsSync(temporaryProcessConfigurationFileName)) {
      Console.debug(
        "Deleting temporary process configuration file",
        temporaryProcessConfigurationFileName
      );
      await unlink(temporaryProcessConfigurationFileName).catch(() => {
        Console.error(
          `Failed to delete temporary process configuration file ${temporaryProcessConfigurationFileName}`
        );
      });
    }

    if (existsSync(temporaryFilamentConfigurationFileName)) {
      Console.debug(
        "Deleting temporary filament configuration file",
        temporaryFilamentConfigurationFileName
      );
      await unlink(temporaryFilamentConfigurationFileName).catch(() => {
        Console.error(
          `Failed to delete temporary filament configuration file ${temporaryFilamentConfigurationFileName}`
        );
      });
    }
  }
}

async function upload3mfToBambuLabFTP(
  printer: PrinterWithConnectionDefinition<BambulabFTPConnectionDetails>,
  fileName: string,
  destinationFileName: string
) {
  const client = new FTPClient();
  client.ftp.verbose = LOG_LEVEL === "debug";

  await client.access({
    host: printer.connection.ipAddress,
    port: 990,
    user: "bblp",
    password: printer.connection.accessCode,
    secure: "implicit",
    secureOptions: {
      rejectUnauthorized: false,
    },
  });

  Console.debug("Connected to printer");
  await client.uploadFrom(fileName, destinationFileName);
}

/**
 * Uploads a 3MF file to a Klipper printer.
 * @param printer - The printer to upload the file to.
 * @param fileName - The path to the 3MF file to upload.
 * @param destinationFileName - The path to the destination file on the printer.
 *
 * The file is uploaded using the moonraker REST API
 * the endpoint is <ip-address>/<routePrefixIfSet>/server/files/upload
 * the body is a multipart/form-data with the file to upload
 * the file is uploaded as "file" and its filename is the destinationFileName
 * the endpoint might be secured with an api key which needs to be set in the request header "X-Api-Key"
 */
async function upload3mfToKlipper(
  printer: PrinterWithConnectionDefinition<KlipperConnectionDetails>,
  fileName: string,
  destinationFileName: string
) {
  Console.debug("Uploading 3MF to Klipper");

  let url = `http://${printer.connection.host}:${printer.connection.port}`;
  if (printer.connection.routePrefix) {
    url = `${url}/${printer.connection.routePrefix}`;
  }

  url = `${url}/server/files/upload`;

  Console.debug("using url", url);

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([await readFile(fileName)]),
    destinationFileName
  );

  Console.debug("using formData", formData);
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      "X-Api-Key": printer.connection.apiKey ?? "",
    },
  });

  if (!response.ok) {
    Console.error("Failed to upload 3MF to Klipper", response);
    throw new Error(`Failed to upload 3MF to Klipper: ${response.statusText}`);
  }

  Console.debug("Uploaded 3MF to Klipper", response.statusText);
}

async function upload3mfToPrinter(
  printer: PrinterWithConnectionDefinition,
  fileName: string,
  destinationFileName: string
): Promise<void> {
  if (isPrinterWithBambuLabFTPConnectionDetails(printer)) {
    return upload3mfToBambuLabFTP(printer, fileName, destinationFileName);
  }

  if (isPrinterWithKlipperConnectionDetails(printer)) {
    return upload3mfToKlipper(printer, fileName, destinationFileName);
  }

  throw new Error(
    `Unsupported printer connection type: ${printer.connection.type}`
  );
}

export async function handleFileUpload(
  formData: FormData
): Promise<BackendResponse<{ fileName: string }>> {
  const file = formData.get("file") as File;
  if (!file) {
    return sendError("No file provided");
  }

  if (!(file instanceof File)) {
    return sendError("Invalid file");
  }

  const settings = PrintSettingsSchema.parse({
    printerManufacturer: formData.get("printer_manufacturer"),
    printerModel: formData.get("printer_model"),
    printerName: formData.get("printer_name"),
    nozzleSize: parseFloat(formData.get("settings_nozzleSize") as string),
    processConfigFile: formData.get("settings_processConfigFile"),
    filamentConfigFile: formData.get("settings_filamentConfigFile"),
    needsSupports: formData.get("settings_needsSupports") === "true",
    buildPlateType: formData.get("settings_buildPlateType"),
  });
  Console.debug("FormData parsed", settings);

  let slicedFileName: string | null = null;
  try {
    const printerModel = await getPrinterDefinition_serverOnly(
      settings.printerManufacturer,
      settings.printerModel
    );
    const printer = printerModel.printers.find(
      (printer) => printer.name === settings.printerName
    );

    if (!printer) {
      return sendError("Printer not found");
    }

    slicedFileName = await sliceSTL(file, settings);
    Console.debug("Sliced STL", slicedFileName);

    const fileNameWithoutSuffix = file.name.substring(
      0,
      file.name.lastIndexOf(".")
    );
    const destinationFileName =
      (await getTempFileName(fileNameWithoutSuffix, {
        includeTimestamp: false,
        includeTmpDir: false,
      })) + ".3mf";
    await upload3mfToPrinter(printer, slicedFileName, destinationFileName);
    Console.debug("Uploaded 3MF to printer");

    return sendSuccess({
      fileName: destinationFileName,
    });
  } catch (error) {
    return sendError(error as string);
  } finally {
    if (slicedFileName && existsSync(slicedFileName)) {
      Console.debug("Deleting sliced file", slicedFileName);
      await unlink(slicedFileName);
    }
  }
}
