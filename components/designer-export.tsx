"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Video, AlertCircle, ExternalLink, Copy } from "lucide-react"
import { ProductSelector } from "@/components/product-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { VideoGeneratorPro } from "@/components/video-generator-pro"

/**
 * DesignerExport - Componente principal para criação e geração de cards para TikTok
 */
export function DesignerExport() {
  // Estados para controle de produtos e seleção
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [error, setError] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")

  // Estados para geração de cards
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [htmlTemplate, setHtmlTemplate] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoGenerated, setVideoGenerated] = useState(false)
  const [videoData, setVideoData] = useState<any>(null)

  // Estados para configuração do card
  const [useAI, setUseAI] = useState(true)
  const [customDescription, setCustomDescription] = useState("")
  const [videoStyle, setVideoStyle] = useState("portrait")

  // Estados para controle da interface
  const [activeTab, setActiveTab] = useState("preview")
  const [previewError, setPreviewError] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(5)

  // Estado para mensagens de toast
  const [toastMessage, setToastMessage] = useState<{
    title: string
    description: string
    variant?: "default" | "destructive"
    visible: boolean
  } | null>(null)

  // Referências para manipulação do DOM
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const tiktokPreviewRef = useRef<HTMLDivElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // Verificar se o ToastProvider está disponível
  const { toast } = useToast()
  const toastAvailable = true
  // try {
  //   // eslint-disable-next-line react-hooks/rules-of-hooks
  //   const { toast } = useToast()
  //   toastAvailable = true
  // } catch (e) {
  //   toastAvailable = false
  // }

  // Função para mostrar toast
  const showToast = (title: string, description: string, variant?: "default" | "destructive") => {
    if (toastAvailable) {
      try {
        toast({
          title,
          description,
          variant,
        })
      } catch (e) {
        console.error("Erro ao mostrar toast:", e)
      }
    } else {
      // Fallback para quando o ToastProvider não está disponível
      setToastMessage({
        title,
        description,
        variant,
        visible: true,
      })

      // Esconder o toast após 3 segundos
      setTimeout(() => {
        setToastMessage(null)
      }, 3000)
    }
  }

  // Buscar produtos ao carregar o componente
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError("")

        const response = await fetch("/api/products")

        if (!response.ok) {
          throw new Error(`Falha ao buscar produtos: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setProducts(data.products || [])
      } catch (err: any) {
        setError(err.message || "Ocorreu um erro ao buscar produtos")
        console.error("Erro ao buscar produtos:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Limpar o preview quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = ""
      }
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = ""
      }
    }
  }, [])

  // Renderizar o preview de forma isolada
  useEffect(() => {
    if (htmlTemplate && previewContainerRef.current) {
      try {
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
          }
        }

        // Iniciar o carregamento
        iframe.src = "about:blank"

        setPreviewError(false)
      } catch (error) {
        console.error("Erro ao renderizar preview:", error)
        setPreviewError(true)
      }
    }
  }, [htmlTemplate])

  // Renderizar o vídeo quando gerado
  useEffect(() => {
    if (videoGenerated && htmlTemplate && videoContainerRef.current) {
      try {
        // Limpar o conteúdo anterior
        videoContainerRef.current.innerHTML = ""

        // Criar um iframe isolado para o vídeo
        const iframe = document.createElement("iframe")
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        iframe.style.border = "none"
        iframe.style.overflow = "hidden"
        iframe.title = "Video Preview"
        iframe.sandbox.add("allow-same-origin")

        // Adicionar ao container
        videoContainerRef.current.appendChild(iframe)

        // Escrever o conteúdo no iframe após ele ser carregado
        iframe.onload = () => {
          if (iframe.contentDocument) {
            iframe.contentDocument.open()
            iframe.contentDocument.write(htmlTemplate)
            iframe.contentDocument.close()
          }
        }

        // Iniciar o carregamento
        iframe.src = "about:blank"
      } catch (error) {
        console.error("Erro ao renderizar vídeo:", error)
      }
    }
  }, [videoGenerated, htmlTemplate, activeTab])

  /**
   * Simula o progresso da geração do card
   */
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

  /**
   * Manipula a geração do card
   */
  const handleGenerate = async () => {
    if (!selectedProduct) {
      showToast("Erro ao gerar card", "Selecione um produto primeiro", "destructive")
      return
    }

    setIsGenerating(true)
    setGenerationStep("Iniciando geração do card...")
    const stopProgress = simulateProgress()
    setVideoGenerated(false)

    try {
      console.log("Gerando card para o produto:", selectedProduct)

      setGenerationStep("Buscando informações do produto...")

      // Verificar se o produto existe na lista
      const productExists = products.some((p) => p.itemId === selectedProduct)
      if (!productExists) {
        throw new Error(`Produto com ID ${selectedProduct} não encontrado na lista de produtos.`)
      }

      // Fazer a requisição para a API de geração de vídeo
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          useAI,
          customDescription: useAI ? undefined : customDescription,
          videoStyle,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao gerar vídeo: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Falha ao gerar vídeo")
      }

      setHtmlTemplate(data.htmlTemplate)
      const timestamp = Date.now()
      setPreviewUrl(`/api/preview/${selectedProduct}?style=${videoStyle}&t=${timestamp}`)

      setGenerationProgress(100)

      // Mudar para a aba de preview automaticamente
      setActiveTab("preview")

      showToast("Card gerado com sucesso", "Você pode visualizar o card na aba de preview")
    } catch (error: any) {
      console.error("Erro ao gerar vídeo:", error)
      setGenerationProgress(0)
      showToast("Erro ao gerar o card", error.message, "destructive")
    } finally {
      stopProgress()
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationStep(null)
      }, 500)
    }
  }

  /**
   * Manipula a gravação do vídeo
   */
  const handleRecordVideo = async () => {
    if (!previewUrl || !htmlTemplate) {
      showToast("Erro ao gravar vídeo", "Gere um card primeiro", "destructive")
      return
    }

    setIsRecording(true)

    try {
      // Simular gravação de vídeo
      showToast("Gravando vídeo", `Gravando vídeo de ${recordingDuration} segundos...`)

      // Simular tempo de gravação
      await new Promise((resolve) => setTimeout(resolve, recordingDuration * 1000))

      // Verificar se o produto existe na lista
      const productExists = products.some((p) => p.itemId === selectedProduct)
      if (!productExists) {
        throw new Error(`Produto com ID ${selectedProduct} não encontrado na lista de produtos.`)
      }

      // Simular salvamento no Redis
      const response = await fetch("/api/save-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          duration: recordingDuration,
          htmlTemplate: htmlTemplate, // Passar o HTML template diretamente
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao salvar o vídeo")
      }

      const data = await response.json()

      if (data.success && data.video) {
        // Definir a URL do vídeo para exibição
        setVideoUrl(data.video.videoUrl)
        setVideoData(data.video)
        setVideoGenerated(true)

        // Mudar para a aba de vídeo para mostrar o resultado
        setActiveTab("video")
      }

      showToast("Vídeo gravado com sucesso", "O vídeo foi salvo e está pronto para ser publicado")
    } catch (error: any) {
      console.error("Erro ao gravar vídeo:", error)
      showToast("Erro ao gravar vídeo", error.message, "destructive")
    } finally {
      setIsRecording(false)
    }
  }

  // Função para abrir o preview em uma nova janela
  const openPreviewInNewWindow = () => {
    if (!previewUrl) return

    // Criar uma nova janela com o tamanho adequado para o estilo selecionado
    let width = 1080
    let height = 1920

    if (videoStyle === "square") {
      width = 1080
      height = 1080
    } else if (videoStyle === "landscape") {
      width = 1920
      height = 1080
    }

    // Ajustar para caber na tela
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height

    if (width > screenWidth * 0.9) {
      const ratio = width / height
      width = Math.floor(screenWidth * 0.9)
      height = Math.floor(width / ratio)
    }

    if (height > screenHeight * 0.9) {
      const ratio = width / height
      height = Math.floor(screenHeight * 0.9)
      width = Math.floor(height * ratio)
    }

    const left = Math.floor((screenWidth - width) / 2)
    const top = Math.floor((screenHeight - height) / 2)

    window.open(
      previewUrl,
      "preview",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    )
  }

  // Função para copiar o link do preview
  const copyPreviewLink = () => {
    if (!previewUrl) return

    navigator.clipboard
      .writeText(window.location.origin + previewUrl)
      .then(() => {
        showToast("Link copiado", "O link do preview foi copiado para a área de transferência")
      })
      .catch((err) => {
        console.error("Erro ao copiar link:", err)
        showToast("Erro ao copiar link", "Não foi possível copiar o link para a área de transferência", "destructive")
      })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_375px] gap-4 mt-2">
      {/* Toast fallback quando o ToastProvider não está disponível */}
      {toastMessage && toastMessage.visible && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-md shadow-md ${
            toastMessage.variant === "destructive"
              ? "bg-red-100 border border-red-500 text-red-800"
              : "bg-green-100 border border-green-500 text-green-800"
          }`}
        >
          <div className="font-medium">{toastMessage.title}</div>
          <div className="text-sm">{toastMessage.description}</div>
        </div>
      )}

      {/* Formulário de geração */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Designer de Cards</CardTitle>
          <CardDescription className="text-xs">Crie cards personalizados para TikTok</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-1">
            <Label htmlFor="product" className="text-sm">
              Selecione o Produto
            </Label>
            <ProductSelector
              products={products}
              value={selectedProduct}
              onChange={(value) => {
                setSelectedProduct(value)
                // Clear any previous errors when selecting a new product
                setError("")
              }}
              disabled={isGenerating}
              placeholder="Selecione um produto para gerar o card"
            />

            {selectedProduct && products.find((p) => p.itemId === selectedProduct) && (
              <div className="mt-1 p-2 bg-muted rounded-md">
                <p className="font-medium text-xs">Produto selecionado:</p>
                <p className="text-xs truncate">{products.find((p) => p.itemId === selectedProduct)?.productName}</p>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Preço: R$ {products.find((p) => p.itemId === selectedProduct)?.price}</span>
                  <span>Vendas: {products.find((p) => p.itemId === selectedProduct)?.sales}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="useAI" className="text-sm">
                Usar IA para Descrição
              </Label>
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
                  className="min-h-[80px] text-sm"
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {customDescription.length}/150 caracteres
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="videoStyle" className="text-sm">
              Estilo do Card
            </Label>
            <Select value={videoStyle} onValueChange={setVideoStyle}>
              <SelectTrigger id="videoStyle" className="h-8 text-sm">
                <SelectValue placeholder="Selecione o estilo do card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato (9:16)</SelectItem>
                <SelectItem value="square">Quadrado (1:1)</SelectItem>
                <SelectItem value="landscape">Paisagem (16:9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="recordingDuration" className="text-sm">
              Duração do Vídeo (segundos)
            </Label>
            <Select
              value={recordingDuration.toString()}
              onValueChange={(value) => setRecordingDuration(Number.parseInt(value))}
            >
              <SelectTrigger id="recordingDuration" className="h-8 text-sm">
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
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs">
                <span>{generationStep}</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-1" />
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <Button onClick={handleGenerate} disabled={!selectedProduct || isGenerating} className="w-full h-9 text-sm">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Video className="mr-2 h-3 w-3" />
                Gerar Card
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview Card - Layout fixo para TikTok */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Preview TikTok</CardTitle>
                <CardDescription className="text-xs">Visualize seu card no formato TikTok</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="w-full flex-shrink-0">
                <TabsTrigger value="preview" className="text-sm">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="video" className="text-sm">
                  Vídeo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="p-4 flex-grow overflow-hidden">
                {htmlTemplate ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div
                      ref={tiktokPreviewRef}
                      className="tiktok-preview-container bg-black relative overflow-hidden"
                      style={{
                        width: "100%",
                        maxWidth: "375px",
                        height: "667px",
                        margin: "0 auto",
                      }}
                    >
                      {/* TikTok UI Header */}
                      <div className="w-full bg-black text-white p-2 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">TikTok Preview</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm">@autoseller</span>
                        </div>
                      </div>

                      {/* TikTok Video Container - Proporção exata 9:16 */}
                      <div className="relative w-full" style={{ height: "calc(100% - 80px)" }}>
                        <div className="w-full h-full overflow-hidden relative">
                          {previewError ? (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <p className="text-muted-foreground text-center text-sm">
                                Não foi possível renderizar o preview. <br />
                                Tente gerar o card novamente.
                              </p>
                            </div>
                          ) : (
                            <div ref={previewContainerRef} className="w-full h-full overflow-hidden" />
                          )}
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

                    {/* Botões de ação para o preview */}
                    {previewUrl && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={openPreviewInNewWindow} className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir em Nova Janela
                        </Button>
                        <Button size="sm" variant="outline" onClick={copyPreviewLink} className="text-xs">
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar Link
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Video className="mx-auto h-12 w-12 mb-2" />
                    <p className="text-sm">Gere um card para visualizá-lo aqui</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="video" className="p-4">
                <div className="flex flex-col gap-4">
                  {videoGenerated ? (
                    <div className="space-y-4">
                      <div
                        className="bg-black rounded-lg overflow-hidden"
                        style={{ maxWidth: "375px", margin: "0 auto" }}
                      >
                        {/* Exibir o preview do card como vídeo */}
                        <div className="w-full aspect-[9/16] relative">
                          {/* Usar um container para o vídeo */}
                          <div ref={videoContainerRef} className="absolute inset-0 bg-white"></div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={openPreviewInNewWindow} className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir em Nova Janela
                        </Button>
                        <Button size="sm" variant="outline" onClick={copyPreviewLink} className="text-xs">
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar Link
                        </Button>
                      </div>
                      <Alert className="bg-green-50 border-green-200">
                        <AlertCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-xs text-green-800">
                          Vídeo gerado com sucesso! O produto foi removido da lista de produtos disponíveis e o vídeo
                          foi salvo para publicação.
                        </AlertDescription>
                      </Alert>
                      {videoData && (
                        <div className="text-xs space-y-1 bg-gray-50 p-2 rounded-md">
                          <p>
                            <strong>Produto:</strong> {videoData.productName}
                          </p>
                          <p>
                            <strong>Duração:</strong> {videoData.duration} segundos
                          </p>
                          <p>
                            <strong>Criado em:</strong>{" "}
                            {new Date(videoData.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Gravação de Vídeo</CardTitle>
                        <CardDescription className="text-xs">
                          Grave um vídeo do card para publicação no TikTok
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <p className="text-sm">
                            Ao clicar em "Gravar Vídeo", o sistema irá capturar o card por {recordingDuration} segundos
                            e salvar o vídeo para publicação posterior.
                          </p>

                          <Alert>
                            <AlertDescription className="text-xs">
                              Certifique-se de que o card está gerado e visível na aba Preview antes de gravar o vídeo.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          onClick={handleRecordVideo}
                          disabled={!htmlTemplate || isRecording}
                          className="w-full h-9 text-sm"
                        >
                          {isRecording ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Gravando ({recordingDuration}s)...
                            </>
                          ) : (
                            <>
                              <Video className="mr-2 h-3 w-3" />
                              Gravar Vídeo
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <VideoGeneratorPro products={products} />
    </div>
  )
}
