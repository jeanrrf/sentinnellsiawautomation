"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Info, ExternalLink } from "lucide-react"

export default function GeminiTestPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkGeminiStatus() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/gemini-status")
      const data = await response.json()

      if (data.success) {
        setStatus(data)
      } else {
        setError(data.error || "Erro desconhecido ao verificar status da API Gemini")
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o endpoint de status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkGeminiStatus()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico da API Gemini</h1>

      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Informação sobre o Gemini Flash</AlertTitle>
        <AlertDescription className="text-blue-700">
          <p className="mb-2">
            Esta aplicação utiliza o modelo gratuito <strong>gemini-2.0-flash</strong> para geração de conteúdo,
            conforme a documentação oficial.
          </p>
          <div className="flex items-center mt-2">
            <a
              href="https://ai.google.dev/gemini-api/docs/text-generation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              Ver documentação oficial <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status da API Gemini</CardTitle>
          <CardDescription>Verifica se a API Gemini está configurada e funcionando corretamente</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : status ? (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">API Key:</p>
                <p>{status.apiKeyPrefix}</p>
              </div>

              <div>
                <p className="font-semibold">Status da API:</p>
                <div className="flex items-center gap-2 mt-1">
                  {status.status.working ? (
                    <>
                      <Badge className="bg-green-500">Funcionando</Badge>
                      <span>
                        Versão: {status.status.workingConfig?.version}, Modelo: {status.status.workingConfig?.model}
                      </span>
                      {status.status.workingConfig?.model.includes("flash") && (
                        <Badge className="bg-blue-500">Gratuito</Badge>
                      )}
                    </>
                  ) : (
                    <Badge className="bg-red-500">Não funcionando</Badge>
                  )}
                </div>
                {status.status.error && <p className="text-red-500 mt-1">{status.status.error}</p>}
              </div>

              {status.models && status.models.success && (
                <div>
                  <p className="font-semibold">Modelos disponíveis:</p>
                  <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded text-sm">
                    {status.models.data.models && status.models.data.models.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {status.models.data.models.map((model: any, index: number) => (
                          <li key={index} className="mb-1">
                            <strong>{model.name.split("/").pop()}</strong>
                            {model.name.includes("flash") && <Badge className="ml-2 bg-blue-500">Gratuito</Badge>}
                            {model.name.includes("gemini-2.0-flash") && (
                              <Badge className="ml-2 bg-green-500">Recomendado</Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhum modelo disponível</p>
                    )}
                  </div>
                </div>
              )}

              {status.testGeneration && (
                <div>
                  <p className="font-semibold">Teste de geração:</p>
                  {status.testGeneration.success ? (
                    <div className="mt-1">
                      <Badge className="bg-green-500 mb-2">Sucesso</Badge>
                      <div className="bg-gray-100 p-3 rounded">
                        <p>{status.testGeneration.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <Badge className="bg-red-500 mb-2">Falha</Badge>
                      <p className="text-red-500">{status.testGeneration.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p>Nenhum resultado disponível.</p>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={checkGeminiStatus} disabled={loading}>
            {loading ? "Verificando..." : "Verificar Status"}
          </Button>
        </CardFooter>
      </Card>

      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Solução de problemas</AlertTitle>
        <AlertDescription className="text-amber-700">
          <p className="mb-2">Se a API Gemini não estiver funcionando, verifique:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Se a chave da API está correta e ativa</li>
            <li>Se a conta tem acesso ao modelo Gemini Flash (gratuito)</li>
            <li>Se o modelo está disponível na sua região</li>
            <li>Se há cotas ou limites de uso excedidos</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Alert className={status?.status?.working ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
        {status?.status?.working ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">API Gemini está funcionando</AlertTitle>
            <AlertDescription className="text-green-700">
              A API Gemini está configurada corretamente e funcionando com o modelo {status.status.workingConfig?.model}{" "}
              na versão {status.status.workingConfig?.version}. Você pode usar a funcionalidade de geração de descrições
              sem problemas.
            </AlertDescription>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">API Gemini não está funcionando</AlertTitle>
            <AlertDescription className="text-amber-700">
              A API Gemini não está funcionando corretamente. O sistema usará descrições geradas localmente como
              fallback até que o problema seja resolvido. Verifique a chave da API e as permissões da sua conta.
            </AlertDescription>
          </>
        )}
      </Alert>
    </div>
  )
}
