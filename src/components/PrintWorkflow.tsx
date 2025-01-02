"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Upload as UploadIcon,
  Printer as PrinterIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { PrintSettings } from "@/components/PrintSettings";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { SuccessModal } from "@/components/SuccessModal";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { handleFileUpload } from "../services/printerService";
import { ErrorDisplay } from "./ErrorDisplay";
import { PrinterSelector } from "./PrinterSelector";
import { PrinterWithModelDefinition } from "@/types/printer";

type StepName =
  | "choose_file"
  | "choose_printer"
  | "settings"
  | "slice_file"
  | "success";

const ONE_MB = 1000000;
const HUGE_FILE_SIZE = 30 * ONE_MB;

export function PrintWorkflow() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nozzleSize, setNozzleSize] = useState<number | null>(null);
  const [processConfigFile, setProcessConfigFile] = useState<string | null>(
    null
  );
  const [filamentConfigFile, setFilamentConfigFile] = useState<string | null>(
    null
  );
  const [buildPlateType, setBuildPlateType] = useState<string | null>(null);
  const [needsSupports, setNeedsSupports] = useState(false);
  const [slicingProgress, setSlicingProgress] = useState(0);
  const [activeStep, setActiveStep] = useState<StepName>("choose_file");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHugeFile, setIsHugeFile] = useState(false);
  const [selectedPrinter, setSelectedPrinter] =
    useState<PrinterWithModelDefinition | null>(null);
  const [slicedFileName, setSlicedFileName] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setActiveStep("choose_printer");
  }, []);

  const handlePrinterSelect = useCallback(
    (printer: PrinterWithModelDefinition) => {
      setSelectedPrinter(printer);
      setActiveStep("settings");
    },
    []
  );

  const startPrint = useCallback(async () => {
    setActiveStep("slice_file");

    setSlicedFileName(null);

    let fakeProgressInterval: NodeJS.Timeout | null = null;

    try {
      setSlicingProgress(1);
      setErrorMessage(null);

      setIsHugeFile(selectedFile!.size > HUGE_FILE_SIZE);

      const formData = new FormData();
      formData.set("file", selectedFile!);

      formData.set("printer_manufacturer", selectedPrinter!.manufacturer);
      formData.set("printer_model", selectedPrinter!.model);
      formData.set("printer_name", selectedPrinter!.name);

      formData.set("settings_nozzleSize", nozzleSize!.toString());
      formData.set("settings_processConfigFile", processConfigFile!);
      formData.set("settings_filamentConfigFile", filamentConfigFile!);
      formData.set("settings_needsSupports", needsSupports.toString());
      formData.set("settings_buildPlateType", buildPlateType!);

      const MAX_PROGRESS = 95;
      const increaseProgress = () => {
        fakeProgressInterval = setTimeout(() => {
          setSlicingProgress((current) => {
            const increment = Math.random() * (MAX_PROGRESS - current) * 0.1;
            const newProgress = current + increment;
            return newProgress >= MAX_PROGRESS ? MAX_PROGRESS : newProgress;
          });
          increaseProgress();
        }, Math.random() * 1000);
      };

      increaseProgress();

      const response = await handleFileUpload(formData);
      if (response.status !== "success") {
        setErrorMessage(response.error);
        return;
      }

      console.log(response);
      const { fileName } = response.data;

      setSlicedFileName(fileName);

      clearTimeout(fakeProgressInterval!);
      setSlicingProgress(100);

      setActiveStep("success");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      if (fakeProgressInterval) {
        clearTimeout(fakeProgressInterval);
      }
    }
  }, [
    selectedFile,
    selectedPrinter,
    nozzleSize,
    processConfigFile,
    filamentConfigFile,
    needsSupports,
    buildPlateType,
  ]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      startPrint();
    },
    [startPrint]
  );

  const resetWorkflow = useCallback(() => {
    setActiveStep("choose_file");
    setSlicingProgress(0);
    setSelectedPrinter(null);
    setNozzleSize(null);
    setProcessConfigFile(null);
    setFilamentConfigFile(null);
    setNeedsSupports(false);
    setIsHugeFile(false);
    setSelectedFile(null);
    setErrorMessage(null);
  }, []);

  return (
    <form onSubmit={onSubmit} className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <PrinterIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Scheibierer 4000</h1>
        </div>

        <div className="space-y-6">
          <CollapsiblePanel
            title={
              selectedFile
                ? selectedFile.name
                : "STL Datei hochladen | Upload STL File"
            }
            icon={UploadIcon}
            isOpen={activeStep === "choose_file"}
            onToggle={() => setActiveStep("choose_file")}
          >
            <FileUpload onFileSelect={handleFileSelect} />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Gewählte Date | Selected file: {selectedFile.name}
              </p>
            )}
          </CollapsiblePanel>

          {selectedFile && (
            <CollapsiblePanel
              title={
                selectedPrinter
                  ? selectedPrinter.name
                  : "Drucker auswählen | Select Printer"
              }
              icon={PrinterIcon}
              isOpen={activeStep === "choose_printer"}
              onToggle={() => setActiveStep("choose_printer")}
            >
              <PrinterSelector
                selectedPrinter={selectedPrinter}
                onPrinterSelect={handlePrinterSelect}
              />
            </CollapsiblePanel>
          )}

          {selectedPrinter !== null && (
            <CollapsiblePanel
              title="Druck Einstellungen | Print Settings"
              icon={SettingsIcon}
              isOpen={activeStep === "settings"}
              onToggle={() => setActiveStep("settings")}
            >
              <PrintSettings
                nozzleSize={nozzleSize}
                processConfigFile={processConfigFile}
                filamentConfigFile={filamentConfigFile}
                needsSupports={needsSupports}
                buildPlateType={buildPlateType}
                onNozzleSizeChange={setNozzleSize}
                onProcessConfigFileChange={setProcessConfigFile}
                onFilamentConfigFileChange={setFilamentConfigFile}
                onNeedsSupportsChange={setNeedsSupports}
                onBuildPlateTypeChange={setBuildPlateType}
                selectedPrinter={selectedPrinter}
              />

              <button
                disabled={
                  !nozzleSize ||
                  !processConfigFile ||
                  !filamentConfigFile ||
                  !selectedPrinter
                }
                type="submit"
                className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Hochladen und Verarbeiten | Upload and Process
              </button>
            </CollapsiblePanel>
          )}

          {slicingProgress > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <ProgressIndicator
                progress={slicingProgress}
                infinite={isHugeFile}
                label="Slicing"
              />
            </div>
          )}

          {errorMessage && (
            <ErrorDisplay
              errorMessage={errorMessage}
              onRetry={startPrint}
              hasRetry={activeStep === "slice_file"}
            />
          )}
        </div>
      </div>

      <SuccessModal
        isOpen={activeStep === "success"}
        onClose={resetWorkflow}
        fileName={slicedFileName ?? ""}
      />
    </form>
  );
}
