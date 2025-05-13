import { createLogger, LogLevel } from "@/lib/logger"
import { ErrorAnalyzer } from "./error-analyzer"
import { SolutionProvider } from "./solution-provider"
import { ErrorAggregator } from "./error-aggregator"
import { type AdvancedLoggerConfig, type CategorizedError, ErrorSeverity, ErrorSource } from "./types"

const defaultConfig: AdvancedLoggerConfig = {
  minLogLevel: LogLevel.INFO,
  enableStackTraceAnalysis: true,
  enableSolutionSuggestions: true,
  enableErrorAggregation: true,
  maxErrorsToStore: 100,
}

/**
 * Advanced logger that provides error analysis and solution suggestions
 */
export class AdvancedLogger {
  private logger = createLogger("advanced-logger")
  private errorAnalyzer: ErrorAnalyzer
  private solutionProvider: SolutionProvider
  private errorAggregator: ErrorAggregator
  private config: AdvancedLoggerConfig

  constructor(config: Partial<AdvancedLoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.errorAnalyzer = new ErrorAnalyzer()
    this.solutionProvider = new SolutionProvider()
    this.errorAggregator = new ErrorAggregator(this.config.maxErrorsToStore)

    this.logger.info("Advanced logger initialized with configuration:", {
      details: this.config,
    })
  }

  /**
   * Logs an error with advanced analysis
   */
  logError(
    error: Error | string,
    moduleName: string,
    options: {
      code?: string
      context?: Record<string, any>
      level?: LogLevel
    } = {},
  ): CategorizedError {
    const actualError = typeof error === "string" ? new Error(error) : error
    const errorCode = options.code
    const context = options.context || {}
    const level = options.level || LogLevel.ERROR

    // Analyze the error
    const categorizedError = this.errorAnalyzer.analyze(actualError, moduleName, context, errorCode)

    // Find a solution if enabled
    if (this.config.enableSolutionSuggestions) {
      categorizedError.suggestedSolution = this.solutionProvider.findSolution(categorizedError)
    }

    // Aggregate the error if enabled
    if (this.config.enableErrorAggregation) {
      this.errorAggregator.addError(categorizedError)
    }

    // Log the error with the standard logger
    const logMessage = this.formatErrorMessage(categorizedError)

    switch (level) {
      case LogLevel.DEBUG:
        this.logger.debug(logMessage, {
          code: errorCode,
          details: categorizedError,
        })
        break
      case LogLevel.INFO:
        this.logger.info(logMessage, {
          code: errorCode,
          details: categorizedError,
        })
        break
      case LogLevel.WARNING:
        this.logger.warning(logMessage, {
          code: errorCode,
          details: categorizedError,
        })
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
      default:
        this.logger.error(logMessage, {
          code: errorCode,
          details: categorizedError,
        })
        break
    }

    return categorizedError
  }

  /**
   * Formats an error message for logging
   */
  private formatErrorMessage(error: CategorizedError): string {
    let message = `[${error.severity.toUpperCase()}] [${error.source}] ${error.message}`

    if (error.code) {
      message += ` (${error.code})`
    }

    if (error.fileName && error.lineNumber) {
      message += ` at ${error.fileName}:${error.lineNumber}`
      if (error.functionName) {
        message += ` in ${error.functionName}()`
      }
    }

    if (error.suggestedSolution) {
      message += `\nSolução sugerida: ${error.suggestedSolution}`
    }

    return message
  }

  /**
   * Gets all aggregated errors
   */
  getAggregatedErrors() {
    return this.errorAggregator.getAggregatedErrors()
  }

  /**
   * Clears all aggregated errors
   */
  clearAggregatedErrors() {
    this.errorAggregator.clearErrors()
  }

  /**
   * Adds a custom solution to the solution provider
   */
  addCustomSolution(
    errorPattern: RegExp | string,
    solution: string,
    options: {
      documentationUrl?: string
      severity?: ErrorSeverity
      source?: ErrorSource
    } = {},
  ) {
    this.solutionProvider.addSolution({
      errorPattern,
      solution,
      documentationUrl: options.documentationUrl,
      severity: options.severity || ErrorSeverity.MEDIUM,
      source: options.source || ErrorSource.UNKNOWN,
    })

    this.logger.info(`Added custom solution for error pattern: ${errorPattern}`)
  }
}

// Create a singleton instance
let advancedLoggerInstance: AdvancedLogger | null = null

/**
 * Gets the singleton instance of the advanced logger
 */
export function getAdvancedLogger(config?: Partial<AdvancedLoggerConfig>): AdvancedLogger {
  if (!advancedLoggerInstance) {
    advancedLoggerInstance = new AdvancedLogger(config)
  }
  return advancedLoggerInstance
}
