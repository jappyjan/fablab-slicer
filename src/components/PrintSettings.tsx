import React, { useEffect } from "react";
import { usePrinterConfigs } from "@/hooks/printer-configs";
import { ProgressIndicator } from "./ProgressIndicator";
import { PrinterWithModelDefinition } from "@/types/printer";

interface PrintSettingsProps {
  selectedPrinter: PrinterWithModelDefinition;
  nozzleSize: number | null;
  processConfigFile: string | null;
  filamentConfigFile: string | null;
  needsSupports: boolean;
  buildPlateType: string | null;
  onNozzleSizeChange: (nozzleSize: number | null) => void;
  onProcessConfigFileChange: (processConfigFile: string | null) => void;
  onFilamentConfigFileChange: (filamentConfigFile: string | null) => void;
  onNeedsSupportsChange: (needsSupports: boolean) => void;
  onBuildPlateTypeChange: (buildPlateType: string | null) => void;
}

export function PrintSettings({
  selectedPrinter,
  nozzleSize,
  processConfigFile,
  filamentConfigFile,
  needsSupports,
  buildPlateType,
  onNozzleSizeChange,
  onProcessConfigFileChange,
  onFilamentConfigFileChange,
  onNeedsSupportsChange,
  onBuildPlateTypeChange,
}: PrintSettingsProps) {
  const {
    configs,
    isFetching: isFetchingConfigs,
    error,
  } = usePrinterConfigs(
    selectedPrinter.manufacturer,
    selectedPrinter.model,
    nozzleSize
  );

  useEffect(() => {
    if (nozzleSize !== null && nozzleSize !== undefined) {
      return;
    }

    onNozzleSizeChange(selectedPrinter.availableNozzleSizes[0]);
  }, [selectedPrinter]);

  useEffect(() => {
    onProcessConfigFileChange(null);
    onFilamentConfigFileChange(null);
  }, [nozzleSize]);

  useEffect(() => {
    onBuildPlateTypeChange(selectedPrinter.defaultBuildPlate);
  }, [selectedPrinter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {isFetchingConfigs && (
          <ProgressIndicator infinite label="Fetching printer configs..." />
        )}
        {error && <div className="text-red-500">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nozzle Size
          </label>
          <select
            value={nozzleSize ?? ""}
            onChange={(e) => onNozzleSizeChange(parseFloat(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {selectedPrinter.availableNozzleSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {(selectedPrinter.availableBuildPlates?.length ?? 0) > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Build Plate
            </label>
            <select
              value={buildPlateType ?? ""}
              onChange={(e) => onBuildPlateTypeChange(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {!buildPlateType && (
                <option disabled value="">
                  Select Build Plate
                </option>
              )}
              {selectedPrinter.availableBuildPlates.map((buildPlate) => (
                <option key={buildPlate} value={buildPlate}>
                  {buildPlate}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Print Quality
          </label>
          <select
            value={processConfigFile ?? ""}
            onChange={(e) => onProcessConfigFileChange(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {!processConfigFile && (
              <option disabled value="">
                Select Quality
              </option>
            )}
            {configs?.process.map((configFile) => (
              <option key={configFile.path} value={configFile.path}>
                {configFile.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Filament Type
          </label>
          <select
            value={filamentConfigFile ?? ""}
            onChange={(e) => onFilamentConfigFileChange(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {!filamentConfigFile && (
              <option disabled value="">
                Select Filament
              </option>
            )}
            {configs?.filament.map((configFile) => (
              <option key={configFile.path} value={configFile.path}>
                {configFile.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={needsSupports}
              onChange={(e) => onNeedsSupportsChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Generate Supports
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
