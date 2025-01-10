import React, { useCallback, useMemo, useState } from "react";
import { ProgressIndicator } from "./ProgressIndicator";
import { usePrinters } from "@/hooks/printer-configs";
import { PrinterWithModelDefinition } from "@/types/printer";
import { Popup, PopupButton } from "./Popup";

interface PrinterSelectorProps {
  selectedPrinter: PrinterWithModelDefinition | null;
  onPrinterSelect: (printer: PrinterWithModelDefinition) => void;
}

export function PrinterSelector({
  selectedPrinter,
  onPrinterSelect,
}: PrinterSelectorProps) {
  const { printers, isFetching } = usePrinters();
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState<{
    english: string;
    german: string;
  } | null>(null);
  const [popupDescription, setPopupDescription] = useState<{
    english: string;
    german: string;
  } | null>(null);
  const [temporarySelectedPrinter, setTemporarySelectedPrinter] =
    useState<PrinterWithModelDefinition | null>(null);

  const isSelected = useCallback(
    (printer: PrinterWithModelDefinition) => {
      return (
        selectedPrinter?.manufacturer === printer.manufacturer &&
        selectedPrinter?.model === printer.model &&
        selectedPrinter?.name === printer.name
      );
    },
    [selectedPrinter]
  );

  const onClick = useCallback(
    (printer: PrinterWithModelDefinition, popupIsConfirmed = false) => {
      console.log("click", {
        printer,
        popupIsConfirmed,
        onSelect: printer?.popups?.onSelect,
      });

      if (!popupIsConfirmed && printer.popups?.onSelect) {
        setPopupTitle(printer.popups.onSelect.title);
        setPopupDescription(printer.popups.onSelect.description);
        setShowPopup(true);
        setTemporarySelectedPrinter(printer);
        return;
      }
      onPrinterSelect(printer);
    },
    [onPrinterSelect]
  );

  const onPopupContinue = useCallback(() => {
    setShowPopup(false);
    onClick(temporarySelectedPrinter!, true);
  }, [temporarySelectedPrinter, onClick]);

  const onPopupBack = useCallback(() => {
    setShowPopup(false);
  }, []);

  const popupButtons: PopupButton[] = useMemo(() => {
    return [
      {
        label: { german: "Weiter", english: "Continue" },
        onClick: onPopupContinue,
        variant: "secondary",
      },
      {
        label: { german: "Zurück", english: "Back" },
        onClick: onPopupBack,
        variant: "primary",
      },
    ];
  }, [onPopupContinue, onPopupBack]);

  if (isFetching) {
    return (
      <ProgressIndicator infinite label="Lade Drucker | Fetching printers..." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printers.map((printer) => (
          <button
            key={`${printer.manufacturer}-${printer.model}-${printer.name}`}
            onClick={() => onClick(printer)}
            className={`relative group rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
              isSelected(printer)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-200"
            }`}
            type="button"
          >
            <div className="aspect-video w-full mb-4 overflow-hidden rounded-md bg-gray-100">
              <img
                src={printer.imagePath}
                alt={`${printer.manufacturer} ${printer.model}`}
                className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="font-medium text-gray-900">{printer.name}</h3>
                <p className="text-sm text-gray-500">
                  {printer.manufacturer} {printer.model}
                </p>
              </div>
            </div>

            {isSelected(printer) && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
            )}
          </button>
        ))}
      </div>

      <Popup
        show={showPopup}
        title={popupTitle}
        description={popupDescription}
        onClose={() => onPopupClose()}
        buttons={popupButtons}
      />
    </div>
  );
}
