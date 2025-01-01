import { getPrinterConfigurations } from "@/services/printerConfigService";
import { useCallback, useEffect, useState } from "react";
import { getAllPrinterDefinitions } from "@/services/printerConfigService";
import {
  PrinterConfigurations,
  PrinterWithModelDefinition,
} from "@/types/printer";
import { useDebounce } from "@/hooks/use-debounce";

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
          setError(response.error);
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

  const fetchConfigs = useCallback(async () => {
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
    try {
      const response = await getPrinterConfigurations(
        manufacturer,
        model,
        nozzleSize
      );

      if (response.status !== "success") {
        setError(response.error);
        return;
      }

      setConfigs(response.data);
      cache.set(cacheKey, response.data);
    } finally {
      setIsFetching(false);
    }
  }, [manufacturer, model, nozzleSize]);

  const debouncedFetchConfigs = useDebounce(fetchConfigs, 300);

  useEffect(() => {
    debouncedFetchConfigs();
  }, [manufacturer, model, nozzleSize, debouncedFetchConfigs]);

  return { configs, isFetching, error };
}
