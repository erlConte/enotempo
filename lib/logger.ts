/**
 * Logger strutturato per l'applicazione
 * In produzione usa solo error, in sviluppo anche info e debug
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isDevelopment) {
      // In sviluppo, usa console con colori
      const colors = {
        info: "\x1b[36m", // cyan
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
        debug: "\x1b[35m", // magenta
      };
      const reset = "\x1b[0m";
      console[level === "debug" ? "log" : level](
        `${colors[level]}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`,
        context ? JSON.stringify(context, null, 2) : ""
      );
    } else {
      // In produzione, usa solo error per evitare log eccessivi
      if (level === "error") {
        console.error(JSON.stringify(logEntry));
      }
      // In futuro, qui si può integrare un servizio di logging esterno (Sentry, LogRocket, ecc.)
    }
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log("info", message, context);
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log("warn", message, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error instanceof Error
        ? {
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
          }
        : { error: String(error) }),
    };
    this.log("error", message, errorContext);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }
}

export const logger = new Logger();
