"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Download,
  Sparkles,
  TrendingUp,
  PercentIcon,
  Star,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Info,
  AlertTriangle,
  Copy,
  Eye,
  FileText,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateCardsForProduct, cleanupCardResources, type CardGenerationResult } from "@/lib/card-generation-service"
import { downloadFile, downloadTextFile, downloadMultipleFiles } from "@/lib/download-utils"

// Tipos de busca avançada
const SEARCH_TYPES = [
  {
    id: "best_sellers",
    title: "Mais Vendidos",
    description: "Produtos com maior volume de vendas",
    icon: <TrendingUp className="h-5 w-5" />,
    params: { sortType: 2, limit: 50 }, // Aumentamos o limite para filtrar depois
    metricInfo: "Ordenado por número total de vendas (maior para menor)",
  },
  {
    id: "biggest_discounts",
    title: "Maiores Descontos",
    description: "Produtos com os maiores percentuais de desconto",
    icon: <PercentIcon className="h-5 w-5" />,
    params: { sortType: 4, limit: 50, minDiscountRate: 30 }, // Aumentamos o limite
    metricInfo: "Ordenado por percentual de desconto (maior para menor), mínimo de 30% OFF",
  },
  {
    id: "best_rated",
    title: "Melhor Avaliados",
    description: "Produtos com as melhores avaliações dos clientes",
    icon: <Star className="h-5 w-5" />,
    params: { sortType: 1, limit: 50, minRating: 4.5 }, // Aumentamos o limite
    metricInfo: "Ordenado por avaliação (maior para menor), mínimo de 4.5 estrelas",
  },
  {
    id: "best_price",
    title: "Melhor Custo-Benefício",
    description: "Produtos com melhor relação qualidade/preço",
    icon: <DollarSign className="h-5 w-5" />,
    params: { sortType: 3, limit: 50, maxPrice: 100 }, // Aumentamos o limite
    metricInfo: "Calculado pela fórmula: (avaliação × vendas) ÷ preço",
  },
  {
    id: "trending",
    title: "Em Alta",
    description: "Produtos que estão em tendência de crescimento",
    icon: <ShoppingCart className="h-5 w-5" />,
    params: { sortType: 1, limit: 50, trending: true },
    metricInfo: "Combinação de vendas recentes, avaliações e popularidade",
  },
]

