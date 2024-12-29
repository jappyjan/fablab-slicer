export type AVAILABLE_LOG_LEVELS = "debug" | "info" | "warn" | "error";
export const LOG_LEVEL = (process.env.PUBLIC_LOG_LEVEL ||
  "info") as AVAILABLE_LOG_LEVELS;
export const SLICER_EXECUTABLE_PATH = process.env.SLICER_EXECUTABLE_PATH;
