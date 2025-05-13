"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function DebugGeminiPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [testDescription, setTestDescription] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  async function testGeminiAPI() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug-gemini")
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || "Erro desconhecido ao testar a API Gemini")
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o endpoint de diagnóstico")
    } finally {
      setLoading(false)
    }
  }

  async function testDescriptionGeneration() {
    setTestLoading(true)

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: {
            productName: "Smartphone Samsung Galaxy A54 5G 128GB 8GB RAM",
            price: "1799.99",
            priceDiscountRate: "15",
            sales: "5432",
            ratingStar: "4.8",
            shopName: "Samsung Official Store",
            itemId: "test-123",
          },
        }),
      })

      const data = await response.json()
      setTestDescription(data)
    } catch (err: any) {
      setTestDescription({
        success: false,
        error: err.message || "Erro ao testar geração de descrição",
      })
    } finally {
      setTestLoading(false)
    }
  }

  useEffect(() => {
    // Carregar resultados automaticamente na primeira renderização
    testGeminiAPI()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico da API Gemini</h1>

      <Tabs defaultValue="api-test">
        <TabsList className="mb-4">
          <TabsTrigger value="api-test">Teste de API</TabsTrigger>
          <TabsTrigger value="description-test">Teste de Descrição</TabsTrigger>
        </TabsList>

        <TabsContent value="api-test">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Conectividade da API Gemini</CardTitle>
              <CardDescription>Verifica se a API Gemini está acessível e configurada corretamente</CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p className="font-bold">Erro</p>
                  <p>{error}</p>
                </div>
              ) : results ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">API Key:</p>
                    <p>{results.apiKeyPrefix}</p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Resultados dos testes:</p>
                    <Accordion type="single" collapsible className="w-full">
                      {results.results.map((result: any, index: number) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="flex items-center">
                            <span className="flex-1">{result.endpoint}</span>
                            <Badge className={result.success ? "bg-green-500" : "bg-red-500"}>
                              {result.success ? "Sucesso" : "Falha"}
                            </Badge>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 p-2 bg-gray-50 rounded">
                              <p>
                                <span className="font-semibold">Status:</span> {result.status} {result.statusText}
                              </p>
                              {result.error && (
                                <p>
                                  <span className="font-semibold">Erro:</span> {result.error}
                                </p>
                              )}
                              <p className="font-semibold">Resposta:</p>
                              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              ) : (
                <p>Nenhum resultado disponível. Clique em "Testar API" para iniciar o diagnóstico.</p>
              )}
            </CardContent>

            <CardFooter>
              <Button onClick={testGeminiAPI} disabled={loading}>
                {loading ? "Testando..." : "Testar API"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="description-test">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Geração de Descriç��o</CardTitle>
              <CardDescription>Testa a geração de descrição com um produto de exemplo</CardDescription>
            </CardHeader>

            <CardContent>
              {testLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : testDescription ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Status:</p>
                    <Badge className={testDescription.success ? "bg-green-500" : "bg-red-500"}>
                      {testDescription.success ? "Sucesso" : "Falha"}
                    </Badge>
                  </div>

                  {testDescription.source && (
                    <div>
                      <p className="font-semibold">Fonte:</p>
                      <Badge variant="outline">{testDescription.source}</Badge>
                    </div>
                  )}

                  {testDescription.warning && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                      <p>{testDescription.warning}</p>
                    </div>
                  )}

                  {testDescription.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      <p>{testDescription.error}</p>
                    </div>
                  )}

                  {testDescription.description && (
                    <div>
                      <p className="font-semibold">Descrição gerada:</p>
                      <div className="bg-gray-100 p-4 rounded whitespace-pre-line">{testDescription.description}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p>Clique em "Testar Geração" para gerar uma descrição de exemplo.</p>
              )}
            </CardContent>

            <CardFooter>
              <Button onClick={testDescriptionGeneration} disabled={testLoading}>
                {testLoading ? "Gerando..." : "Testar Geração"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
