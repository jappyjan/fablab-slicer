import {
  getPrinterConfigurations,
  PrinterConfigurations,
  PrinterWithModelDefinition,
} from "@/services/printerConfigService";
import { useEffect, useState } from "react";
import { getAllPrinterDefinitions } from "@/services/printerConfigService";

const cache = new Map<string, any>();

export function usePrinters() {
  const [printers, setPrinters] = useState<PrinterWithModelDefinition[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (cache.has("printers")) {
      setPrinters(cache.get("printers"));
      return;
    }

    setIsFetching(true);
    getAllPrinterDefinitions()
      .then((printers) => {
        setPrinters(printers);
        cache.set("printers", printers);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  return { printers, isFetching };
}

export function usePrinterConfigs(
  manufacturer: string | null,
  model: string | null,
  nozzleSize: number | null
) {
  const [isFetching, setIsFetching] = useState(true);
  const [configs, setConfigs] = useState<PrinterConfigurations | null>(null);

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
      .then((configs) => {
        setConfigs(configs);
        cache.set(cacheKey, configs);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [manufacturer, model, nozzleSize]);

  return { configs, isFetching };
}
