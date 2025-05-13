import { getAdvancedLogger } from "./advanced-logger"
import { LogLevel, ErrorCodes } from "@/lib/logger"
import { type ErrorSeverity, ErrorSource } from "./types"

const MODULE_NAME = "shopee-api"

/**
 * Advanced logger specifically for the Shopee API
 */
export class ShopeeApiLogger {
  private advancedLogger = getAdvancedLogger()

  /**
   * Logs an error related to the Shopee API
   */
  logError(
    error: Error | string,
    options: {
      code?: string
      context?: Record<string, any>
      level?: LogLevel
    } = {},
  ) {
    return this.advancedLogger.logError(error, MODULE_NAME, options)
  }

  /**
   * Logs an authentication error
   */
  logAuthError(
    error: Error | string,
    options: {
      code?: string
      context?: Record<string, any>
    } = {},
  ) {
    const code = options.code || ErrorCodes.AUTH.UNAUTHORIZED
    return this.advancedLogger.logError(error, MODULE_NAME, {
      ...options,
      code,
      level: LogLevel.ERROR,
    })
  }

  /**
   * Logs a network error
   */
  logNetworkError(
    error: Error | string,
    options: {
      code?: string
      context?: Record<string, any>
    } = {},
  ) {
    const code = options.code || ErrorCodes.API.REQUEST_FAILED
    return this.advancedLogger.logError(error, MODULE_NAME, {
      ...options,
      code,
      level: LogLevel.ERROR,
    })
  }

  /**
   * Logs a timeout error
   */
  logTimeoutError(
    error: Error | string,
    options: {
      context?: Record<string, any>
    } = {},
  ) {
    return this.advancedLogger.logError(error, MODULE_NAME, {
      ...options,
      code: ErrorCodes.API.TIMEOUT,
      level: LogLevel.WARNING,
    })
  }

  /**
   * Logs a validation error
   */
  logValidationError(
    error: Error | string,
    options: {
      code?: string
      context?: Record<string, any>
    } = {},
  ) {
    const code = options.code || ErrorCodes.VALIDATION.INVALID_FORMAT
    return this.advancedLogger.logError(error, MODULE_NAME, {
      ...options,
      code,
      level: LogLevel.WARNING,
    })
  }

  /**
   * Adds a custom solution for Shopee API errors
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
    this.advancedLogger.addCustomSolution(errorPattern, solution, {
      ...options,
      source: options.source || ErrorSource.API,
    })
  }

  /**
   * Gets all aggregated errors
   */
  getAggregatedErrors() {
    return this.advancedLogger.getAggregatedErrors()
  }
}

// Create a singleton instance
let shopeeApiLoggerInstance: ShopeeApiLogger | null = null

/**
 * Gets the singleton instance of the Shopee API logger
 */
export function getShopeeApiLogger(): ShopeeApiLogger {
  if (!shopeeApiLoggerInstance) {
    shopeeApiLoggerInstance = new ShopeeApiLogger()
  }
  return shopeeApiLoggerInstance
}
