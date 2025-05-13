import type { CategorizedError } from "./types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("error-aggregator")

/**
 * Aggregates similar errors to prevent log flooding
 */
export class ErrorAggregator {
  private errors: Map<string, AggregatedError> = new Map()
  private readonly maxErrors: number

  constructor(maxErrors = 100) {
    this.maxErrors = maxErrors
  }

  /**
   * Adds an error to the aggregator
   */
  addError(error: CategorizedError): void {
    const key = this.generateErrorKey(error)

    if (this.errors.has(key)) {
      const aggregatedError = this.errors.get(key)!
      aggregatedError.count++
      aggregatedError.lastOccurrence = error.timestamp

      // Update with the latest context if available
      if (error.context) {
        aggregatedError.latestContext = error.context
      }

      logger.debug(`Error aggregated (${aggregatedError.count}): ${error.message}`)
    } else {
      // If we've reached the maximum number of errors, remove the oldest one
      if (this.errors.size >= this.maxErrors) {
        const oldestKey = this.findOldestErrorKey()
        if (oldestKey) {
          this.errors.delete(oldestKey)
        }
      }

      this.errors.set(key, {
        error,
        count: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp,
        latestContext: error.context,
      })

      logger.debug(`New error added to aggregator: ${error.message}`)
    }
  }

  /**
   * Gets all aggregated errors
   */
  getAggregatedErrors(): AggregatedError[] {
    return Array.from(this.errors.values())
  }

  /**
   * Gets the count of a specific error
   */
  getErrorCount(error: CategorizedError): number {
    const key = this.generateErrorKey(error)
    return this.errors.has(key) ? this.errors.get(key)!.count : 0
  }

  /**
   * Clears all aggregated errors
   */
  clearErrors(): void {
    this.errors.clear()
    logger.info("Error aggregator cleared")
  }

  /**
   * Generates a key for an error
   */
  private generateErrorKey(error: CategorizedError): string {
    // Use a combination of source, code (if available), and message
    return `${error.source}:${error.code || ""}:${error.message}`
  }

  /**
   * Finds the key of the oldest error
   */
  private findOldestErrorKey(): string | null {
    if (this.errors.size === 0) {
      return null
    }

    let oldestKey: string | null = null
    let oldestTimestamp: string | null = null

    for (const [key, aggregatedError] of this.errors.entries()) {
      if (oldestTimestamp === null || aggregatedError.firstOccurrence < oldestTimestamp) {
        oldestKey = key
        oldestTimestamp = aggregatedError.firstOccurrence
      }
    }

    return oldestKey
  }
}

/**
 * Represents an aggregated error
 */
export interface AggregatedError {
  error: CategorizedError
  count: number
  firstOccurrence: string
  lastOccurrence: string
  latestContext?: Record<string, any>
}
