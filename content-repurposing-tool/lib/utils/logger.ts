/**
 * Enhanced application logging service.
 * Do not log user content (sourceContent, content, brandVoice.examples) in meta — only requestId, userId, projectId, lengths, hashes, errors.
 */
export class Logger {
  /**
   * Log informational messages
   */
  static info(message: string, meta?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta,
    };
    
    console.log(JSON.stringify(logEntry));
    
    // In production, send to external service like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      // Send to external logging service
      this._sendToExternalService(logEntry);
    }
  }

  /**
   * Log warning messages
   */
  static warn(message: string, meta?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...meta,
    };
    
    console.warn(JSON.stringify(logEntry));
    
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      this._sendToExternalService(logEntry);
    }
  }

  /**
   * Log error messages
   */
  static error(message: string, error?: Error, meta?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : undefined,
      ...meta,
    };
    
    console.error(JSON.stringify(logEntry));
    
    // Always send errors to external service in production
    if (typeof window === 'undefined') {
      this._sendToExternalService(logEntry);
    }
  }

  /**
   * Log debug messages (only in development)
   */
  static debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        ...meta,
      };
      
      console.debug(JSON.stringify(logEntry));
    }
  }

  /**
   * Log performance metrics
   */
  static performance(operation: string, durationMs: number, meta?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'performance',
      operation,
      durationMs,
      ...meta,
    };
    
    console.log(JSON.stringify(logEntry));
    
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      this._sendToExternalService(logEntry);
    }
  }

  /**
   * Send log to external service (placeholder implementation)
   */
  private static async _sendToExternalService(_logEntry: any) {
    // In a real implementation, this would send to a service like Sentry, LogRocket, etc.
    // For now, we'll just log to console in a server environment

    // Example implementation for external service:
    /*
    try {
      await fetch('https://logging-service.example.com/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOGGING_SERVICE_TOKEN}`,
        },
        body: JSON.stringify(logEntry),
      });
    } catch (err) {
      console.error('Failed to send log to external service:', err);
    }
    */
  }

  /**
   * Log user actions for analytics
   */
  static trackUserAction(action: string, userId: string, meta?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'user-action',
      action,
      userId,
      ...meta,
    };
    
    console.log(JSON.stringify(logEntry));
    
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      this._sendToExternalService(logEntry);
    }
  }
}