export function AISearchCards() {
  const { toast } = useToast()
  const [selectedSearchType, setSelectedSearchType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [error, setError] = useState("")
  const [generatingCard, setGeneratingCard] = useState<string | null>(null)
  const [generatedCards, setGeneratedCards] = useState<Record<string, CardGenerationResult>>({})
  const [rawResults, setRawResults] = useState<any[]>([])
  const [showMetrics, setShowMetrics] = useState(false)
  const [minSales, setMinSales] = useState<number | null>(null)
  const [resultsLimit, setResultsLimit] = useState(5)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [activeTemplate, setActiveTemplate] = useState("style1")
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingType, setDownloadingType] = useState<string | null>(null)

  // Função para buscar produtos com base no tipo de busca selecionado
  const fetchProductsByType = async (searchTypeId: string) => {
    try {
      setIsLoading(true)
      setError("")
      setProducts([])
      setFilteredProducts([])
      setRawResults([])

      const searchType = SEARCH_TYPES.find((type) => type.id === searchTypeId)
      if (!searchType) {
        throw new Error("Tipo de busca inválido")
      }

      // Adicionar um parâmetro de timestamp para evitar cache do navegador
      const timestamp = Date.now()
      const response = await fetch(`/api/fetch-shopee?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchType.params),
      })

      if (!response.ok) {
        throw new Error(`Falha ao buscar produtos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Falha ao buscar produtos")
      }

      // Guardar os resultados brutos para análise
      const rawProductData = data.products || []
      setRawResults(rawProductData)

      // Processar os produtos de acordo com o tipo de busca
      let processedProducts = [...rawProductData]

      // Aplicar filtros adicionais com base no tipo de busca
      if (searchTypeId === "best_sellers") {
        // Ordenar por número de vendas (do maior para o menor)
        processedProducts = processedProducts
          .filter((p) => p.sales !== undefined && p.sales !== null)
          .sort((a, b) => {
            const salesA = Number.parseInt(a.sales) || 0
            const salesB = Number.parseInt(b.sales) || 0
            return salesB - salesA
          })

        // Encontrar o valor mínimo de vendas para sugestão
        if (processedProducts.length > 0) {
          const salesValues = processedProducts.map((p) => Number.parseInt(p.sales) || 0)
          const maxSales = Math.max(...salesValues)
          // Sugerir um valor mínimo que seja 10% do máximo de vendas
          setMinSales(Math.floor(maxSales * 0.1))
        }
      } else if (searchTypeId === "biggest_discounts") {
        // Ordenar por maior desconto
        processedProducts = processedProducts
          .filter((p) => p.priceDiscountRate && Number.parseFloat(p.priceDiscountRate) >= 30)
          .sort((a, b) => Number.parseFloat(b.priceDiscountRate) - Number.parseFloat(a.priceDiscountRate))
      } else if (searchTypeId === "best_rated") {
        // Ordenar por melhor avaliação
        processedProducts = processedProducts
          .filter((p) => p.ratingStar && Number.parseFloat(p.ratingStar) >= 4.5)
          .sort((a, b) => Number.parseFloat(b.ratingStar) - Number.parseFloat(a.ratingStar))
      } else if (searchTypeId === "best_price") {
        // Ordenar por melhor custo-benefício (avaliação × vendas ÷ preço)
        processedProducts = processedProducts
          .filter(
            (p) =>
              p.price && Number.parseFloat(p.price) <= 100 && p.ratingStar && Number.parseFloat(p.ratingStar) >= 4.0,
          )
          .sort((a, b) => {
            // Fórmula de custo-benefício: (avaliação × vendas) ÷ preço
            const salesA = Number.parseInt(a.sales) || 1
            const salesB = Number.parseInt(b.sales) || 1
            const valueA = (Number.parseFloat(a.ratingStar) * salesA) / Number.parseFloat(a.price)
            const valueB = (Number.parseFloat(b.ratingStar) * salesB) / Number.parseFloat(b.price)
            return valueB - valueA
          })
      } else if (searchTypeId === "trending") {
        // Produtos em alta - combinação de vendas recentes e avaliações
        processedProducts = processedProducts
          .filter(
            (p) => p.sales && Number.parseInt(p.sales) > 0 && p.ratingStar && Number.parseFloat(p.ratingStar) >= 4.0,
          )
          .sort((a, b) => {
            const scoreA = Number.parseInt(a.sales) * Number.parseFloat(a.ratingStar)
            const scoreB = Number.parseInt(b.sales) * Number.parseFloat(b.ratingStar)
            return scoreB - scoreA
          })
      }

      setProducts(processedProducts)

      // Aplicar o limite padrão
      setFilteredProducts(processedProducts.slice(0, resultsLimit))

      toast({
        title: "Produtos encontrados",
        description: `${processedProducts.length} produtos encontrados para ${searchType.title}`,
      })
    } catch (err: any) {
      console.error("Erro ao buscar produtos:", err)
      setError(err.message || "Erro ao buscar produtos")
      toast({
        title: "Erro ao buscar produtos",
        description: err.message || "Não foi possível buscar os produtos. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para aplicar filtros adicionais
  const applyFilters = () => {
    if (!selectedSearchType || products.length === 0) return

    let filtered = [...products]

    // Aplicar filtro de vendas mínimas se estiver definido
    if (selectedSearchType === "best_sellers" && minSales !== null) {
      filtered = filtered.filter((p) => {
        const sales = Number.parseInt(p.sales) || 0
        return sales >= minSales
      })
    }

    // Aplicar limite de resultados
    setFilteredProducts(filtered.slice(0, resultsLimit))
  }

  // Função para gerar card para um produto
  const generateCard = async (productId: string) => {
    try {
      setGeneratingCard(productId)

      const product = filteredProducts.find((p) => p.itemId === productId)
      if (!product) {
        throw new Error("Produto não encontrado")
      }

      // Verificar se o produto tem informações de frete
      // Se não tiver, tentar inferir com base no nome ou preço
      if (product.freeShipping === undefined) {
        if (
          product.productName.toLowerCase().includes("frete grátis") ||
          (product.priceDiscountRate && Number.parseInt(product.priceDiscountRate) > 50)
        ) {
          product.freeShipping = true
        }
      }

      // Usar o serviço centralizado para gerar os cards com as novas configurações
      const result = await generateCardsForProduct(product, {
        useAI: true,
        template1: "modern",
        template2: "bold",
        includeSecondVariation: true,
      })

      if (!result.success) {
        throw new Error(result.error || "Falha ao gerar cards")
      }

      // Salvar os dados gerados
      setGeneratedCards((prev) => ({
        ...prev,
        [productId]: result,
      }))

      toast({
        title: "Card gerado com sucesso",
        description: "O card e a descrição foram gerados com sucesso.",
      })
    } catch (err: any) {
      console.error("Erro ao gerar card:", err)
      toast({
        title: "Erro ao gerar card",
        description: err.message || "Não foi possível gerar o card. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setGeneratingCard(null)
    }
  }

  // Função para baixar o card e a descrição
  const handleDownload = async (productId: string, type: string, variation = 1) => {
    try {
      setIsDownloading(true)
      setDownloadingType(type)

      const cardResult = generatedCards[productId]
      if (!cardResult) {
        throw new Error("Card não encontrado")
      }

      const product = cardResult.product
      if (!product) {
        throw new Error("Dados do produto não encontrados")
      }

      const productName = product.productName.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_")
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filePrefix = `tiktok_${productName}_${timestamp}`

      const description = cardResult.description || ""
      const affiliateLink = product.offerLink || ""

      switch (type) {
        case "png":
          if (variation === 1 && cardResult.pngUrl) {
            await downloadFile(cardResult.pngUrl, `${filePrefix}_1.png`)
          } else if (variation === 2 && cardResult.pngUrl2) {
            await downloadFile(cardResult.pngUrl2, `${filePrefix}_2.png`)
          }
          break
        case "jpeg":
          if (variation === 1 && cardResult.jpegUrl) {
            await downloadFile(cardResult.jpegUrl, `${filePrefix}_1.jpg`)
          } else if (variation === 2 && cardResult.jpegUrl2) {
            await downloadFile(cardResult.jpegUrl2, `${filePrefix}_2.jpg`)
          }
          break
        case "description":
          // Prepare text content with description and affiliate link
          const textContent = `${description}\n\n📲 LINK: ${affiliateLink}`
          await downloadTextFile(textContent, `${filePrefix}_description.txt`)
          break
        case "all":
          // Download all files as a package
          const files = []

          if (cardResult.pngUrl) {
            files.push({ url: cardResult.pngUrl, filename: `${filePrefix}_1.png` })
          }

          if (cardResult.jpegUrl) {
            files.push({ url: cardResult.jpegUrl, filename: `${filePrefix}_1.jpg` })
          }

          if (cardResult.pngUrl2) {
            files.push({ url: cardResult.pngUrl2, filename: `${filePrefix}_2.png` })
          }

          if (cardResult.jpegUrl2) {
            files.push({ url: cardResult.jpegUrl2, filename: `${filePrefix}_2.jpg` })
          }

          files.push({
            url: URL.createObjectURL(new Blob([`${description}\n\n📲 LINK: ${affiliateLink}`], { type: "text/plain" })),
            filename: `${filePrefix}_description.txt`,
          })

          await downloadMultipleFiles(files)

          // Clean up text URL
          URL.revokeObjectURL(files[files.length - 1].url)
          break
      }

      toast({
        title: "Download concluído",
        description: `Arquivo${type === "all" ? "s" : ""} baixado${type === "all" ? "s" : ""} com sucesso`,
      })
    } catch (err: any) {
      console.error("Erro ao baixar card:", err)
      toast({
        title: "Erro ao baixar card",
        description: err.message || "Não foi possível baixar o card. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
      setDownloadingType(null)
    }
  }

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopySuccess(type)
      setTimeout(() => setCopySuccess(null), 2000)

      toast({
        title: "Copiado!",
        description: "Conteúdo copiado para a área de transferência",
      })
    } catch (err) {
      console.error("Falha ao copiar: ", err)

      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência",
      })
    }
  }

  // Efeito para buscar produtos quando o tipo de busca é selecionado
  useEffect(() => {
    if (selectedSearchType) {
      fetchProductsByType(selectedSearchType)
    }

    // Limpar recursos ao desmontar o componente
    return () => {
      Object.values(generatedCards).forEach((card) => {
        if (card) {
          cleanupCardResources(card)
        }
      })
    }
  }, [selectedSearchType])

  // Efeito para aplicar filtros quando os critérios mudam
  useEffect(() => {
    applyFilters()
  }, [minSales, resultsLimit, products])

  // Função para visualizar um produto
  const viewProduct = (product: any) => {
    setSelectedProduct(product)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {SEARCH_TYPES.map((searchType) => (
          <Card
            key={searchType.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSearchType === searchType.id ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => setSelectedSearchType(searchType.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-md">{searchType.icon}</div>
                {selectedSearchType === searchType.id && (
                  <Badge variant="outline" className="bg-primary/10">
                    Selecionado
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-2">{searchType.title}</CardTitle>
              <CardDescription>{searchType.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Buscando produtos...</p>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao buscar produtos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedSearchType && fetchProductsByType(selectedSearchType)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      )}

      {!isLoading && selectedSearchType && products.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                {SEARCH_TYPES.find((t) => t.id === selectedSearchType)?.title} ({products.length})
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-1 h-6 w-6">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre a métrica</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{SEARCH_TYPES.find((t) => t.id === selectedSearchType)?.metricInfo}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h2>
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredProducts.length} de {products.length} produtos
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {selectedSearchType === "best_sellers" && (
                <div className="flex items-center gap-2">
                  <label htmlFor="min-sales" className="text-sm whitespace-nowrap">
                    Vendas mínimas:
                  </label>
                  <Select
                    value={minSales?.toString() || "0"}
                    onValueChange={(value) => setMinSales(value ? Number.parseInt(value) : null)}
                  >
                    <SelectTrigger id="min-sales" className="w-[120px]">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Qualquer</SelectItem>
                      <SelectItem value="100">100+</SelectItem>
                      <SelectItem value="500">500+</SelectItem>
                      <SelectItem value="1000">1.000+</SelectItem>
                      <SelectItem value="5000">5.000+</SelectItem>
                      <SelectItem value="10000">10.000+</SelectItem>
                      <SelectItem value="50000">50.000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor="results-limit" className="text-sm whitespace-nowrap">
                  Mostrar:
                </label>
                <Select
                  value={resultsLimit.toString()}
                  onValueChange={(value) => setResultsLimit(Number.parseInt(value))}
                >
                  <SelectTrigger id="results-limit" className="w-[100px]">
                    <SelectValue placeholder="5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" onClick={() => setShowMetrics(!showMetrics)}>
                {showMetrics ? "Ocultar métricas" : "Mostrar métricas"}
              </Button>
            </div>
          </div>

          {selectedSearchType === "best_sellers" && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTitle className="text-amber-800">Informação sobre Mais Vendidos</AlertTitle>
              <AlertDescription className="text-amber-700">
                Os produtos são ordenados pelo número total de vendas. O produto com mais vendas encontrado tem{" "}
                {products.length > 0 ? Number.parseInt(products[0].sales).toLocaleString("pt-BR") : 0} vendas.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.itemId} className="overflow-hidden">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.productName}
                    className="object-cover w-full h-full"
                  />
                  {Number.parseFloat(product.priceDiscountRate) > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                      {product.priceDiscountRate}% OFF
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2 h-12">{product.productName}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-sm">{Number.parseFloat(product.ratingStar).toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Number.parseInt(product.sales).toLocaleString("pt-BR")} vendas
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="font-bold text-lg">R$ {Number.parseFloat(product.price).toFixed(2)}</span>
                    {product.calculatedOriginalPrice && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        R$ {product.calculatedOriginalPrice}
                      </span>
                    )}
                  </div>

                  {showMetrics && (
                    <div className="mt-3 p-2 bg-muted/50 rounded-md text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Vendas:</span>
                        <span className="font-medium">{Number.parseInt(product.sales).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avaliação:</span>
                        <span className="font-medium">{Number.parseFloat(product.ratingStar).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Desconto:</span>
                        <span className="font-medium">{product.priceDiscountRate}%</span>
                      </div>
                      {selectedSearchType === "best_price" && (
                        <div className="flex justify-between">
                          <span>Custo-benefício:</span>
                          <span className="font-medium">
                            {(
                              (Number.parseFloat(product.ratingStar) * Number.parseInt(product.sales)) /
                              Number.parseFloat(product.price)
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                  {generatedCards[product.itemId] ? (
                    <div className="flex gap-2 w-full">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1" onClick={() => viewProduct(product)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Visualização do Card</DialogTitle>
                            <DialogDescription>
                              Visualize e baixe os cards gerados para {product.productName}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="mt-4">
                            <Tabs
                              defaultValue="style1"
                              className="w-full"
                              value={activeTemplate}
                              onValueChange={setActiveTemplate}
                            >
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="style1">Estilo Moderno</TabsTrigger>
                                <TabsTrigger value="style2">Estilo Alternativo</TabsTrigger>
                              </TabsList>

                              <TabsContent value="style1" className="mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="border rounded-md p-2 flex flex-col items-center">
                                    <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                                      <img
                                        src={generatedCards[product.itemId]?.pngUrl || "/placeholder.svg"}
                                        alt="PNG Card"
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 w-full"
                                      onClick={() => handleDownload(product.itemId, "png", 1)}
                                      disabled={isDownloading}
                                    >
                                      {isDownloading && downloadingType === "png" ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                      )}
                                      PNG
                                    </Button>
                                  </div>

                                  <div className="border rounded-md p-2 flex flex-col items-center">
                                    <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                                      <img
                                        src={generatedCards[product.itemId]?.jpegUrl || "/placeholder.svg"}
                                        alt="JPEG Card"
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 w-full"
                                      onClick={() => handleDownload(product.itemId, "jpeg", 1)}
                                      disabled={isDownloading}
                                    >
                                      {isDownloading && downloadingType === "jpeg" ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                      )}
                                      JPEG
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="style2" className="mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="border rounded-md p-2 flex flex-col items-center">
                                    <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                                      <img
                                        src={generatedCards[product.itemId]?.pngUrl2 || "/placeholder.svg"}
                                        alt="PNG Card (Alt)"
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 w-full"
                                      onClick={() => handleDownload(product.itemId, "png", 2)}
                                      disabled={isDownloading}
                                    >
                                      {isDownloading && downloadingType === "png" ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                      )}
                                      PNG
                                    </Button>
                                  </div>

                                  <div className="border rounded-md p-2 flex flex-col items-center">
                                    <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                                      <img
                                        src={generatedCards[product.itemId]?.jpegUrl2 || "/placeholder.svg"}
                                        alt="JPEG Card (Alt)"
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 w-full"
                                      onClick={() => handleDownload(product.itemId, "jpeg", 2)}
                                      disabled={isDownloading}
                                    >
                                      {isDownloading && downloadingType === "jpeg" ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                      )}
                                      JPEG
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>

                            <div className="border rounded-md p-3 mt-4">
                              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line mb-2">
                                {generatedCards[product.itemId]?.description || ""}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleDownload(product.itemId, "description")}
                                  disabled={isDownloading}
                                >
                                  {isDownloading && downloadingType === "description" ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-1" />
                                  )}
                                  Baixar Texto
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() =>
                                    copyToClipboard(
                                      `${generatedCards[product.itemId]?.description || ""}\n\n📲 LINK: ${product.offerLink || ""}`,
                                      `desc-${product.itemId}`,
                                    )
                                  }
                                >
                                  {copySuccess === `desc-${product.itemId}` ? (
                                    <>
                                      <Copy className="h-4 w-4 mr-1 text-green-500" />
                                      Copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-1" />
                                      Copiar Texto
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="flex justify-end mt-4">
                              <Button onClick={() => handleDownload(product.itemId, "all")} disabled={isDownloading}>
                                {isDownloading && downloadingType === "all" ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Baixando...
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar Tudo
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => handleDownload(product.itemId, "all")}
                        disabled={isDownloading}
                      >
                        {isDownloading && downloadingType === "all" ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Baixando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Tudo
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => generateCard(product.itemId)}
                      disabled={generatingCard === product.itemId}
                    >
                      {generatingCard === product.itemId ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Gerar Material
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="link" size="sm" className="w-full" asChild>
                    <a href={product.offerLink} target="_blank" rel="noopener noreferrer">
                      Ver na Shopee
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isLoading && selectedSearchType && products.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado para esta categoria.</p>
          <Button variant="outline" className="mt-4" onClick={() => fetchProductsByType(selectedSearchType)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {!selectedSearchType && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Selecione uma categoria acima para buscar produtos.</p>
        </div>
      )}
    </div>
  )
}
