import { getPrinterConfigurations } from "@/services/printerConfigService";
import { useEffect, useState } from "react";
import { getAllPrinterDefinitions } from "@/services/printerConfigService";
import {
  PrinterConfigurations,
  PrinterWithModelDefinition,
} from "@/types/printer";

const cache = new Map<string, any>();

export function usePrinters() {
  const [printers, setPrinters] = useState<PrinterWithModelDefinition[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache.has("printers")) {
      setPrinters(cache.get("printers"));
      return;
    }

    setIsFetching(true);
    getAllPrinterDefinitions()
      .then((response) => {
        if (response.status !== "success") {
          let errorMsg = "Unknown error";
          if (Array.isArray(response.error)) {
            errorMsg = response.error.join("\n");
          } else {
            errorMsg = response.error.toString();
          }
          setError(errorMsg);
          return;
        }
        setPrinters(response.data);
        cache.set("printers", response.data);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  return { printers, isFetching, error };
}

export function usePrinterConfigs(
  manufacturer: string | null,
  model: string | null,
  nozzleSize: number | null
) {
  const [isFetching, setIsFetching] = useState(true);
  const [configs, setConfigs] = useState<PrinterConfigurations | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!manufacturer || !model || !nozzleSize) {
      setConfigs(null);
      setIsFetching(false);
      return;
    }

    const cacheKey = `${manufacturer}-${model}-${nozzleSize}`;
    if (cache.has(cacheKey)) {
      setConfigs(cache.get(cacheKey));
      return;
    }

    setIsFetching(true);
    getPrinterConfigurations(manufacturer, model, nozzleSize)
      .then((response) => {
        if (response.status !== "success") {
          let errorMsg = "Unknown error";
          if (Array.isArray(response.error)) {
            errorMsg = response.error.join("\n");
          } else {
            errorMsg = response.error.toString();
          }
          setError(errorMsg);
          return;
        }
        setConfigs(response.data);
        cache.set(cacheKey, response.data);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [manufacturer, model, nozzleSize]);

  return { configs, isFetching, error };
}
