import type { LogLevel } from "@/lib/logger"

/**
 * Represents the severity of an error
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Represents the source of an error
 */
export enum ErrorSource {
  API = "api",
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  DATABASE = "database",
  UNKNOWN = "unknown",
}

/**
 * Represents a categorized error
 */
export interface CategorizedError {
  message: string
  code?: string
  severity: ErrorSeverity
  source: ErrorSource
  timestamp: string
  stackTrace?: string
  context?: Record<string, any>
  suggestedSolution?: string
  relatedErrors?: string[]
  moduleName: string
  fileName?: string
  lineNumber?: number
  columnNumber?: number
  functionName?: string
}

/**
 * Represents a solution for an error
 */
export interface ErrorSolution {
  errorPattern: RegExp | string
  solution: string
  documentationUrl?: string
  severity: ErrorSeverity
  source: ErrorSource
}

/**
 * Configuration for the advanced logger
 */
export interface AdvancedLoggerConfig {
  minLogLevel: LogLevel
  enableStackTraceAnalysis: boolean
  enableSolutionSuggestions: boolean
  enableErrorAggregation: boolean
  maxErrorsToStore: number
  moduleSpecificConfig?: Record<string, ModuleSpecificConfig>
}

/**
 * Module-specific configuration
 */
export interface ModuleSpecificConfig {
  minLogLevel?: LogLevel
  enableStackTraceAnalysis?: boolean
  enableSolutionSuggestions?: boolean
  errorPatterns?: Record<string, RegExp>
}

/**
 * Interface for error analyzers
 */
export interface ErrorAnalyzer {
  analyze(error: Error, context?: Record<string, any>): CategorizedError
}

/**
 * Interface for solution providers
 */
export interface SolutionProvider {
  findSolution(error: CategorizedError): Promise<string | null>
}

/**
 * Interface for error reporters
 */
export interface ErrorReporter {
  report(error: CategorizedError): Promise<void>
}
