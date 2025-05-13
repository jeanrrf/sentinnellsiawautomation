"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ApiErrorDisplayProps {
  message: string
  onRetry?: () => void
}

export function ApiErrorDisplay({ message, onRetry }: ApiErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Alert variant="destructive" className="mb-4 max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro na API</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      <img src="/error-message.png" alt="Erro na API" className="mb-4 max-w-xs rounded-lg shadow-md" />

      {onRetry && (
        <Button onClick={onRetry} className="mt-4">
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
