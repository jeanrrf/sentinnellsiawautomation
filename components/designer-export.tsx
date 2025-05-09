"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Video } from "lucide-react"
import { ProductSelector } from "@/components/product-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

/**
 * DesignerExport - Componente principal para criação e geração de cards para TikTok
 *
 * Este componente permite:
 * 1. Selecionar um produto da loja
 * 2. Gerar uma descrição usando IA ou personalizada
 * 3. Escolher o estilo do card (retrato, quadrado, paisagem)
 * 4. Visualizar o card em formato TikTok
 * 5. Gravar um vídeo do card para publicação
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

  // Estados para configuração do card
  const [useAI, setUseAI] = useState(true)
  const [customDescription, setCustomDescription] = useState("")
  const [videoStyle, setVideoStyle] = useState("portrait")

  // Estados para controle da interface
  const [activeTab, setActiveTab] = useState("preview")
  const [previewError, setPreviewError] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(5)

  // Referências para manipulação do DOM
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const tiktokPreviewRef = useRef<HTMLDivElement>(null)

  // Hook de toast para notificações
  const { toast } = useToast()

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

  // Ajustar o layout do preview do TikTok quando o tamanho da tela mudar
  useEffect(() => {
    const adjustTikTokPreview = () => {
      if (tiktokPreviewRef.current) {
        const container = tiktokPreviewRef.current

        // Definir largura fixa e calcular altura para manter proporção 9:16
        const containerWidth = 375 // Largura fixa de um celular típico
        const containerHeight = containerWidth * (16 / 9)

        container.style.width = `${containerWidth}px`
        container.style.height = `${containerHeight}px`
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
  }, [activeTab])

  /**
   * Simula o progresso da geração do card
   * Usado para feedback visual durante o processo de geração
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
   * Faz a requisição para a API e atualiza o estado com o resultado
   */
  const handleGenerate = async () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar card",
        description: "Selecione um produto primeiro",
        className: "bg-red-100 border-red-500 text-red-800", // Estilo semáforo para erro
      })
      return
    }

    setIsGenerating(true)
    setGenerationStep("Iniciando geração do card...")
    const stopProgress = simulateProgress()

    try {
      console.log("Gerando card para o produto:", selectedProduct)

      setGenerationStep("Buscando informações do produto...")

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
      setPreviewUrl(`/api/preview/${selectedProduct}?style=${videoStyle}&t=${Date.now()}`)

      setGenerationProgress(100)

      // Mudar para a aba de preview automaticamente
      setActiveTab("preview")

      toast({
        title: "Card gerado com sucesso",
        description: "Você pode visualizar o card na aba de preview",
        className: "bg-green-100 border-green-500 text-green-800 fixed top-4 left-1/2 transform -translate-x-1/2 z-50", // Estilo semáforo para sucesso
      })
    } catch (error: any) {
      console.error("Erro ao gerar vídeo:", error)
      setGenerationProgress(0)
      toast({
        variant: "destructive",
        title: "Erro ao gerar o card",
        description: error.message,
        className: "bg-red-100 border-red-500 text-red-800 fixed top-4 left-1/2 transform -translate-x-1/2 z-50", // Estilo semáforo para erro
      })
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
   * Simula a gravação e salva o vídeo no Redis
   */
  const handleRecordVideo = async () => {
    if (!previewUrl) {
      toast({
        variant: "destructive",
        title: "Erro ao gravar vídeo",
        description: "Gere um card primeiro",
        className: "bg-red-100 border-red-500 text-red-800 fixed top-4 left-1/2 transform -translate-x-1/2 z-50", // Estilo semáforo para erro
      })
      return
    }

    setIsRecording(true)

    try {
      // Simular gravação de vídeo
      toast({
        title: "Gravando vídeo",
        description: `Gravando vídeo de ${recordingDuration} segundos...`,
        className:
          "bg-yellow-100 border-yellow-500 text-yellow-800 fixed top-4 left-1/2 transform -translate-x-1/2 z-50", // Estilo semáforo para aviso
      })

      // Simular tempo de gravação
      await new Promise((resolve) => setTimeout(resolve, recordingDuration * 1000))

      // Simular salvamento no Redis
      const response = await fetch("/api/save-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          duration: recordingDuration,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao salvar o vídeo")
      }

      toast({
        title: "Vídeo gravado com sucesso",
        description: "O vídeo foi salvo e está pronto para ser publicado",
        className: "bg-green-100 border-green-500 text-green-800 fixed top-4 left-1/2 transform -translate-x-1/2 z-50", // Estilo semáforo para sucesso
      })
    } catch (error: any) {
      console.error("Erro ao gravar vídeo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gravar vídeo",
        description: error.message,
        className: "bg-red-100 border-red-500 text-red-800 fixed top-4 left-1/2 transform -translate-x-1/2 z-50", // Estilo semáforo para erro
      })
    } finally {
      setIsRecording(false)
    }
  }

  return (
    // Layout comprimido com menos espaço entre elementos
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
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
            <ProductSelector products={products} value={selectedProduct} onChange={setSelectedProduct} />

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

      {/* Preview Card - Simplificado apenas para TikTok */}
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
                      width: "375px",
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
                        Ao clicar em "Gravar Vídeo", o sistema irá capturar o card por {recordingDuration} segundos e
                        salvar o vídeo para publicação posterior.
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
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
