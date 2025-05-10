"use client"

import { createContext, useContext, useState, type ReactNode, useCallback } from "react"
import { type AppError, handleError } from "@/lib/error-handling"
import { ErrorBoundary } from "@/components/error-boundary"

interface ErrorContextType {
  lastError: AppError | null
  setError: (error: AppError) => void
  clearError: () => void
  captureError: (error: unknown, context?: Record<string, any>) => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [lastError, setLastError] = useState<AppError | null>(null)

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  const captureError = useCallback((error: unknown, context?: Record<string, any>) => {
    const appError = handleError(error, context)
    setLastError(appError)
    return appError
  }, [])

  const value = {
    lastError,
    setError: setLastError,
    clearError,
    captureError,
  }

  return (
    <ErrorContext.Provider value={value}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ErrorContext.Provider>
  )
}

export function useErrorContext() {
  const context = useContext(ErrorContext)

  if (context === undefined) {
    throw new Error("useErrorContext must be used within an ErrorProvider")
  }

  return context
}
