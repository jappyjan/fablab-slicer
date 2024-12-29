import { LOG_LEVEL, AVAILABLE_LOG_LEVELS } from "./config";

const levelToIntMap: Record<AVAILABLE_LOG_LEVELS, number> = {
  debug: 3,
  info: 2,
  warn: 1,
  error: 0,
};

export class Console {
  private static logWithLevel(level: AVAILABLE_LOG_LEVELS) {
    const systemLogLevelInt = levelToIntMap[LOG_LEVEL];
    const minLevelToLogInt = levelToIntMap[level];

    const shouldLog = systemLogLevelInt >= minLevelToLogInt;

    if (!shouldLog) {
      return () => {};
    }

    return console[level].bind(console);
  }

  static debug = this.logWithLevel("debug");
  static error = this.logWithLevel("error");
  static warn = this.logWithLevel("warn");
  static info = this.logWithLevel("info");
}
