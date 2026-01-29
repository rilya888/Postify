/**
 * Application logging service
 * Centralized logging for debugging and monitoring
 */
export class Logger {
  static info(message: string, meta?: Record<string, unknown>) {
    console.log(`[INFO] ${message}`, meta);
    // In production, send to external service like Sentry, LogRocket, etc.
  }

  static warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, meta);
  }

  static error(message: string, error?: Error, meta?: Record<string, unknown>) {
    console.error(`[ERROR] ${message}`, error, meta);
    // In production, send to error tracking service
  }

  static debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  }
}