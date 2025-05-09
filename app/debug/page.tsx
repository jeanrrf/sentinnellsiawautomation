"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw } from "lucide-react"

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchApiDebug = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/debug-shopee")
      const data = await response.json()

      setApiResponse(data)
    } catch (err: any) {
      setError(err.message || "Erro ao analisar a API da Shopee")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Debug da API da Shopee</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Analisar Resposta da API</CardTitle>
          <CardDescription>
            Clique no botão abaixo para analisar a resposta completa da API da Shopee e identificar os campos
            disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchApiDebug} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Analisar API da Shopee
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {apiResponse && (
        <Tabs defaultValue="fields" className="w-full">
          <TabsList>
            <TabsTrigger value="fields">Campos Disponíveis</TabsTrigger>
            <TabsTrigger value="sample">Produto de Exemplo</TabsTrigger>
            <TabsTrigger value="complete">Resposta Completa</TabsTrigger>
            <TabsTrigger value="schema">Esquema</TabsTrigger>
          </TabsList>

          <TabsContent value="fields">
            <Card>
              <CardHeader>
                <CardTitle>Campos Disponíveis no Produto</CardTitle>
                <CardDescription>
                  Lista de todos os campos disponíveis no objeto de produto retornado pela API.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiResponse.availableFields && apiResponse.availableFields.length > 0 ? (
                  <ul className="list-disc pl-6 space-y-2">
                    {apiResponse.availableFields.map((field: string) => (
                      <li key={field} className="font-mono">
                        {field}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum campo encontrado ou produto não disponível.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sample">
            <Card>
              <CardHeader>
                <CardTitle>Produto de Exemplo</CardTitle>
                <CardDescription>Dados completos de um produto de exemplo retornado pela API.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-xs">
                  {JSON.stringify(apiResponse.sampleProduct, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complete">
            <Card>
              <CardHeader>
                <CardTitle>Resposta Completa</CardTitle>
                <CardDescription>Resposta completa da API, incluindo todos os dados retornados.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-xs">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schema">
            <Card>
              <CardHeader>
                <CardTitle>Esquema da API</CardTitle>
                <CardDescription>Informações sobre o esquema GraphQL da API (se disponível).</CardDescription>
              </CardHeader>
              <CardContent>
                {apiResponse.schemaInfo ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-xs">
                    {JSON.stringify(apiResponse.schemaInfo, null, 2)}
                  </pre>
                ) : (
                  <p>Informações de esquema não disponíveis.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
