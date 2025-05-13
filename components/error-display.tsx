"use client"

import { type AppError, ErrorType } from "@/lib/error-handling"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorDisplayProps {
  error: AppError
  onRetry?: () => void
  showDetails?: boolean
}

export function ErrorDisplay({ error, onRetry, showDetails = false }: ErrorDisplayProps) {
  // Ícones específicos para diferentes tipos de erro
  const getIcon = () => {
    return <AlertCircle className="h-4 w-4" />
  }

  // Títulos específicos para diferentes tipos de erro
  const getTitle = () => {
    const titles: Record<ErrorType, string> = {
      [ErrorType.API_REQUEST]: "Erro de Comunicação",
      [ErrorType.API_RESPONSE]: "Erro de Resposta",
      [ErrorType.AUTHENTICATION]: "Erro de Autenticação",
      [ErrorType.AUTHORIZATION]: "Acesso Negado",
      [ErrorType.VALIDATION]: "Dados Inválidos",
      [ErrorType.VIDEO_GENERATION]: "Erro na Geração de Vídeo",
      [ErrorType.VIDEO_PROCESSING]: "Erro no Processamento de Vídeo",
      [ErrorType.STORAGE]: "Erro de Armazenamento",
      [ErrorType.CACHE]: "Erro de Cache",
      [ErrorType.NETWORK]: "Erro de Rede",
      [ErrorType.SHOPEE_API]: "Erro na API da Shopee",
      [ErrorType.BLOB_STORAGE]: "Erro no Armazenamento de Arquivos",
      [ErrorType.UNEXPECTED]: "Erro Inesperado",
      [ErrorType.USER_INPUT]: "Entrada Inválida",
    }

    return titles[error.type] || "Erro"
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <AlertTitle>{getTitle()}</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>

            {showDetails && error.details && (
              <div className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-32">
                <pre>{JSON.stringify(error.details, null, 2)}</pre>
              </div>
            )}

            {error.code && <p className="text-xs mt-1">Código: {error.code}</p>}

            {onRetry && (
              <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar novamente
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
