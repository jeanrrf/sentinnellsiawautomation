"use client"

import { useState } from "react"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { ErrorType } from "@/lib/error-handling"
import { Button } from "@/components/ui/button"
import { ErrorDisplay } from "@/components/error-display"
import { useErrorContext } from "@/components/error-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ErrorHandlingExample() {
  const { withErrorHandling, createError, catchError } = useErrorHandler()
  const { lastError, clearError } = useErrorContext()
  const [localError, setLocalError] = useState<any>(null)

  // Exemplo de função que pode lançar um erro
  const fetchDataWithError = async () => {
    throw new Error("Falha ao buscar dados do servidor")
  }

  // Envolvendo a função com tratamento de erros
  const safeFetchData = withErrorHandling(fetchDataWithError, {
    component: "ErrorHandlingExample",
    action: "fetchData",
  })

  // Exemplo de criação de erro específico
  const handleValidationError = () => {
    try {
      // Simulando uma validação que falha
      const value = ""
      if (!value) {
        throw createError(ErrorType.VALIDATION, "O campo é obrigatório", {
          code: "REQUIRED_FIELD",
          details: { field: "nome" },
        })
      }
    } catch (error) {
      catchError(error, { component: "ErrorHandlingExample" })
      setLocalError(error)
    }
  }

  // Exemplo de erro de API
  const simulateApiError = async () => {
    try {
      const response = await fetch("/api/non-existent-endpoint")
      if (!response.ok) {
        throw createError(ErrorType.API_RESPONSE, "Falha ao comunicar com o servidor", {
          code: response.status.toString(),
          details: { status: response.status, statusText: response.statusText },
        })
      }
    } catch (error) {
      catchError(error, { component: "ErrorHandlingExample" })
      setLocalError(error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplo de Tratamento de Erros</CardTitle>
        <CardDescription>Demonstração do sistema centralizado de tratamento de erros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => safeFetchData()}>Simular Erro de Fetch</Button>
          <Button onClick={handleValidationError}>Simular Erro de Validação</Button>
          <Button onClick={simulateApiError}>Simular Erro de API</Button>
          <Button
            variant="outline"
            onClick={() => {
              clearError()
              setLocalError(null)
            }}
          >
            Limpar Erros
          </Button>
        </div>

        {localError && <ErrorDisplay error={localError} onRetry={() => setLocalError(null)} showDetails={true} />}

        {lastError && !localError && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Último erro global:</h3>
            <ErrorDisplay error={lastError} onRetry={clearError} showDetails={true} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
