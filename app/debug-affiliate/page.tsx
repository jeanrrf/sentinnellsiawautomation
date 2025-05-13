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
import {
  AlertCircle,
  Bug,
  CheckCircle,
  Copy,
  Download,
  ImageIcon,
  Info,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  XCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

export default function DebugAffiliatePage() {
  const { toast } = useToast()
  const [action, setAction] = useState("test")
  const [productId, setProductId] = useState("")
  const [keyword, setKeyword] = useState("")
  const [limit, setLimit] = useState("10")
  const [isLoading, setIsLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("result")
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let url = `/api/debug-affiliate-api?action=${action}`

      if (action === "product" || action === "media") {
        if (!productId) {
          toast({
            title: "ID do produto é obrigatório",
            description: `Para a ação "${action}", você precisa fornecer um ID de produto`,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        url += `&productId=${encodeURIComponent(productId)}`
      }

      if (action === "search" && keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`
      }

      if (["search", "bestsellers"].includes(action)) {
        url += `&limit=${encodeURIComponent(limit)}`
      }

      const response = await fetch(url)
      const data = await response.json()

      setDebugData(data)

      if (!data.success) {
        setError(data.message || "Erro desconhecido ao executar diagnóstico")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(`Erro ao executar diagnóstico: ${errorMessage}`)
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

  // Carregar teste básico ao iniciar
  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <div className="container py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Diagnóstico da API de Afiliados da Shopee
          </CardTitle>
          <CardDescription>Ferramenta para testar e depurar a API oficial de afiliados da Shopee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ação</label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Teste de Conectividade</SelectItem>
                    <SelectItem value="product">Detalhes do Produto</SelectItem>
                    <SelectItem value="media">Mídia do Produto</SelectItem>
                    <SelectItem value="search">Buscar Produtos</SelectItem>
                    <SelectItem value="bestsellers">Produtos Mais Vendidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(action === "product" || action === "media") && (
                <div>
                  <label className="text-sm font-medium mb-1 block">ID do Produto</label>
                  <Input placeholder="Ex: 12345678" value={productId} onChange={(e) => setProductId(e.target.value)} />
                </div>
              )}

              {action === "search" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Palavra-chave</label>
                  <Input placeholder="Ex: smartphone" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
              )}

              {(action === "search" || action === "bestsellers") && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Limite</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Número de resultados"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-end">
                <Button onClick={fetchDebugData} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Executar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && !debugData && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {debugData && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="result">Resultado</TabsTrigger>
                  <TabsTrigger value="env">Variáveis de Ambiente</TabsTrigger>
                  {action === "media" && <TabsTrigger value="images">Imagens</TabsTrigger>}
                  {(action === "search" || action === "bestsellers") && (
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="result">
                  <div className="space-y-4">
                    <Alert variant={debugData.success ? "default" : "destructive"}>
                      {debugData.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <AlertTitle>{debugData.success ? "Sucesso" : "Falha"}</AlertTitle>
                      <AlertDescription>{debugData.message}</AlertDescription>
                    </Alert>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between py-3">
                        <CardTitle className="text-base">Resultado da Operação</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(debugData.result || {}, null, 2))}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-xs">
                          {JSON.stringify(debugData.result || {}, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="env">
                  <Card>
                    <CardHeader>
                      <CardTitle>Variáveis de Ambiente</CardTitle>
                      <CardDescription>
                        Status das variáveis de ambiente necessárias para a API da Shopee
                      </CardDescription>
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

                {action === "media" && (
                  <TabsContent value="images">
                    <Card>
                      <CardHeader>
                        <CardTitle>Imagens do Produto</CardTitle>
                        <CardDescription>Visualização das imagens retornadas pela API</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {debugData.result?.images?.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {debugData.result.images.map((imageUrl: string, index: number) => (
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
                              Não foram encontradas imagens para este produto. Verifique se o ID do produto está correto
                              ou se a API está funcionando corretamente.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {(action === "search" || action === "bestsellers") && (
                  <TabsContent value="products">
                    <Card>
                      <CardHeader>
                        <CardTitle>Lista de Produtos</CardTitle>
                        <CardDescription>Produtos retornados pela API</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {Array.isArray(debugData.result) && debugData.result.length > 0 ? (
                          <div className="space-y-4">
                            {debugData.result.map((product: any, index: number) => (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex flex-col md:flex-row gap-4">
                                    <div className="w-full md:w-1/4">
                                      <div className="aspect-square relative rounded-md overflow-hidden">
                                        <Image
                                          src={product.imageUrl || "/placeholder.svg"}
                                          alt={product.productName || `Produto ${index + 1}`}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 768px) 100vw, 25vw"
                                        />
                                      </div>
                                    </div>
                                    <div className="w-full md:w-3/4 space-y-2">
                                      <h3 className="font-medium text-lg">{product.productName}</h3>
                                      <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <ShoppingBag className="h-3 w-3" />
                                          {product.sales || "0"} vendas
                                        </Badge>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Star className="h-3 w-3" />
                                          {product.ratingStar || "0"}
                                        </Badge>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          R$ {product.price}
                                        </Badge>
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setAction("media")
                                            setProductId(product.itemId)
                                            setActiveTab("result")
                                            fetchDebugData()
                                          }}
                                        >
                                          <ImageIcon className="mr-2 h-4 w-4" />
                                          Ver Imagens
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setAction("product")
                                            setProductId(product.itemId)
                                            setActiveTab("result")
                                            fetchDebugData()
                                          }}
                                        >
                                          <Info className="mr-2 h-4 w-4" />
                                          Detalhes
                                        </Button>
                                        {product.offerLink && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              window.open(product.offerLink, "_blank")
                                            }}
                                          >
                                            <Download className="mr-2 h-4 w-4" />
                                            Link de Afiliado
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Nenhum produto encontrado</AlertTitle>
                            <AlertDescription>
                              Não foram encontrados produtos para esta consulta. Tente modificar os parâmetros de busca.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Esta ferramenta é apenas para fins de diagnóstico e depuração.
          </p>
          <Button variant="outline" onClick={fetchDebugData} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
