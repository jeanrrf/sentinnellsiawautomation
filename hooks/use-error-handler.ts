"use client"

import { useCallback } from "react"
import { type AppError, type ErrorType, createAppError, handleError } from "@/lib/error-handling"

export function useErrorHandler() {
  // Função para lidar com erros em componentes
  const catchError = useCallback((error: unknown, context?: Record<string, any>): AppError => {
    return handleError(error, context)
  }, [])

  // Função para envolver funções assíncronas com tratamento de erros
  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>, errorContext?: Record<string, any>) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          return await fn(...args)
        } catch (error) {
          handleError(error, {
            functionName: fn.name,
            arguments: args,
            ...errorContext,
          })
          return undefined
        }
      }
    },
    [],
  )

  // Função para criar um erro específico
  const createError = useCallback(
    (
      type: ErrorType,
      message: string,
      options?: {
        code?: string
        details?: any
        context?: Record<string, any>
      },
    ): AppError => {
      return createAppError(type, message, options)
    },
    [],
  )

  return {
    catchError,
    withErrorHandling,
    createError,
  }
}
