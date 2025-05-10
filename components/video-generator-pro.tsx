"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { ProductSelector } from "@/components/product-selector"
import {
  Loader2,
  Video,
  Download,
  Play,
  AlertCircle,
  Settings,
  Sliders,
  RefreshCw,
  CheckCircle,
  Share2,
} from "lucide-react"
import { ToastAction } from "@/components/ui/toast"
import { usePersistentState } from "@/hooks/use-persistent-state"

interface VideoGeneratorProProps {
  products: any[]
}

export function VideoGeneratorPro({ products }: VideoGeneratorProProps) {
  // Usar o hook de estado persistente para os estados importantes
  const [selectedProduct, setSelectedProduct] = usePersistentState<string>("vgp_selectedProduct", "")
  const [videoDuration, setVideoDuration] = usePersistentState<number>("vgp_videoDuration", 10)
  const [videoStyle, setVideoStyle] = usePersistentState<string>("vgp_videoStyle", "portrait")
  const [videoQuality, setVideoQuality] = usePersistentState<string>("vgp_videoQuality", "medium")
  const [withAudio, setWithAudio] = usePersistentState<boolean>("vgp_withAudio", false)
  const [optimize, setOptimize] = usePersistentState<boolean>("vgp_optimize", true)
  const [fps, setFps] = usePersistentState<number>("vgp_fps", 30)
  const [activeTab, setActiveTab] = usePersistentState<string>("vgp_activeTab", "basic")

  // Estados que não precisam ser persistidos
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [generationStep, setGenerationStep] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<any[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [showProductNotFoundAlert, setShowProductNotFoundAlert] = useState(false)
  const [productValidationDone, setProductValidationDone] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()
  const productValidationRef = useRef(false)

  // Encontrar o produto selecionado para exibir informações
  const selectedProductInfo = products.find((p) => p.itemId === selectedProduct)

  // Carregar histórico de geração do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedHistory = localStorage.getItem("videoGenerationHistory")
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory)
        if (Array.isArray(parsedHistory)) {
          setGenerationHistory(parsedHistory)
        }
      }
    } catch (e) {
      console.error("Erro ao carregar histórico:", e)
    }
  }, [])

  // Salvar histórico no localStorage quando atualizado
  useEffect(() => {
    if (typeof window === "undefined") return

    if (generationHistory.length > 0) {
      try {
        localStorage.setItem("videoGenerationHistory", JSON.stringify(generationHistory))
      } catch (e) {
        console.error("Erro ao salvar histórico:", e)
      }
    }
  }, [generationHistory])

  // Verificar se o produto selecionado existe nos produtos disponíveis
  // Apenas uma vez quando os produtos são carregados
  useEffect(() => {
    // Aguardar até que os produtos sejam carregados
    if (products.length === 0 || productValidationRef.current) {
      return
    }

    // Marcar que os produtos foram carregados
    setProductsLoaded(true)

    // Verificar se o produto selecionado existe
    if (selectedProduct) {
      console.log("Verificando produto:", selectedProduct)
      console.log(
        "Produtos disponíveis:",
        products.map((p) => p.itemId),
      )

      const productExists = products.some((p) => p.itemId === selectedProduct)

      if (!productExists) {
        console.log("Produto não encontrado na lista:", selectedProduct)

        // Mostrar alerta apenas uma vez
        setShowProductNotFoundAlert(true)

        // Limpar a seleção apenas se o produto não existir
        setSelectedProduct("")

        // Mostrar toast apenas uma vez
        toast({
          variant: "warning",
          title: "Produto não encontrado",
          description:
            "O produto selecionado anteriormente não está mais disponível. Por favor, selecione outro produto.",
        })
      } else {
        console.log("Produto encontrado na lista:", selectedProduct)
        setShowProductNotFoundAlert(false)
      }
    }

    // Marcar que a validação foi concluída
    productValidationRef.current = true
    setProductValidationDone(true)
  }, [products, selectedProduct, setSelectedProduct, toast])

  const handleGenerateVideo = async () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um produto primeiro",
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setGenerationStep("Iniciando geração do vídeo...")

    // Simular progresso
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 5
      })
    }, 500)

    try {
      // Atualizar etapa
      setGenerationStep("Renderizando card e convertendo para vídeo...")

      // Fazer a requisição para gerar o vídeo
      const response = await fetch("/api/generate-product-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          duration: videoDuration,
          style: videoStyle,
          quality: videoQuality,
          withAudio,
          optimize,
          fps,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao gerar vídeo")
      }

      // Obter o blob do vídeo
      const videoBlob = await response.blob()

      // Criar URL para o blob
      const url = URL.createObjectURL(videoBlob)
      setVideoUrl(url)

      // Atualizar progresso para 100%
      setProgress(100)
      setGenerationStep("Vídeo gerado com sucesso!")

      // Adicionar ao histórico
      const newHistoryItem = {
        id: Date.now(),
        productId: selectedProduct,
        productName: selectedProductInfo?.productName || "Produto",
        timestamp: new Date().toISOString(),
        duration: videoDuration,
        style: videoStyle,
        quality: videoQuality,
      }

      setGenerationHistory((prev) => [newHistoryItem, ...prev.slice(0, 9)]) // Manter apenas os 10 mais recentes

      toast({
        title: "Vídeo gerado com sucesso",
        description: "Você pode visualizar e baixar o vídeo agora",
      })
    } catch (error) {
      console.error("Erro ao gerar vídeo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar vídeo",
        description: error.message || "Ocorreu um erro ao gerar o vídeo",
      })
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => {
        setIsGenerating(false)
      }, 500)
    }
  }

  const handleDownloadVideo = () => {
    if (!videoUrl) return

    const a = document.createElement("a")
    a.href = videoUrl
    a.download = `produto-${selectedProduct}-${Date.now()}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShareVideo = async () => {
    if (!videoUrl) return

    try {
      // Verificar se a API de compartilhamento está disponível
      if (navigator.share) {
        const blob = await fetch(videoUrl).then((r) => r.blob())
        const file = new File([blob], `produto-${selectedProduct}.mp4`, { type: "video/mp4" })

        await navigator.share({
          title: `Vídeo do produto ${selectedProductInfo?.productName || ""}`,
          text: "Confira este produto incrível!",
          files: [file],
        })

        toast({
          title: "Vídeo compartilhado",
          description: "O vídeo foi compartilhado com sucesso",
        })
      } else {
        // Fallback se a API de compartilhamento não estiver disponível
        handleDownloadVideo()
        toast({
          title: "Compartilhamento não suportado",
          description: "Seu navegador não suporta compartilhamento direto. O vídeo foi baixado.",
        })
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error)
      toast({
        variant: "destructive",
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o vídeo",
      })
    }
  }

  const loadHistoryItem = (item: any) => {
    // Encontrar o produto pelo ID
    const product = products.find((p) => p.itemId === item.productId)
    if (product) {
      setSelectedProduct(item.productId)
      setVideoDuration(item.duration)
      setVideoStyle(item.style)
      setVideoQuality(item.quality || "medium")

      toast({
        title: "Configurações carregadas",
        description: `Configurações para "${product.productName}" carregadas`,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Produto não encontrado",
        description: "O produto deste histórico não está mais disponível",
      })
    }
  }

  // Adicionar função para fazer upload do vídeo para o Blob Storage
  const uploadToBlob = async (videoBlob: Blob, productId: string) => {
    try {
      setIsUploading(true)

      // Criar um FormData para enviar o arquivo
      const formData = new FormData()
      formData.append("file", videoBlob, `produto_${productId}_${Date.now()}.mp4`)
      formData.append("productId", productId)

      // Enviar para a API
      const response = await fetch("/api/upload-to-blob", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro ao fazer upload: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Upload concluído",
          description: "Vídeo enviado para o Blob Storage com sucesso!",
        })

        // Salvar o vídeo no Redis com a URL do Blob
        await saveVideoToRedis(productId, data.url)

        return data.url
      } else {
        throw new Error(data.message || "Erro desconhecido ao fazer upload")
      }
    } catch (error) {
      console.error("Erro ao fazer upload para o Blob Storage:", error)
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Falha ao enviar o vídeo para o Blob Storage",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // Adicionar função para salvar o vídeo no Redis com a URL do Blob
  const saveVideoToRedis = async (productId: string, blobUrl: string) => {
    try {
      const response = await fetch("/api/save-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          duration: videoDuration,
          htmlTemplate: previewHtml,
          blobUrl,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao salvar vídeo: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Vídeo salvo",
          description: "Vídeo salvo com sucesso no Redis!",
        })
      } else {
        throw new Error(data.message || "Erro desconhecido ao salvar vídeo")
      }
    } catch (error) {
      console.error("Erro ao salvar vídeo no Redis:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Falha ao salvar o vídeo no Redis",
      })
    }
  }

  // Modificar a função handleExportVideo para usar o Blob Storage
  const handleExportVideo = async () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um produto primeiro",
      })
      return
    }

    try {
      setIsExporting(true)

      // Gerar o vídeo
      //const videoBlob = await generateVideo();
      const videoBlob = new Blob(["test"], { type: "video/mp4" })

      if (!videoBlob) {
        throw new Error("Falha ao gerar o vídeo")
      }

      // Fazer upload para o Blob Storage
      const blobUrl = await uploadToBlob(videoBlob, selectedProduct)

      if (blobUrl) {
        // Criar link de download como fallback
        const downloadUrl = URL.createObjectURL(videoBlob)
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = `produto_${selectedProduct}_${Date.now()}.mp4`

        // Oferecer download local como opção adicional
        toast({
          title: "Download disponível",
          description: "Clique para baixar uma cópia local do vídeo",
          action: (
            <ToastAction altText="Download" onClick={() => a.click()}>
              Download
            </ToastAction>
          ),
        })
      }
    } catch (error) {
      console.error("Erro ao exportar vídeo:", error)
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Falha ao exportar o vídeo",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Vídeos Profissional</CardTitle>
          <CardDescription>Crie vídeos em MP4 para TikTok a partir de produtos da Shopee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showProductNotFoundAlert && productValidationDone && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O produto selecionado anteriormente não está mais disponível. Por favor, selecione outro produto.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="basic">Configurações Básicas</TabsTrigger>
              <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Selecione o Produto</Label>
                <ProductSelector
                  products={products}
                  value={selectedProduct}
                  onChange={(value) => {
                    setSelectedProduct(value)
                    setShowProductNotFoundAlert(false)
                  }}
                />

                {selectedProductInfo && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-medium text-sm">Produto selecionado:</p>
                    <p className="text-sm truncate">{selectedProductInfo.productName}</p>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Preço: R$ {selectedProductInfo.price}</span>
                      <span>Vendas: {selectedProductInfo.sales}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoStyle">Estilo do Vídeo</Label>
                <Select value={videoStyle} onValueChange={setVideoStyle}>
                  <SelectTrigger id="videoStyle">
                    <SelectValue placeholder="Selecione o estilo do vídeo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato (9:16) - Ideal para TikTok</SelectItem>
                    <SelectItem value="square">Quadrado (1:1) - Instagram</SelectItem>
                    <SelectItem value="landscape">Paisagem (16:9) - YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="videoDuration">Duração do Vídeo: {videoDuration} segundos</Label>
                </div>
                <Slider
                  id="videoDuration"
                  min={5}
                  max={15}
                  step={1}
                  value={[videoDuration]}
                  onValueChange={(value) => setVideoDuration(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5s</span>
                  <span>10s</span>
                  <span>15s</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="withAudio">Incluir Áudio (Música de Fundo)</Label>
                <Switch id="withAudio" checked={withAudio} onCheckedChange={setWithAudio} />
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
                <Settings className="mr-2 h-4 w-4" />
                {showAdvanced ? "Ocultar Configurações Avançadas" : "Mostrar Configurações Avançadas"}
              </Button>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoQuality">Qualidade do Vídeo</Label>
                <Select value={videoQuality} onValueChange={setVideoQuality}>
                  <SelectTrigger id="videoQuality">
                    <SelectValue placeholder="Selecione a qualidade do vídeo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (arquivo menor)</SelectItem>
                    <SelectItem value="medium">Média (recomendado)</SelectItem>
                    <SelectItem value="high">Alta (arquivo maior)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="fps">Taxa de Quadros (FPS): {fps}</Label>
                </div>
                <Slider id="fps" min={24} max={60} step={1} value={[fps]} onValueChange={(value) => setFps(value[0])} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>24 fps</span>
                  <span>30 fps</span>
                  <span>60 fps</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="optimize">Otimizar para Redes Sociais</Label>
                <Switch id="optimize" checked={optimize} onCheckedChange={setOptimize} />
              </div>

              <Alert variant="info" className="mt-4">
                <Sliders className="h-4 w-4" />
                <AlertDescription>
                  Configurações avançadas afetam a qualidade e o tamanho do arquivo final. Para a maioria dos casos, as
                  configurações padrão são recomendadas.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {isGenerating && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>{generationStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A geração de vídeo pode levar até 30 segundos. O processo utiliza recursos do servidor para renderizar o
              card em alta qualidade.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleGenerateVideo} disabled={!selectedProduct || isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Vídeo...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Gerar Vídeo MP4
              </>
            )}
          </Button>
          <Button
            onClick={handleExportVideo}
            disabled={isExporting || isUploading || !selectedProduct}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando vídeo...
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando para o Blob Storage...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Exportar vídeo MP4
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview do Vídeo</CardTitle>
          <CardDescription>Visualize e baixe o vídeo gerado para publicação no TikTok</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="info">Informações</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="p-4">
              {videoUrl ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-md mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      loop
                    />
                  </div>

                  <div className="flex gap-2 mt-4 w-full max-w-md">
                    <Button variant="outline" className="flex-1" onClick={() => videoRef.current?.play()}>
                      <Play className="mr-2 h-4 w-4" />
                      Reproduzir
                    </Button>
                    <Button className="flex-1" onClick={handleDownloadVideo}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar MP4
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={handleShareVideo}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">Gere um vídeo para visualizá-lo aqui</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Histórico de Geração</h3>

                {generationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum histórico de geração encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {generationHistory.map((item) => (
                      <div key={item.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => loadHistoryItem(item)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="bg-muted px-2 py-1 rounded">{item.duration}s</span>
                          <span className="bg-muted px-2 py-1 rounded">
                            {item.style === "portrait" ? "9:16" : item.style === "square" ? "1:1" : "16:9"}
                          </span>
                          <span className="bg-muted px-2 py-1 rounded capitalize">{item.quality || "medium"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {generationHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      localStorage.removeItem("videoGenerationHistory")
                      setGenerationHistory([])
                      toast({
                        title: "Histórico limpo",
                        description: "O histórico de geração foi limpo com sucesso",
                      })
                    }}
                  >
                    Limpar Histórico
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="info" className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Sobre o Gerador de Vídeos</h3>
                  <p className="text-sm text-muted-foreground">
                    Este gerador cria vídeos MP4 de alta qualidade a partir dos cards de produtos, prontos para
                    publicação no TikTok e outras plataformas.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Processo de Geração</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Renderização do card HTML em alta resolução</li>
                    <li>Conversão para vídeo MP4 com efeitos de transição</li>
                    <li>Adição de áudio (opcional)</li>
                    <li>Otimização para plataformas sociais</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Dicas de Uso</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use o formato retrato (9:16) para TikTok e Reels</li>
                    <li>Duração recomendada: 7-10 segundos</li>
                    <li>Adicione áudio para maior engajamento</li>
                    <li>Baixe o vídeo e faça upload diretamente no TikTok</li>
                    <li>Adicione hashtags relevantes na descrição do TikTok</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Compatibilidade</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Os vídeos gerados são compatíveis com TikTok, Instagram Reels, YouTube Shorts e outras plataformas
                    de vídeo.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
