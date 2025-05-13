"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Play, Pause, Settings, Film } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Tipos de transição disponíveis
export enum TransitionType {
  FADE = "fade",
  SLIDE = "slide",
  ZOOM = "zoom",
}

interface AnimatedProductCardProps {
  productId?: string
  autoFetch?: boolean
  transitionType?: TransitionType
  transitionSpeed?: number
  autoPlay?: boolean
}

export function AnimatedProductCard({
  productId,
  autoFetch = true,
  transitionType = TransitionType.FADE,
  transitionSpeed = 1000,
  autoPlay = true,
}: AnimatedProductCardProps) {
  // Estados
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [productImages, setProductImages] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [transition, setTransition] = useState<TransitionType>(transitionType)
  const [speed, setSpeed] = useState(transitionSpeed)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Buscar o produto mais vendido
  useEffect(() => {
    if (autoFetch) {
      fetchBestSellerProduct()
    } else if (productId) {
      fetchProductById(productId)
    }
  }, [autoFetch, productId])

  // Efeito para alternar entre as imagens
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying && productImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % productImages.length)
      }, speed)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, productImages, speed])

  // Buscar o produto mais vendido
  const fetchBestSellerProduct = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/best-sellers")
      if (!response.ok) {
        throw new Error(`Falha ao buscar produtos: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success || !data.products || data.products.length === 0) {
        throw new Error("Nenhum produto encontrado")
      }

      const bestSeller = data.products[0]
      setProduct(bestSeller)

      // Buscar imagens adicionais do produto
      await fetchProductImages(bestSeller)
    } catch (err: any) {
      console.error("Erro ao buscar produto mais vendido:", err)
      setError(err.message || "Erro ao buscar produto")
      toast({
        variant: "destructive",
        title: "Erro ao carregar produto",
        description: err.message || "Não foi possível carregar o produto mais vendido",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar produto por ID
  const fetchProductById = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Em um cenário real, você teria uma API para buscar detalhes do produto por ID
      // Aqui estamos simulando com o endpoint de best-sellers
      const response = await fetch("/api/best-sellers")
      if (!response.ok) {
        throw new Error(`Falha ao buscar produtos: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success || !data.products || data.products.length === 0) {
        throw new Error("Nenhum produto encontrado")
      }

      // Normalmente você buscaria o produto específico pelo ID
      // Aqui estamos apenas pegando o primeiro da lista
      const productData = data.products[0]
      setProduct(productData)

      // Buscar imagens adicionais do produto
      await fetchProductImages(productData)
    } catch (err: any) {
      console.error(`Erro ao buscar produto ${id}:`, err)
      setError(err.message || "Erro ao buscar produto")
      toast({
        variant: "destructive",
        title: "Erro ao carregar produto",
        description: err.message || `Não foi possível carregar o produto ${id}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar imagens adicionais do produto
  const fetchProductImages = async (product: any) => {
    try {
      // Em um cenário real, você buscaria múltiplas imagens da API
      // Aqui estamos simulando com variações da imagem principal
      const mainImage = product.imageUrl

      // Criar array com a imagem principal e variações simuladas
      const images = [
        mainImage,
        // Simular imagens adicionais com parâmetros diferentes
        `${mainImage}?variant=1`,
        `${mainImage}?variant=2`,
        `${mainImage}?variant=3`,
      ]

      setProductImages(images)
    } catch (err: any) {
      console.error("Erro ao buscar imagens do produto:", err)
      // Fallback para pelo menos a imagem principal
      if (product && product.imageUrl) {
        setProductImages([product.imageUrl])
      }
    }
  }

  // Gerar GIF animado
  const generateAnimatedGif = async () => {
    if (productImages.length < 2) {
      toast({
        variant: "destructive",
        title: "Imagens insuficientes",
        description: "São necessárias pelo menos 2 imagens para criar uma animação",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Preparar dados para enviar à API
      const requestData = {
        images: productImages,
        productName: product?.productName || "Produto",
        price: product?.price || "0.00",
        discount: product?.priceDiscountRate || "0",
        transitionType: transition,
        transitionSpeed: speed,
        showOverlay,
      }

      // Chamar API para gerar GIF
      const response = await fetch("/api/generate-animated-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`Falha ao gerar animação: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Falha ao gerar animação")
      }

      // Iniciar download do GIF
      await downloadAnimatedCard(data.gifUrl)

      toast({
        title: "Animação gerada com sucesso",
        description: "O GIF animado foi gerado e baixado com sucesso",
      })
    } catch (err: any) {
      console.error("Erro ao gerar GIF animado:", err)
      toast({
        variant: "destructive",
        title: "Erro ao gerar animação",
        description: err.message || "Não foi possível gerar o GIF animado",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Download do GIF animado
  const downloadAnimatedCard = async (url: string) => {
    try {
      setIsDownloading(true)

      // Criar nome de arquivo baseado no produto
      const productName = product?.productName?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "produto"
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filename = `animated_${productName}_${timestamp}.gif`

      // Iniciar download
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download iniciado",
        description: "O download do GIF animado foi iniciado",
      })
    } catch (err: any) {
      console.error("Erro ao baixar GIF:", err)
      toast({
        variant: "destructive",
        title: "Erro ao baixar animação",
        description: err.message || "Não foi possível baixar o GIF animado",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Renderizar o card com a imagem atual
  const renderCurrentImage = () => {
    if (productImages.length === 0) {
      return (
        <div className="w-full aspect-[9/16] bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Nenhuma imagem disponível</p>
        </div>
      )
    }

    const currentImage = productImages[currentImageIndex]
    const nextImageIndex = (currentImageIndex + 1) % productImages.length
    const nextImage = productImages[nextImageIndex]

    // Aplicar diferentes estilos de transição
    let transitionStyle = {}
    let containerStyle = {}

    switch (transition) {
      case TransitionType.FADE:
        transitionStyle = {
          opacity: 1,
          transition: `opacity ${speed / 1000}s ease-in-out`,
        }
        containerStyle = {
          position: "relative" as const,
        }
        break
      case TransitionType.SLIDE:
        transitionStyle = {
          transform: "translateX(0)",
          transition: `transform ${speed / 1000}s ease-in-out`,
        }
        containerStyle = {
          position: "relative" as const,
          overflow: "hidden" as const,
        }
        break
      case TransitionType.ZOOM:
        transitionStyle = {
          transform: "scale(1)",
          transition: `transform ${speed / 1000}s ease-in-out`,
        }
        containerStyle = {
          position: "relative" as const,
          overflow: "hidden" as const,
        }
        break
    }

    return (
      <div className="w-full aspect-[9/16] bg-black relative" style={containerStyle}>
        {/* Imagem atual */}
        <img
          src={currentImage || "/placeholder.svg"}
          alt={`Produto ${currentImageIndex + 1}/${productImages.length}`}
          className="w-full h-full object-contain absolute top-0 left-0"
          style={transitionStyle}
        />

        {/* Precarregar próxima imagem */}
        <img
          src={nextImage || "/placeholder.svg"}
          alt="Próxima imagem"
          className="hidden"
          onLoad={() => {
            // Imagem pré-carregada
          }}
        />

        {/* Overlay com informações do produto */}
        {showOverlay && product && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
            <h3 className="font-bold text-lg line-clamp-2">{product.productName}</h3>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <span className="text-xl font-bold">R$ {product.price}</span>
                {product.priceDiscountRate && Number.parseInt(product.priceDiscountRate) > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {product.priceDiscountRate}% OFF
                  </span>
                )}
              </div>
              <span className="text-sm opacity-80">
                {currentImageIndex + 1}/{productImages.length}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Renderizar controles de reprodução
  const renderPlaybackControls = () => (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)} disabled={productImages.length < 2}>
        {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
        {isPlaying ? "Pausar" : "Reproduzir"}
      </Button>

      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
          disabled={productImages.length < 2}
          className="h-8 w-8"
        >
          <span className="sr-only">Anterior</span>
          &lt;
        </Button>
        <span className="mx-2 text-sm">
          {productImages.length > 0 ? `${currentImageIndex + 1}/${productImages.length}` : "0/0"}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % productImages.length)}
          disabled={productImages.length < 2}
          className="h-8 w-8"
        >
          <span className="sr-only">Próximo</span>
          &gt;
        </Button>
      </div>

      <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
        <Settings className="h-4 w-4 mr-2" />
        Configurações
      </Button>
    </div>
  )

  // Renderizar configurações de transição
  const renderTransitionSettings = () => (
    <div className={`space-y-4 mt-4 p-4 border rounded-md ${showSettings ? "block" : "hidden"}`}>
      <div className="space-y-2">
        <Label htmlFor="transition-type">Tipo de Transição</Label>
        <Select value={transition} onValueChange={(value) => setTransition(value as TransitionType)}>
          <SelectTrigger id="transition-type">
            <SelectValue placeholder="Selecione o tipo de transição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TransitionType.FADE}>Fade</SelectItem>
            <SelectItem value={TransitionType.SLIDE}>Slide</SelectItem>
            <SelectItem value={TransitionType.ZOOM}>Zoom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="transition-speed">Velocidade de Transição: {speed}ms</Label>
        </div>
        <Slider
          id="transition-speed"
          min={500}
          max={5000}
          step={100}
          value={[speed]}
          onValueChange={(value) => setSpeed(value[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Rápido</span>
          <span>Lento</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-overlay">Mostrar Informações</Label>
        <Switch id="show-overlay" checked={showOverlay} onCheckedChange={setShowOverlay} />
      </div>
    </div>
  )

  // Renderizar o componente principal
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="w-full aspect-[9/16] flex items-center justify-center bg-muted">
            <div className="space-y-4 w-full px-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : error ? (
          <div className="w-full aspect-[9/16] flex items-center justify-center bg-muted">
            <div className="text-center p-6">
              <p className="text-red-500 mb-2">{error}</p>
              <Button variant="outline" onClick={fetchBestSellerProduct}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : (
          renderCurrentImage()
        )}
      </CardContent>

      <CardFooter className="flex flex-col p-4 space-y-4">
        {!isLoading && !error && (
          <>
            {renderPlaybackControls()}
            {renderTransitionSettings()}

            <div className="flex justify-between w-full mt-4">
              <Button variant="outline" onClick={fetchBestSellerProduct} disabled={isGenerating || isDownloading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>

              <Button
                onClick={generateAnimatedGif}
                disabled={isGenerating || isDownloading || productImages.length < 2}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Film className="h-4 w-4 mr-2" />
                    Gerar GIF
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
