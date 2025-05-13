"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Film, Search, ExternalLink, Download, Copy, Star } from "lucide-react"
import Image from "next/image"
import { logger } from "@/lib/logger"
import { Input } from "@/components/ui/input"
import { debounce } from "lodash"
import { ErrorDisplayStandard } from "@/components/error-display-standard"

interface Product {
  id: string
  name: string
  image: string
  price: string
  sales?: string
  rating?: string
}

interface ProductMedia {
  id: string
  productId: string
  name: string
  images: string[]
  videos: string[]
  error?: string
}

export function ProductMediaGallery() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [productMedia, setProductMedia] = useState<ProductMedia | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("images")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [recentSearches, setRecentSearches] = useState<Product[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Carregar histórico de buscas recentes do localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentProductSearches")
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (e) {
        console.error("Erro ao carregar histórico de buscas:", e)
      }
    }
  }, [])

  // Salvar busca no histórico
  const saveToHistory = (product: Product) => {
    const updatedHistory = [product, ...recentSearches.filter((p) => p.id !== product.id)].slice(0, 5)
    setRecentSearches(updatedHistory)
    localStorage.setItem("recentProductSearches", JSON.stringify(updatedHistory))
  }

  // Limpar histórico de buscas
  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches([])
    localStorage.removeItem("recentProductSearches")
    toast({
      title: "Histórico limpo",
      description: "Seu histórico de buscas foi limpo com sucesso",
    })
  }

  // Buscar produtos por nome com debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      const performSearch = async () => {
        try {
          const response = await fetch(`/api/search-products?query=${encodeURIComponent(query)}`)
          if (!response.ok) {
            throw new Error("Erro ao buscar produtos")
          }

          const data = await response.json()

          if (!data.success) {
            throw new Error(data.error || "Falha ao buscar produtos")
          }

          setSearchResults(
            data.products.map((product: any) => ({
              id: product.itemId || product.id,
              name: product.productName || product.name,
              image: product.imageUrl || product.image,
              price: product.price,
              sales: product.sales,
              rating: product.ratingStar || product.rating,
            })),
          )
        } catch (error) {
          console.error("Erro na busca:", error)
          setError(error instanceof Error ? error.message : "Erro ao buscar produtos")
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }

      performSearch()
    }, 300),
    [],
  )

  // Função para lidar com a mudança no input de busca
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      setIsSearching(true)
      debouncedSearch(value)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  // Selecionar produto e buscar mídia
  const selectProduct = (product: Product) => {
    setSelectedProduct(product)
    setSearchQuery(product.name)
    saveToHistory(product)
    fetchProductMedia(product.id)
  }

  // Função para realizar a busca quando o botão é clicado
  const handleSearchButtonClick = () => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      debouncedSearch(searchQuery)
    }
  }

  // Atualizar a função fetchProductMedia para usar a API
  const fetchProductMedia = async (productId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      logger.info(`Buscando mídia para o produto: ${productId}`)

      const response = await fetch(`/api/product-media?productId=${encodeURIComponent(productId)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao buscar mídia do produto")
      }

      const data = await response.json()

      if (!data.success && data.message) {
        throw new Error(data.message)
      }

      logger.info(`Mídia do produto recebida: ${data.name}`)

      setProductMedia(data)

      toast({
        title: "Mídia carregada com sucesso",
        description: `Encontradas ${data.images?.length || 0} imagens e ${data.videos?.length || 0} vídeos`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao buscar mídia do produto"
      logger.error(`Erro ao buscar mídia do produto: ${errorMessage}`)

      setError(errorMessage)

      toast({
        title: "Erro ao buscar mídia",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copiada",
      description: "URL da mídia copiada para a área de transferência",
    })
  }

  const downloadMedia = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Renderizar estrelas de avaliação
  const renderRating = (rating: string) => {
    const ratingValue = Number.parseFloat(rating) || 0
    return (
      <div className="flex items-center">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="ml-1 text-xs">{ratingValue.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buscar Mídia do Produto</CardTitle>
          <CardDescription>
            Busque um produto pelo nome para visualizar todas as imagens e vídeos associados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchButtonClick()
                    }
                  }}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button onClick={handleSearchButtonClick} className="min-w-[100px]" disabled={isSearching}>
                {isSearching ? (
                  "Buscando..."
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-3">Resultados da Busca</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {searchResults.map((product) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                      onClick={() => selectProduct(product)}
                    >
                      <div className="aspect-square relative">
                        <Image
                          src={product.image || "/error-message.png"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-bold">{product.price}</p>
                          {product.rating && renderRating(product.rating)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {product.sales && `${Number.parseInt(product.sales).toLocaleString()} vendas`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedProduct ? (
                  <div className="flex items-center gap-2">
                    <span>Produto selecionado:</span>
                    <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0 border">
                      <Image
                        src={selectedProduct.image || "/error-message.png"}
                        alt={selectedProduct.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <strong className="truncate max-w-[200px]">{selectedProduct.name}</strong>
                  </div>
                ) : (
                  <span>Selecione um produto para visualizar suas mídias</span>
                )}
              </div>

              {selectedProduct && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchProductMedia(selectedProduct.id)}
                  disabled={isLoading}
                >
                  {isLoading ? "Carregando..." : "Atualizar mídia"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <ErrorDisplayStandard
          message={error}
          onRetry={selectedProduct ? () => fetchProductMedia(selectedProduct.id) : undefined}
        />
      )}

      {isLoading && !searchResults.length && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {productMedia && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>{productMedia.name}</CardTitle>
            <CardDescription>ID: {productMedia.productId}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="images" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="images">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Imagens ({productMedia.images.length})
                </TabsTrigger>
                <TabsTrigger value="videos">
                  <Film className="mr-2 h-4 w-4" />
                  Vídeos ({productMedia.videos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images">
                {productMedia.images.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <p>Nenhuma imagem encontrada para este produto</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productMedia.images.map((imageUrl, index) => (
                      <div key={index} className="group relative rounded-lg overflow-hidden border bg-card">
                        <div className="aspect-square relative">
                          <Image
                            src={imageUrl || "/error-message.png"}
                            alt={`Imagem ${index + 1} do produto ${productMedia.name}`}
                            fill
                            className="object-cover transition-all group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                          <Badge variant="secondary" className="bg-black/70 text-white">
                            Imagem {index + 1}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                              onClick={() => copyToClipboard(imageUrl)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                              onClick={() => window.open(imageUrl, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                              onClick={() =>
                                downloadMedia(imageUrl, `produto-${productMedia.productId}-imagem-${index + 1}.jpg`)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="videos">
                {productMedia.videos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Film className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <p>Nenhum vídeo encontrado para este produto</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {productMedia.videos.map((videoUrl, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border bg-card">
                        <div className="aspect-video relative">
                          <video src={videoUrl} controls className="w-full h-full" poster="/error-message.png" />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <Badge variant="outline">Vídeo {index + 1}</Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(videoUrl)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar URL
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                downloadMedia(videoUrl, `produto-${productMedia.productId}-video-${index + 1}.mp4`)
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Total: {productMedia.images.length + productMedia.videos.length} arquivos de mídia
            </p>
            <Button variant="outline" onClick={() => setProductMedia(null)}>
              Nova Busca
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
