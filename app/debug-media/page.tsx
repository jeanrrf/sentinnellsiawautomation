"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Bug, CheckCircle, Copy, Info, RefreshCw, Search, XCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function DebugMediaPage() {
  const { toast } = useToast()
  const [productId, setProductId] = useState("20099307932") // ID padrão para teste
  const [shopId, setShopId] = useState("") // ID da loja (opcional)
  const [useWebApi, setUseWebApi] = useState(true) // Usar API não oficial por padrão
  const [isLoading, setIsLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async (id: string, shopId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      let url = `/api/debug-product-media?productId=${encodeURIComponent(id)}`

      if (shopId && useWebApi) {
        url += `&shopId=${encodeURIComponent(shopId)}`
      }

      url += `&webApi=${useWebApi}`

      const response = await fetch(url)
      const data = await response.json()

      setDebugData(data)

      if (!data.success) {
        setError(data.message || "Erro desconhecido ao buscar dados de depuração")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(`Erro ao buscar dados de depuração: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRawApiResponse = async (id: string, shopId?: string) => {
    setIsLoading(true)

    try {
      let url = `/api/debug-product-media?productId=${encodeURIComponent(id)}&raw=true`

      if (shopId && useWebApi) {
        url += `&shopId=${encodeURIComponent(shopId)}`
      }

      url += `&webApi=${useWebApi}`

      const response = await fetch(url)
      const data = await response.json()

      // Atualizar apenas a parte da resposta bruta da API
      setDebugData((prev) => ({
        ...prev,
        rawApiResponse: data,
      }))
    } catch (err) {
      toast({
        title: "Erro",
        description: `Erro ao buscar resposta bruta da API: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    })
  }

  const handleSearch = () => {
    if (!productId.trim()) {
      toast({
        title: "ID do produto é obrigatório",
        description: "Por favor, insira um ID de produto válido",
        variant: "destructive",
      })
      return
    }

    if (useWebApi && !shopId.trim()) {
      toast({
        title: "ID da loja é obrigatório",
        description: "Para usar a API não oficial, o ID da loja é obrigatório",
        variant: "destructive",
      })
      return
    }

    fetchDebugData(productId, shopId)
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (productId) {
      // Só carrega automaticamente se não precisar de shopId ou se shopId estiver preenchido
      if (!useWebApi || (useWebApi && shopId)) {
        fetchDebugData(productId, shopId)
      }
    }
  }, [])

  return (
    <div className="container py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Diagnóstico de Mídia de Produtos
          </CardTitle>
          <CardDescription>Ferramenta para testar e depurar a API de mídia de produtos da Shopee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="api-toggle" checked={useWebApi} onCheckedChange={setUseWebApi} />
              <Label htmlFor="api-toggle">
                {useWebApi ? "Usar API não oficial (Web API)" : "Usar API oficial (Affiliate API)"}
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="ID do produto"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="max-w-xs"
              />

              {useWebApi && (
                <Input
                  placeholder="ID da loja (obrigatório para API não oficial)"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="max-w-xs"
                />
              )}

              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && !debugData && (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {debugData && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="env">Variáveis de Ambiente</TabsTrigger>
                <TabsTrigger value="api">Resposta da API</TabsTrigger>
                <TabsTrigger value="processed">Dados Processados</TabsTrigger>
                <TabsTrigger value="images">Imagens</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-4">
                  <Alert variant={debugData.success ? "default" : "destructive"}>
                    {debugData.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle>{debugData.success ? "Sucesso" : "Falha"}</AlertTitle>
                    <AlertDescription>
                      {debugData.success
                        ? `A API de mídia de produtos está funcionando corretamente (${debugData.apiType})`
                        : debugData.message || "A API de mídia de produtos não está funcionando corretamente"}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Status da API</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {debugData.apiResponse ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">API:</span>
                              <Badge variant="outline">{debugData.apiType}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Status:</span>
                              <Badge variant={debugData.apiResponse.success ? "success" : "destructive"}>
                                {debugData.apiResponse.statusCode} {debugData.apiResponse.statusText}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Fallback usado:</span>
                              <Badge variant={debugData.fallbackUsed ? "warning" : "success"}>
                                {debugData.fallbackUsed ? "Sim" : "Não"}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p>Dados da API não disponíveis</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Dados do Produto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {debugData.processedData ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">ID do Produto:</span>
                              <span>{debugData.processedData.productId}</span>
                            </div>
                            {debugData.processedData.shopId && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">ID da Loja:</span>
                                <span>{debugData.processedData.shopId}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Nome:</span>
                              <span className="truncate max-w-[200px]">{debugData.processedData.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Imagens:</span>
                              <Badge>{debugData.processedData.images?.length || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Vídeos:</span>
                              <Badge>{debugData.processedData.videos?.length || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Fonte:</span>
                              <Badge variant="outline">{debugData.processedData.source}</Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p>Dados do produto não disponíveis</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="env">
                <Card>
                  <CardHeader>
                    <CardTitle>Variáveis de Ambiente</CardTitle>
                    <CardDescription>Status das variáveis de ambiente necessárias para a API da Shopee</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debugData.envCheck ? (
                      <div className="space-y-2">
                        {Object.entries(debugData.envCheck).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-2 border-b">
                            <span className="font-mono text-sm">{key}</span>
                            <Badge
                              variant={
                                value === "✅ Configurado"
                                  ? "success"
                                  : value === "❌ Não configurado"
                                    ? "destructive"
                                    : "outline"
                              }
                            >
                              {value}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Dados de variáveis de ambiente não disponíveis</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Resposta Bruta da API</CardTitle>
                      <CardDescription>Resposta JSON bruta retornada pela API da Shopee</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRawApiResponse(productId, shopId)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(debugData.rawApiResponse || debugData.apiResponse?.parsed || {}, null, 2),
                          )
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-xs">
                      {JSON.stringify(debugData.rawApiResponse || debugData.apiResponse?.parsed || {}, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="processed">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Dados Processados</CardTitle>
                      <CardDescription>Dados processados pelo serviço após a chamada à API</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(debugData.processedData || {}, null, 2))}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-xs">
                      {JSON.stringify(debugData.processedData || {}, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle>Imagens do Produto</CardTitle>
                    <CardDescription>Visualização das imagens retornadas pela API</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debugData.processedData?.images?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {debugData.processedData.images.map((imageUrl: string, index: number) => (
                          <div key={index} className="border rounded-md overflow-hidden">
                            <div className="aspect-square relative">
                              <Image
                                src={imageUrl || "/placeholder.svg"}
                                alt={`Imagem ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                            <div className="p-2 bg-muted flex items-center justify-between">
                              <Badge variant="outline">Imagem {index + 1}</Badge>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(imageUrl)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Nenhuma imagem encontrada</AlertTitle>
                        <AlertDescription>
                          Não foram encontradas imagens para este produto. Verifique se o ID do produto está correto ou
                          se a API está funcionando corretamente.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Esta ferramenta é apenas para fins de diagnóstico e depuração.
          </p>
          <Button variant="outline" onClick={() => fetchDebugData(productId, shopId)} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
