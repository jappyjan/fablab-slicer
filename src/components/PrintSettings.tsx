import React, { useEffect, useMemo } from "react";
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
  autoOrient: boolean;
  onNozzleSizeChange: (nozzleSize: number | null) => void;
  onProcessConfigFileChange: (processConfigFile: string | null) => void;
  onFilamentConfigFileChange: (filamentConfigFile: string | null) => void;
  onNeedsSupportsChange: (needsSupports: boolean) => void;
  onBuildPlateTypeChange: (buildPlateType: string | null) => void;
  onAutoOrientChange: (autoOrient: boolean) => void;
}

export function PrintSettings({
  selectedPrinter,
  nozzleSize,
  processConfigFile,
  filamentConfigFile,
  needsSupports,
  buildPlateType,
  autoOrient,
  onNozzleSizeChange,
  onProcessConfigFileChange,
  onFilamentConfigFileChange,
  onNeedsSupportsChange,
  onBuildPlateTypeChange,
  onAutoOrientChange,
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

    const newPrinterHasSelectedNozzleSize =
      nozzleSize && selectedPrinter.availableNozzleSizes.includes(nozzleSize);

    if (!newPrinterHasSelectedNozzleSize) {
      onNozzleSizeChange(selectedPrinter.availableNozzleSizes[0] ?? null);
    }
  }, [selectedPrinter]);

  const matchingFilamentConfigs = useMemo(() => {
    const filamentConfigs = configs?.filament ?? [];
    return filamentConfigs.filter((config) => {
      if (!Array.isArray(selectedPrinter.availableMaterials)) {
        return true;
      }
      return selectedPrinter.availableMaterials.some((material) =>
        config.name.toLowerCase().includes(material.toLowerCase())
      );
    });
  }, [configs, selectedPrinter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {isFetchingConfigs && (
          <ProgressIndicator
            infinite
            label="Lade Drucker Konfigurationen | Fetching printer configs..."
          />
        )}
        {error && <div className="text-red-500">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Düsengröße | Nozzle Size
          </label>
          {selectedPrinter.availableNozzleSizes.length > 1 ? (
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
          ) : (
            <span>{nozzleSize ?? ""}</span>
          )}
        </div>

        {(selectedPrinter.availableBuildPlates?.length ?? 0) > 1 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Druckplatte | Build Plate
            </label>
            <select
              value={buildPlateType ?? ""}
              onChange={(e) => onBuildPlateTypeChange(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {!buildPlateType && (
                <option disabled value="">
                  Druckplatte auswählen | Select Build Plate
                </option>
              )}
              {selectedPrinter.availableBuildPlates.map((buildPlate) => (
                <option key={buildPlate} value={buildPlate}>
                  {buildPlate}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span>{buildPlateType ?? ""}</span>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Druckqualität | Print Quality
          </label>
          <select
            value={processConfigFile ?? ""}
            onChange={(e) => onProcessConfigFileChange(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {!processConfigFile && (
              <option disabled value="">
                Qualität auswählen | Select Quality
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
            Filamenttyp | Filament Type
          </label>
          <select
            value={filamentConfigFile ?? ""}
            onChange={(e) => onFilamentConfigFileChange(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {!filamentConfigFile && (
              <option disabled value="">
                Filament auswählen | Select Filament
              </option>
            )}
            {matchingFilamentConfigs.map((configFile) => (
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
              Unterstützungen generieren | Generate Supports
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoOrient}
              onChange={(e) => onAutoOrientChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Automatisch Ausrichten | Auto Orient
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
