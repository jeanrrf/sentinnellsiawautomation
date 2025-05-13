import { ErrorCodes } from "@/lib/logger"
import { type CategorizedError, ErrorSeverity, ErrorSource } from "./types"

/**
 * Analyzes errors and categorizes them
 */
export class ErrorAnalyzer {
  /**
   * Analyzes an error and returns a categorized error
   */
  analyze(error: Error, moduleName: string, context?: Record<string, any>, errorCode?: string): CategorizedError {
    const timestamp = new Date().toISOString()
    const stackTrace = error.stack || ""

    // Extract file information from stack trace
    const fileInfo = this.extractFileInfo(stackTrace)

    // Determine error source
    const source = this.determineErrorSource(error, errorCode)

    // Determine error severity
    const severity = this.determineErrorSeverity(error, errorCode, source)

    return {
      message: error.message,
      code: errorCode,
      severity,
      source,
      timestamp,
      stackTrace,
      context,
      moduleName,
      ...fileInfo,
    }
  }

  /**
   * Extracts file information from a stack trace
   */
  private extractFileInfo(stackTrace: string): {
    fileName?: string
    lineNumber?: number
    columnNumber?: number
    functionName?: string
  } {
    if (!stackTrace) {
      return {}
    }

    // Match the first stack frame that contains file information
    // Format: at FunctionName (/path/to/file.ts:line:column)
    const stackFrameRegex = /at\s+(?:(.+?)\s+$$)?(?:(.+?):(\d+):(\d+))$$?/
    const match = stackTrace
      .split("\n")
      .slice(1)
      .find((line) => stackFrameRegex.test(line))

    if (!match) {
      return {}
    }

    const matches = match.match(stackFrameRegex)
    if (!matches || matches.length < 5) {
      return {}
    }

    const [, functionName, fileName, lineStr, columnStr] = matches
    const lineNumber = Number.parseInt(lineStr, 10)
    const columnNumber = Number.parseInt(columnStr, 10)

    // Extract just the filename without the path
    const fileNameOnly = fileName ? fileName.split("/").pop() : undefined

    return {
      fileName: fileNameOnly,
      lineNumber: isNaN(lineNumber) ? undefined : lineNumber,
      columnNumber: isNaN(columnNumber) ? undefined : columnNumber,
      functionName: functionName || undefined,
    }
  }

  /**
   * Determines the source of an error
   */
  private determineErrorSource(error: Error, errorCode?: string): ErrorSource {
    // Check error code first
    if (errorCode) {
      if (errorCode.startsWith("API-")) {
        return ErrorSource.API
      } else if (errorCode.startsWith("AUTH-")) {
        return ErrorSource.AUTHENTICATION
      } else if (errorCode.startsWith("VAL-")) {
        return ErrorSource.VALIDATION
      } else if (errorCode.startsWith("STORE-") || errorCode.startsWith("CACHE-")) {
        return ErrorSource.DATABASE
      }
    }

    // Check error message
    const message = error.message.toLowerCase()
    if (
      message.includes("api") ||
      message.includes("endpoint") ||
      message.includes("request failed") ||
      message.includes("response")
    ) {
      return ErrorSource.API
    } else if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("fetch") ||
      message.includes("axios")
    ) {
      return ErrorSource.NETWORK
    } else if (
      message.includes("auth") ||
      message.includes("token") ||
      message.includes("credential") ||
      message.includes("permission") ||
      message.includes("unauthorized")
    ) {
      return ErrorSource.AUTHENTICATION
    } else if (
      message.includes("valid") ||
      message.includes("invalid") ||
      message.includes("required") ||
      message.includes("missing")
    ) {
      return ErrorSource.VALIDATION
    }

    return ErrorSource.UNKNOWN
  }

  /**
   * Determines the severity of an error
   */
  private determineErrorSeverity(error: Error, errorCode?: string, source?: ErrorSource): ErrorSeverity {
    // Critical errors
    if (
      error.message.includes("critical") ||
      error.message.includes("fatal") ||
      error.message.includes("crash") ||
      (errorCode && errorCode.includes("CRITICAL"))
    ) {
      return ErrorSeverity.CRITICAL
    }

    // High severity errors
    if (
      source === ErrorSource.AUTHENTICATION ||
      error.message.includes("security") ||
      error.message.includes("breach") ||
      error.message.includes("unauthorized") ||
      error.message.includes("forbidden") ||
      (errorCode && (errorCode === ErrorCodes.API.UNAUTHORIZED || errorCode === ErrorCodes.API.FORBIDDEN))
    ) {
      return ErrorSeverity.HIGH
    }

    // Medium severity errors
    if (
      source === ErrorSource.API ||
      source === ErrorSource.NETWORK ||
      error.message.includes("failed") ||
      error.message.includes("error") ||
      error.message.includes("exception") ||
      (errorCode &&
        (errorCode === ErrorCodes.API.REQUEST_FAILED ||
          errorCode === ErrorCodes.API.RESPONSE_INVALID ||
          errorCode === ErrorCodes.API.TIMEOUT))
    ) {
      return ErrorSeverity.MEDIUM
    }

    // Default to low severity
    return ErrorSeverity.LOW
  }
}
