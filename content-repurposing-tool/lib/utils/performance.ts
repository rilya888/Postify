/**
 * Performance monitoring utilities
 * Track performance metrics for API calls, rendering, and user interactions
 */

export class PerformanceMonitor {
  private static measurements: Map<string, { startTime: number; meta?: Record<string, unknown> }> = new Map();

  /**
   * Start measuring performance for a specific operation
   */
  static startMeasurement(operationId: string, meta?: Record<string, unknown>) {
    this.measurements.set(operationId, {
      startTime: performance.now(),
      meta,
    });
  }

  /**
   * End measurement and log the result
   */
  static endMeasurement(operationId: string, logToConsole: boolean = true) {
    const measurement = this.measurements.get(operationId);
    if (!measurement) {
      console.warn(`No measurement found for operation: ${operationId}`);
      return null;
    }

    const duration = performance.now() - measurement.startTime;
    
    // Remove the measurement from the map
    this.measurements.delete(operationId);

    const perfData = {
      operation: operationId,
      durationMs: Math.round(duration * 100) / 100, // Round to 2 decimal places
      timestamp: new Date().toISOString(),
      ...measurement.meta,
    };

    if (logToConsole) {
      console.log(`[PERFORMANCE] ${perfData.operation} took ${perfData.durationMs}ms`);
    }

    // Log to our enhanced logger
    import('./logger').then(({ Logger }) => {
      Logger.performance(perfData.operation, perfData.durationMs, perfData);
    });

    return perfData;
  }

  /**
   * Measure an async function execution time
   */
  static async measureAsync<T>(
    operationId: string,
    fn: () => Promise<T>,
    meta?: Record<string, unknown>
  ): Promise<T> {
    this.startMeasurement(operationId, meta);
    try {
      const result = await fn();
      this.endMeasurement(operationId);
      return result;
    } catch (error) {
      this.endMeasurement(operationId);
      throw error;
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  static measureSync<T>(
    operationId: string,
    fn: () => T,
    meta?: Record<string, unknown>
  ): T {
    this.startMeasurement(operationId, meta);
    try {
      const result = fn();
      this.endMeasurement(operationId);
      return result;
    } catch (error) {
      this.endMeasurement(operationId);
      throw error;
    }
  }

  /**
   * Get all active measurements
   */
  static getActiveMeasurements() {
    return Array.from(this.measurements.keys());
  }

  /**
   * Clear all measurements
   */
  static clearMeasurements() {
    this.measurements.clear();
  }
}

// Convenience functions for common performance measurements
export const measureApiCall = async <T>(
  endpoint: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> => {
  return PerformanceMonitor.measureAsync(
    `API_CALL_${endpoint.toUpperCase().replace(/[\/\-\.\?=&]/g, '_')}`,
    fn,
    { endpoint, ...meta }
  );
};

export const measureFunction = <T>(
  name: string,
  fn: () => T,
  meta?: Record<string, unknown>
): T => {
  return PerformanceMonitor.measureSync(name, fn, meta);
};