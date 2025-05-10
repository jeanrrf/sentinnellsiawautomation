"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Loader2,
  Video,
  Camera,
  Copy,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Download,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { ProductSelector } from "@/components/product-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { VideoRecorder } from "@/components/video-recorder"

interface VideoGeneratorProps {
  products: any[]
}

export function VideoGenerator({ products }: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [htmlTemplate, setHtmlTemplate] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [useAI, setUseAI] = useState(true)
  const [customDescription, setCustomDescription] = useState("")
  const [videoStyle, setVideoStyle] = useState("portrait")
  const [activeTab, setActiveTab] = useState("preview")
  const [previewError, setPreviewError] = useState(false)
  const [previewMode, setPreviewMode] = useState<"standard" | "tiktok">("tiktok")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(5)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const tiktokPreviewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Carregar o produto selecionado do localStorage quando o componente montar
  useEffect(() => {
    const storedProductId = localStorage.getItem("selectedProductId")
    if (storedProductId) {
      setSelectedProduct(storedProductId)
      // Limpar o localStorage para não persistir a seleção entre sessões
      localStorage.removeItem("selectedProductId")
    }
  }, [])

  // Limpar o preview quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = ""
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  // Renderizar o preview de forma isolada
  useEffect(() => {
    if (htmlTemplate && previewContainerRef.current) {
      try {
        console.log("Renderizando preview do card no container")
        // Limpar o conteúdo anterior
        previewContainerRef.current.innerHTML = ""

        // Criar um iframe isolado para o preview
        const iframe = document.createElement("iframe")
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        iframe.style.border = "none"
        iframe.style.overflow = "hidden"
        iframe.title = "Card Preview"
        iframe.sandbox.add("allow-same-origin")

        // Adicionar ao container
        previewContainerRef.current.appendChild(iframe)

        // Escrever o conteúdo no iframe após ele ser carregado
        iframe.onload = () => {
          if (iframe.contentDocument) {
            iframe.contentDocument.open()
            iframe.contentDocument.write(htmlTemplate)
            iframe.contentDocument.close()
            console.log("Preview renderizado com sucesso")
          } else {
            console.error("contentDocument não disponível no iframe")
          }
        }

        // Iniciar o carregamento
        iframe.src = "about:blank"

        setPreviewError(false)
      } catch (error) {
        console.error("Error rendering preview:", error)
        setPreviewError(true)
      }
    } else if (htmlTemplate) {
      console.log("previewContainerRef não está disponível para renderizar o preview")
    }
  }, [htmlTemplate])

  // Ajustar o layout do preview do TikTok quando o modo ou tamanho da tela mudar
  useEffect(() => {
    const adjustTikTokPreview = () => {
      if (tiktokPreviewRef.current && previewMode === "tiktok") {
        const container = tiktokPreviewRef.current

        // Definir altura fixa para manter a proporção 9:16
        if (isFullscreen) {
          // No modo fullscreen, ajustar para o tamanho da tela mantendo a proporção
          const maxHeight = window.innerHeight * 0.9
          const maxWidth = maxHeight * (9 / 16)

          container.style.width = `${maxWidth}px`
          container.style.height = `${maxHeight}px`
        } else {
          // No modo normal, definir largura fixa e calcular altura
          const containerWidth = 375 // Largura fixa de um celular típico
          const containerHeight = containerWidth * (16 / 9)

          container.style.width = `${containerWidth}px`
          container.style.height = `${containerHeight}px`
        }
      }
    }

    // Executar ajuste imediatamente
    adjustTikTokPreview()

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", adjustTikTokPreview)

    // Limpar listener
    return () => {
      window.removeEventListener("resize", adjustTikTokPreview)
    }
  }, [previewMode, isFullscreen, activeTab])

  const handleFetchProducts = async () => {
    try {
      const response = await fetch("/api/fetch-shopee", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Reload the page to show the new products
        window.location.reload()
      } else {
        throw new Error(data.message || "Failed to fetch products from Shopee")
      }
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Erro ao buscar produtos",
        description: err.message,
      })
    }
  }

  const simulateProgress = () => {
    setGenerationProgress(0)
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 200)

    return () => clearInterval(interval)
  }

  const handleGenerate = async () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar card",
        description: "Selecione um produto primeiro",
      })
      return
    }

    setIsGenerating(true)
    setGenerationStep("Iniciando geração do card...")
    const stopProgress = simulateProgress()

    try {
      console.log("Gerando card para o produto:", selectedProduct)

      // Encontrar o produto selecionado para exibir informações
      const productInfo = products.find((p) => p.itemId === selectedProduct)
      if (productInfo) {
        console.log("Informações do produto:", productInfo.productName)
      } else {
        console.error("Produto não encontrado na lista:", selectedProduct)
        throw new Error("Produto não encontrado na lista de produtos")
      }

      setGenerationStep("Buscando informações do produto...")

      // Gerar o card localmente sem depender do Redis
      const product = products.find((p) => p.itemId === selectedProduct)

      if (!product) {
        throw new Error("Produto não encontrado")
      }

      setGenerationStep("Gerando descrição...")

      // Usar descrição personalizada ou gerar uma descrição simples
      let description = ""
      if (!useAI) {
        description = customDescription
        console.log("Usando descrição personalizada:", description)
      } else {
        try {
          // Tentar obter descrição da API
          console.log("Solicitando descrição da API para o produto:", selectedProduct)
          const descResponse = await fetch("/api/generate-description", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product }),
          })

          if (descResponse.ok) {
            const descData = await descResponse.json()
            description = descData.description
            console.log("Descrição gerada com sucesso:", description)
          } else {
            console.error("Erro ao gerar descrição. Status:", descResponse.status)
            // Fallback para descrição local
            description = createFallbackDescription(product)
            console.log("Usando descrição de fallback:", description)
          }
        } catch (error) {
          console.error("Error generating description:", error)
          description = createFallbackDescription(product)
          console.log("Usando descrição de fallback após erro:", description)
        }
      }

      setGenerationStep("Renderizando template...")

      // Gerar o HTML do template localmente
      console.log("Renderizando template HTML para o produto:", selectedProduct)
      const html = renderProductCardTemplate(product, description, videoStyle)
      setHtmlTemplate(html)

      // Criar URL para abrir em nova aba
      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      setGenerationProgress(100)

      // Mudar para a aba de preview automaticamente
      setActiveTab("preview")

      // Definir o modo de preview para TikTok por padrão
      setPreviewMode("tiktok")

      // Limpar qualquer vídeo anterior
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
        setVideoUrl("")
        setVideoBlob(null)
      }

      console.log("Card gerado com sucesso para o produto:", selectedProduct)
      toast({
        title: "Card gerado com sucesso",
        description: "Você pode visualizar o card na aba de preview",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      })
    } catch (error) {
      console.error("Error generating video:", error)
      setGenerationProgress(0)
      toast({
        variant: "destructive",
        title: "Erro ao gerar o card",
        description: error.message || "Ocorreu um erro desconhecido ao gerar o card",
      })
    } finally {
      stopProgress()
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationStep(null)
      }, 500)
    }
  }

  const handleCopyHtml = () => {
    navigator.clipboard
      .writeText(htmlTemplate)
      .then(() => {
        toast({
          title: "HTML copiado",
          description: "O código HTML do card foi copiado para a área de transferência",
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        })
      })
      .catch((err) => {
        console.error("Failed to copy HTML: ", err)
        toast({
          variant: "destructive",
          title: "Erro ao copiar HTML",
          description: "Não foi possível copiar o código HTML",
        })
      })
  }

  const handleTakeScreenshot = () => {
    if (!previewUrl) {
      toast({
        variant: "destructive",
        title: "Erro ao tirar screenshot",
        description: "Gere um card primeiro",
      })
      return
    }

    // Open the preview URL in a new tab for screenshot
    window.open(previewUrl, "_blank")

    toast({
      title: "Card aberto em nova aba",
      description: "Você pode tirar um screenshot do card na nova aba",
    })
  }

  const handleDownloadHtml = () => {
    if (!htmlTemplate) {
      toast({
        variant: "destructive",
        title: "Erro ao baixar HTML",
        description: "Gere um card primeiro",
      })
      return
    }

    const blob = new Blob([htmlTemplate], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `card-${selectedProduct}-${new Date().getTime()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "HTML baixado",
      description: "O arquivo HTML do card foi baixado",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    })
  }

  const handleRecordingComplete = (blob: Blob, url: string) => {
    setVideoBlob(blob)
    setVideoUrl(url)

    // Mudar para a aba de vídeo automaticamente
    setActiveTab("video")

    // Salvar o vídeo no servidor (opcional)
    // saveVideoToServer(blob, selectedProduct)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Alert className="mb-6">
          <AlertDescription>Você precisa buscar produtos da Shopee antes de usar o gerador de cards.</AlertDescription>
        </Alert>
        <Button onClick={handleFetchProducts}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Buscar Produtos da Shopee
        </Button>
      </div>
    )
  }

  // Encontrar o produto selecionado para exibir informações
  const selectedProductInfo = products.find((p) => p.itemId === selectedProduct)

  return (
    <div
      className={`grid ${
        isFullscreen && previewMode === "tiktok" && activeTab === "preview"
          ? "grid-cols-1"
          : "grid-cols-1 lg:grid-cols-2"
      } gap-6 mt-6`}
    >
      {/* Formulário de geração - escondido no modo fullscreen */}
      {!(isFullscreen && previewMode === "tiktok" && activeTab === "preview") && (
        <Card>
          <CardHeader>
            <CardTitle>Gerador de Cards</CardTitle>
            <CardDescription>Crie cards para TikTok a partir de produtos da Shopee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Selecione o Produto</Label>
              <ProductSelector products={products} value={selectedProduct} onChange={setSelectedProduct} />

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
              <div className="flex items-center justify-between">
                <Label htmlFor="useAI">Usar IA para Descrição</Label>
                <Switch id="useAI" checked={useAI} onCheckedChange={setUseAI} />
              </div>
              {!useAI && (
                <div>
                  <Textarea
                    placeholder="Digite uma descrição personalizada para o produto (máximo 150 caracteres)"
                    value={customDescription}
                    onChange={(e) => {
                      // Limitar a 150 caracteres
                      if (e.target.value.length <= 150) {
                        setCustomDescription(e.target.value)
                      }
                    }}
                    className="min-h-[100px]"
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {customDescription.length}/150 caracteres
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoStyle">Estilo do Card</Label>
              <Select value={videoStyle} onValueChange={setVideoStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estilo do card" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Retrato (9:16)</SelectItem>
                  <SelectItem value="square">Quadrado (1:1)</SelectItem>
                  <SelectItem value="landscape">Paisagem (16:9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recordingDuration">Duração do Vídeo (segundos)</Label>
              <Select
                value={recordingDuration.toString()}
                onValueChange={(value) => setRecordingDuration(Number(value))}
              >
                <SelectTrigger id="recordingDuration">
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 segundos</SelectItem>
                  <SelectItem value="5">5 segundos</SelectItem>
                  <SelectItem value="7">7 segundos</SelectItem>
                  <SelectItem value="10">10 segundos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isGenerating && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>{generationStep}</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={!selectedProduct || isGenerating}
              className="w-full relative"
              variant={selectedProduct ? "default" : "outline"}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  {selectedProduct ? "Gerar Card" : "Selecione um produto"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Preview Card */}
      <Card className={`${isFullscreen ? "h-screen w-full fixed inset-0 z-50 bg-background" : "h-auto"} flex flex-col`}>
        <CardHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Visualize e exporte seu card gerado</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {activeTab === "preview" && htmlTemplate && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-8 w-8"
                    title={isFullscreen ? "Minimizar" : "Maximizar"}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Label htmlFor="previewMode" className="text-sm">
                    Modo:
                  </Label>
                  <Select value={previewMode} onValueChange={(value: "standard" | "tiktok") => setPreviewMode(value)}>
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue placeholder="Modo de preview" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Padrão</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="video">Vídeo</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="p-4 flex-grow overflow-hidden">
              {htmlTemplate ? (
                <div className="flex flex-col items-center justify-center h-full">
                  {previewMode === "tiktok" ? (
                    <div
                      ref={tiktokPreviewRef}
                      className="tiktok-preview-container bg-black relative overflow-hidden"
                      style={{
                        width: "375px",
                        height: "667px",
                        maxHeight: isFullscreen ? "90vh" : "667px",
                        margin: "0 auto",
                      }}
                    >
                      {/* TikTok UI Header */}
                      <div className="w-full bg-black text-white p-2 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">TikTok Preview</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm">@sentinnell</span>
                        </div>
                      </div>

                      {/* TikTok Video Container - Proporção exata 9:16 */}
                      <div className="relative w-full" style={{ height: "calc(100% - 80px)" }}>
                        <div className="w-full h-full overflow-hidden relative">
                          {previewError ? (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <p className="text-muted-foreground text-center">
                                Não foi possível renderizar o preview. <br />
                                Use o botão "Abrir em Nova Aba" para visualizar o card.
                              </p>
                            </div>
                          ) : (
                            <div ref={previewContainerRef} className="w-full h-full overflow-hidden" />
                          )}
                        </div>

                        {/* TikTok Side Buttons */}
                        <div className="absolute right-2 bottom-20 flex flex-col items-center space-y-4">
                          <div className="flex flex-col items-center">
                            <Heart className="h-8 w-8 text-white" />
                            <span className="text-white text-xs mt-1">12.3K</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <MessageCircle className="h-8 w-8 text-white" />
                            <span className="text-white text-xs mt-1">423</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Bookmark className="h-8 w-8 text-white" />
                            <span className="text-white text-xs mt-1">2.1K</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Share2 className="h-8 w-8 text-white" />
                            <span className="text-white text-xs mt-1">Share</span>
                          </div>
                        </div>
                      </div>

                      {/* TikTok Bottom Bar */}
                      <div className="w-full bg-black text-white p-2 flex justify-around items-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs">Para você</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs">Seguindo</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs">Pesquisar</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="standard-preview-container w-full max-w-2xl mx-auto">
                      <div className="w-full h-[500px] overflow-hidden border rounded-lg relative bg-white">
                        {previewError ? (
                          <div className="flex items-center justify-center h-full bg-muted">
                            <p className="text-muted-foreground text-center">
                              Não foi possível renderizar o preview. <br />
                              Use o botão "Abrir em Nova Aba" para visualizar o card.
                            </p>
                          </div>
                        ) : (
                          <div ref={previewContainerRef} className="w-full h-full overflow-hidden" />
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 w-full">
                        <Button variant="outline" onClick={handleTakeScreenshot} className="flex-1">
                          <Camera className="mr-2 h-4 w-4" />
                          Abrir para Screenshot
                        </Button>
                        <Button variant="outline" onClick={() => window.open(previewUrl, "_blank")} className="flex-1">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir em Nova Aba
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Video className="mx-auto h-12 w-12 mb-2" />
                  <p>Gere um card para visualizá-lo aqui</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="video" className="p-4">
              {htmlTemplate ? (
                <div className="flex flex-col items-center">
                  <VideoRecorder
                    htmlContent={htmlTemplate}
                    productId={selectedProduct}
                    duration={recordingDuration}
                    onRecordingComplete={handleRecordingComplete}
                  />

                  {videoUrl && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      <p>Vídeo gerado com sucesso! Você pode baixá-lo e usá-lo no TikTok.</p>
                      <p className="mt-2">
                        <strong>Dica:</strong> O vídeo está no formato WebM, que é compatível com o TikTok. Se precisar
                        converter para MP4, você pode usar ferramentas online gratuitas como o{" "}
                        <a
                          href="https://cloudconvert.com/webm-to-mp4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          CloudConvert
                        </a>
                        .
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p>Gere um card primeiro para criar um vídeo</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="html" className="p-4">
              {htmlTemplate ? (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs">{htmlTemplate}</pre>
                    <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={handleCopyHtml}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você pode copiar este HTML e salvá-lo como um arquivo .html para abrir no seu navegador. Tire um
                    screenshot ou gravação de tela para criar seu vídeo do TikTok.
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p>Gere um card para ver o código HTML</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between flex-shrink-0">
          <Button variant="outline" disabled={!htmlTemplate} onClick={handleCopyHtml}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar HTML
          </Button>
          <Button variant="outline" disabled={!htmlTemplate} onClick={handleDownloadHtml}>
            <Download className="mr-2 h-4 w-4" />
            Baixar HTML
          </Button>
          <Button
            disabled={!htmlTemplate}
            onClick={() => setActiveTab("video")}
            variant={activeTab === "video" ? "default" : "outline"}
          >
            <Video className="mr-2 h-4 w-4" />
            Gravar Vídeo
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Função para criar descrição de fallback
function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  // Criar uma descrição curta e direta
  const urgency = sales > 1000 ? "🔥 OFERTA IMPERDÍVEL!" : "⚡ PROMOÇÃO!"
  const rating = "⭐".repeat(Math.min(Math.round(stars), 5))

  // Limitar o nome do produto a 30 caracteres
  const shortName = product.productName.length > 30 ? product.productName.substring(0, 30) + "..." : product.productName

  return `${urgency}\n${shortName}\n${rating}\nApenas R$${price.toFixed(2)}\nJá vendidos: ${sales}\n#oferta #shopee`
}

// Função para renderizar o template do card
function renderProductCardTemplate(product: any, description: string, style = "portrait") {
  if (!product) {
    console.error("Product is undefined or null in renderProductCardTemplate")
    throw new Error("Product is required to render template")
  }

  console.log(`Rendering template for product: ${product.itemId} with style: ${style}`)

  // Garantir que temos valores válidos para todos os campos necessários
  const productName = product.productName || "Produto sem nome"
  const imageUrl = product.imageUrl || "/diverse-products-still-life.png"
  const offerLink = product.offerLink || "#"

  // Usar o preço original calculado ou o preço atual se não houver desconto
  const currentPrice = Number.parseFloat(product.price || "0")
  const originalPrice = product.calculatedOriginalPrice ? Number.parseFloat(product.calculatedOriginalPrice) : null

  // Calcular a porcentagem de desconto se tivermos o preço original
  let discountPercentage = null
  if (originalPrice && originalPrice > currentPrice) {
    discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
  } else if (product.priceDiscountRate) {
    // Ou usar diretamente a taxa de desconto da API
    discountPercentage = Math.round(Number.parseFloat(product.priceDiscountRate))
  }

  // Garantir que temos uma descrição válida
  const safeDescription = description || "Descrição não disponível"

  // Garantir que temos valores válidos para avaliação e vendas
  const ratingStar = product.ratingStar || "4.5"
  const sales = product.sales || "0"

  // Configurações de estilo baseadas no formato escolhido
  const styleConfig = getStyleConfig(style)

  // Adicionar prefixo a todas as classes CSS para evitar conflitos
  return `<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Card Produto TikTok</title>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap" rel="stylesheet" />
  <style>
    /* Reset e configurações básicas */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Bruno Ace SC', sans-serif;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #0f0f0f;
    }

    .sm-card-container {
      width: 100%;
      height: 100%;
      background: #0f0f0f;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      aspect-ratio: ${style === "portrait" ? "9/16" : style === "square" ? "1/1" : "16/9"};
    }

    /* Background animado */
    .sm-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, #6a00f4, #00e0ff, #6a00f4);
      background-size: 400% 400%;
      animation: sm-gradientBG 8s ease infinite;
      opacity: 0.15;
      z-index: 0;
    }

    @keyframes sm-gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Logo */
    .sm-logo {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a);
      background-size: 300% 300%;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      -webkit-text-fill-color: transparent;
      animation: sm-logoGradient 5s ease infinite;
      filter: drop-shadow(0 2px 12px #b155ff88);
    }

    @keyframes sm-logoGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Card principal */
    .sm-card {
      position: relative;
      width: ${styleConfig.cardWidth};
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: ${styleConfig.cardPadding};
      z-index: 1;
      background: rgba(15, 15, 15, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 25px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    /* Imagem do produto */
    .sm-product-image-container {
      width: 100%;
      height: ${styleConfig.imageHeight};
      margin: 15px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border-radius: 15px;
    }

    .sm-product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    /* Título do produto */
    .sm-product-title {
      font-size: ${styleConfig.fontSize.title};
      line-height: 1.2;
      text-align: center;
      margin-bottom: 15px;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      padding: 0 10px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Preço */
    .sm-price-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 15px 0;
      flex-wrap: wrap;
      gap: 10px;
    }

    .sm-current-price {
      font-size: ${styleConfig.fontSize.price};
      color: #ff0055;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .sm-original-price {
      font-size: ${styleConfig.fontSize.oldPrice};
      color: #cccccc;
      text-decoration: line-through;
      opacity: 0.7;
    }

    .sm-discount-badge {
      background: #ff0055;
      color: white;
      font-size: ${styleConfig.fontSize.discount};
      padding: 8px 15px;
      border-radius: 50%;
      margin-left: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    /* Descrição */
    .sm-product-description {
      font-size: ${styleConfig.fontSize.desc};
      color: #cccccc;
      margin: 15px 0;
      text-align: center;
      white-space: pre-line;
      max-height: ${styleConfig.descriptionHeight};
      overflow-y: auto;
      padding: 0 10px;
    }

    /* Informações adicionais */
    .sm-product-info {
      font-size: ${styleConfig.fontSize.info};
      margin: 10px 0;
      color: #cccccc;
    }

    .sm-star-rating {
      color: #ffd700;
    }

    /* Botão de compra */
    .sm-buy-button {
      display: inline-block;
      margin-top: 20px;
      padding: 15px 40px;
      background: linear-gradient(80deg, #c21244, #15e4ffb1);
      color: #ffffff;
      border-radius: 30px;
      text-decoration: none;
      font-size: ${styleConfig.fontSize.button};
      text-align: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .sm-buy-button:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
    }
  </style>
</head>

<body>
  <div class="sm-card-container">
    <div class="sm-background"></div>
    <div class="sm-logo">Sales Martins</div>
    
    <div class="sm-card">
      <h1 class="sm-product-title">${productName}</h1>
      
      <div class="sm-product-image-container">
        <img src="${imageUrl}" alt="${productName}" class="sm-product-image" />
      </div>
      
      <div class="sm-price-container">
        <p class="sm-current-price">R$ ${currentPrice.toFixed(2)}</p>
        ${originalPrice ? `<p class="sm-original-price">R$ ${originalPrice.toFixed(2)}</p>` : ""}
        ${discountPercentage ? `<span class="sm-discount-badge">-${discountPercentage}%</span>` : ""}
      </div>
      
      <p class="sm-product-description">${safeDescription}</p>
      
      <p class="sm-product-info">
        <span class="sm-star-rating">★★★★★</span> ${ratingStar || "4.5"} | Vendas: ${sales}+
      </p>
      
      <a href="${offerLink}" target="_blank" class="sm-buy-button">COMPRAR AGORA</a>
    </div>
  </div>
</body>
</html>`
}

// Função para obter configurações de estilo baseadas no formato escolhido
function getStyleConfig(style: string) {
  // Configurações padrão (retrato)
  const config = {
    width: "100%",
    height: "100%",
    cardWidth: "90%",
    cardPadding: "30px",
    imageHeight: "500px",
    descriptionHeight: "200px",
    fontSize: {
      title: "42px",
      price: "56px",
      oldPrice: "32px",
      discount: "28px",
      desc: "32px",
      info: "28px",
      button: "32px",
    },
  }

  // Ajustar configurações com base no estilo
  if (style === "square") {
    config.imageHeight = "400px"
    config.descriptionHeight = "150px"
    config.fontSize = {
      title: "36px",
      price: "48px",
      oldPrice: "28px",
      discount: "24px",
      desc: "28px",
      info: "24px",
      button: "28px",
    }
  } else if (style === "landscape") {
    config.cardWidth = "80%"
    config.cardPadding = "25px"
    config.imageHeight = "450px"
    config.descriptionHeight = "120px"
    config.fontSize = {
      title: "40px",
      price: "52px",
      oldPrice: "30px",
      discount: "26px",
      desc: "30px",
      info: "26px",
      button: "30px",
    }
  }

  return config
}
