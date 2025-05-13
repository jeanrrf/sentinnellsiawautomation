"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface ErrorDisplayStandardProps {
  onRetry?: () => void
  message?: string
}

export function ErrorDisplayStandard({
  onRetry,
  message = "Não foi possível carregar os dados",
}: ErrorDisplayStandardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative w-64 h-64 mb-6">
        <Image src="/error-message.png" alt="Erro ao carregar dados" fill className="object-contain" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Erro ao carregar dados</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
