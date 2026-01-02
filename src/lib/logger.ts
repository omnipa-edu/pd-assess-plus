/**
 * Centralized logging utility
 * Provides consistent logging interface with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || '');
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...context }
      : { error, ...context };
    
    console.error(`[ERROR] ${message}`, errorContext);
  }

  /**
   * Log group of related messages
   */
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }
}

export const logger = new Logger();





