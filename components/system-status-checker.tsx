"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface SystemStatus {
  api: {
    status: boolean
    message?: string
  }
  database: {
    status: boolean
    message?: string
  }
  cache: {
    status: boolean
    message?: string
  }
}

export function SystemStatusChecker() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/system-check")

        // Verificar o tipo de conteúdo da resposta
        const contentType = response.headers.get("content-type")

        if (!response.ok) {
          throw new Error(`Falha ao verificar status do sistema: ${response.status} ${response.statusText}`)
        }

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Resposta inválida: API não retornou JSON")
        }

        const data = await response.json()

        setStatus({
          api: {
            status: data.api?.success ?? false,
            message: data.api?.message ?? "Sem informações disponíveis",
          },
          database: {
            status: data.database?.success ?? false,
            message: data.database?.message ?? "Sem informações disponíveis",
          },
          cache: {
            status: data.cache?.success ?? false,
            message: data.cache?.message ?? "Sem informações disponíveis",
          },
        })
      } catch (err: any) {
        setError(err.message || "Falha ao verificar status do sistema")
        console.error("Erro ao verificar status do sistema:", err)

        // Definir status padrão em caso de erro
        setStatus({
          api: {
            status: false,
            message: "Não foi possível verificar o status",
          },
          database: {
            status: false,
            message: "Não foi possível verificar o status",
          },
          cache: {
            status: false,
            message: "Não foi possível verificar o status",
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkSystemStatus()
  }, [])

  return (
    <div className="space-y-4">
      {error && (
        <Card>
          <CardContent className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">Erro: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-4 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        status && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Status da API</CardTitle>
                <CardDescription>Verifique se a API está funcionando corretamente</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {status.api.status ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <p className="text-sm">
                    {status.api.status ? "API funcionando corretamente" : `API com problemas: ${status.api.message}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Banco de Dados</CardTitle>
                <CardDescription>Verifique se a conexão com o banco de dados está ativa</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {status.database.status ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <p className="text-sm">
                    {status.database.status
                      ? "Banco de dados conectado"
                      : `Banco de dados com problemas: ${status.database.message}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Cache</CardTitle>
                <CardDescription>Verifique se o sistema de cache está operacional</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {status.cache.status ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <p className="text-sm">
                    {status.cache.status
                      ? "Cache funcionando corretamente"
                      : `Cache com problemas: ${status.cache.message}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  )
}
