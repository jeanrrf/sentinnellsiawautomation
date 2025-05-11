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
  ImageIcon,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Download,
  FileText,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { ProductSelector } from "@/components/product-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

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
  const [cardUrl, setCardUrl] = useState("")
  const [cardGenerated, setCardGenerated] = useState(false)
  const [cardData, setCardData] = useState<any>(null)

  // Estados para configuração do card
  const [useAI, setUseAI] = useState(true)
  const [customDescription, setCustomDescription] = useState("")
  const [cardStyle, setCardStyle] = useState("portrait")

  // Estados para controle da interface
  const [activeTab, setActiveTab] = useState("preview")
  const [previewError, setPreviewError] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [compactMode, setCompactMode] = useState(true)

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
  const cardContainerRef = useRef<HTMLDivElement>(null)

  // Verificar se o ToastProvider está disponível
  const { toast } = useToast()
  const toastAvailable = true

  // Add these new states to the component
  const [postDescription, setPostDescription] = useState("")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

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
      if (cardContainerRef.current) {
        cardContainerRef.current.innerHTML = ""
      }
    }
  }, [])

  // Renderizar o preview de forma isolada
  useEffect(() => {
    console.log("Tentando renderizar preview. HTML Template existe?", !!htmlTemplate)

    if (htmlTemplate && previewContainerRef.current) {
      try {
        console.log("Renderizando preview com template HTML")
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

        setTimeout(() => {
          const iframe = previewContainerRef.current?.querySelector("iframe")
          if (iframe && iframe.contentDocument) {
            const content = iframe.contentDocument.body.innerHTML
            console.log("Conteúdo do iframe:", content ? "Preenchido" : "Vazio")

            if (!content || content.trim() === "") {
              console.error("Iframe está vazio após renderização")
              setPreviewError(true)
              showToast(
                "Erro de renderização",
                "O preview não foi renderizado corretamente. Tente gerar novamente.",
                "destructive",
              )
            }
          }
        }, 500)

        setPreviewError(false)
      } catch (error) {
        console.error("Erro ao renderizar preview:", error)
        console.error("Detalhes do erro:", JSON.stringify(error, null, 2))
        setPreviewError(true)

        // Mostrar toast com erro
        showToast(
          "Erro ao renderizar preview",
          "Ocorreu um erro ao renderizar o preview. Verifique o console para mais detalhes.",
          "destructive",
        )
      }
    }
  }, [htmlTemplate])

  // Add this new function to generate post description
  const generatePostDescription = (product) => {
    if (!product) return ""

    const price = Number.parseFloat(product.price)
    const productName = product.productName || "Produto"
    const offerLink = product.offerLink || "#"

    return `🔥 SUPER OFERTA! 🔥

${productName}

💰 Apenas R$${price.toFixed(2)}
🛒 Produto de alta qualidade com ótimo preço!

📲 LINK NA BIO ou acesse diretamente:
${offerLink}

#oferta #shopee #desconto #promocao`
  }

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
    setCardGenerated(false)
    setIsPreviewLoading(true)

    try {
      console.log("Gerando card para o produto:", selectedProduct)

      setGenerationStep("Buscando informações do produto...")

      // Verificar se o produto existe na lista
      const productExists = products.some((p) => p.itemId === selectedProduct)
      if (!productExists) {
        throw new Error(`Produto com ID ${selectedProduct} não encontrado na lista de produtos.`)
      }

      // Fazer a requisição para a API de geração de card
      const response = await fetch("/api/generate-product-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          useAI,
          customDescription: useAI ? undefined : customDescription,
          style: cardStyle,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao gerar card: ${response.status} ${response.statusText}`)
      }

      // Check if the response is HTML
      const contentType = response.headers.get("Content-Type") || ""

      if (contentType.includes("text/html")) {
        // Get the HTML content
        const htmlContent = await response.text()
        setHtmlTemplate(htmlContent)

        // Create a data URL for preview
        const htmlBlob = new Blob([htmlContent], { type: "text/html" })
        const imageUrl = URL.createObjectURL(htmlBlob)
        setCardUrl(imageUrl)
      } else {
        // Handle as before for backward compatibility
        const imageBlob = await response.blob()
        const imageUrl = URL.createObjectURL(imageBlob)
        setCardUrl(imageUrl)
      }

      // Também buscar o HTML para preview
      const previewResponse = await fetch(`/api/preview/${selectedProduct}?style=${cardStyle}`)
      if (previewResponse.ok) {
        const htmlContent = await previewResponse.text()
        setHtmlTemplate(htmlContent)
      }

      const timestamp = Date.now()
      setPreviewUrl(`/api/preview/${selectedProduct}?style=${cardStyle}&t=${timestamp}`)

      setGenerationProgress(100)
      setCardGenerated(true)

      // Generate post description
      const selectedProductData = products.find((p) => p.itemId === selectedProduct)
      if (selectedProductData) {
        const generatedDescription = generatePostDescription(selectedProductData)
        setPostDescription(generatedDescription)
      }

      // Mudar para a aba de preview automaticamente
      setActiveTab("preview")

      showToast("Card gerado com sucesso", "Você pode visualizar e baixar o card")
    } catch (error: any) {
      console.error("Erro ao gerar card:", error)
      console.error("Stack trace:", error.stack)
      setGenerationProgress(0)
      setHtmlTemplate("") // Limpar o template em caso de erro
      setPreviewUrl("") // Limpar a URL de preview

      // Mostrar mensagem de erro mais detalhada
      showToast(
        "Erro ao gerar o card",
        `${error.message || "Erro desconhecido"}. Verifique o console para mais detalhes.`,
        "destructive",
      )
    } finally {
      stopProgress()
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationStep(null)
        setIsPreviewLoading(false)
      }, 1000)
    }
  }

  // Add this new function for downloading the post description
  const handleDownloadDescription = () => {
    if (!postDescription) return

    const blob = new Blob([postDescription], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `descricao-produto-${selectedProduct}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    showToast("Descrição baixada", "A descrição do post foi baixada com sucesso")
  }

  // Update the handleDownloadCard function to download both files
  const handleDownloadCard = async () => {
    if (!cardUrl) return

    setIsDownloading(true)

    try {
      // Download the card image
      const a = document.createElement("a")
      a.href = cardUrl
      a.download = `produto-${selectedProduct}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Small delay to ensure downloads don't conflict
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Download the description
      if (postDescription) {
        const blob = new Blob([postDescription], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const b = document.createElement("a")
        b.href = url
        b.download = `descricao-produto-${selectedProduct}-${Date.now()}.txt`
        document.body.appendChild(b)
        b.click()
        document.body.removeChild(b)
      }

      showToast("Download completo", "O card e a descrição foram baixados com sucesso")
    } catch (error) {
      console.error("Erro ao baixar arquivos:", error)
      showToast("Erro no download", "Ocorreu um erro ao baixar os arquivos", "destructive")
    } finally {
      setIsDownloading(false)
    }
  }

  // Função para abrir o preview em uma nova janela
  const openPreviewInNewWindow = () => {
    if (!previewUrl) return

    // Criar uma nova janela com o tamanho adequado para o estilo selecionado
    let width = 1080
    let height = 1920

    if (cardStyle === "square") {
      width = 1080
      height = 1080
    } else if (cardStyle === "landscape") {
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

  // Adicionar uma nova função
  const reloadPreview = () => {
    if (!previewUrl) return

    setIsPreviewLoading(true)

    // Forçar uma nova renderização do preview
    const timestamp = Date.now()
    const newPreviewUrl = previewUrl.split("&t=")[0] + `&t=${timestamp}`
    setPreviewUrl(newPreviewUrl)

    // Simular um pequeno atraso para a recarga
    setTimeout(() => {
      setIsPreviewLoading(false)
    }, 1000)
  }

  // Toggle compact mode
  const toggleCompactMode = () => {
    setCompactMode(!compactMode)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
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
            <Label htmlFor="cardStyle" className="text-sm">
              Estilo do Card
            </Label>
            <Select value={cardStyle} onValueChange={setCardStyle}>
              <SelectTrigger id="cardStyle" className="h-8 text-sm">
                <SelectValue placeholder="Selecione o estilo do card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato (9:16)</SelectItem>
                <SelectItem value="square">Quadrado (1:1)</SelectItem>
                <SelectItem value="landscape">Paisagem (16:9)</SelectItem>
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
                <ImageIcon className="mr-2 h-3 w-3" />
                Gerar Card
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview Card - Layout fixo para TikTok */}
      <div className="lg:self-start">
        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Visualização TikTok (9:16)</CardTitle>
                <CardDescription className="text-xs">Visualize seu card no formato TikTok</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleCompactMode} className="h-8 w-8 p-0">
                {compactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="w-full flex-shrink-0">
                <TabsTrigger value="preview" className="text-sm">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="card" className="text-sm">
                  Card
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
                        maxWidth: "180px", // Reduzido de 200px para 180px
                        height: "320px", // Reduzido de 356px para 320px
                        margin: "0 auto",
                      }}
                    >
                      {/* TikTok UI Header */}
                      <div className="w-full bg-black text-white p-1 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-xs font-medium">TikTok</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs">@autoseller</span>
                        </div>
                      </div>

                      {/* TikTok Card Container - Proporção exata 9:16 */}
                      <div className="relative w-full" style={{ height: "calc(100% - 30px)" }}>
                        <div className="w-full h-full overflow-hidden relative">
                          {previewUrl && !isPreviewLoading && !previewError && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-1 right-1 z-10 h-6 w-6 p-0"
                              onClick={reloadPreview}
                              aria-label="Recarregar preview"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                          {isPreviewLoading ? (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <p className="ml-2 text-xs">Carregando...</p>
                            </div>
                          ) : previewError ? (
                            <div className="flex flex-col items-center justify-center h-full bg-muted">
                              <AlertCircle className="h-4 w-4 text-red-500 mb-2" />
                              <p className="text-muted-foreground text-center text-xs">Erro ao renderizar</p>
                              <Button variant="outline" size="sm" className="mt-2 text-xs h-6" onClick={handleGenerate}>
                                Tentar novamente
                              </Button>
                            </div>
                          ) : (
                            <div
                              ref={previewContainerRef}
                              className="w-full h-full overflow-auto bg-white"
                              style={{ minHeight: "200px", maxHeight: "100%" }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de ação para o preview */}
                    {previewUrl && (
                      <div className="flex justify-center gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={openPreviewInNewWindow} className="text-xs h-7">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir
                        </Button>
                        <Button size="sm" variant="outline" onClick={copyPreviewLink} className="text-xs h-7">
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar Link
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    <ImageIcon className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">Gere um card para visualizá-lo aqui</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="card" className="p-4">
                <div className="flex flex-col gap-4">
                  {cardGenerated && cardUrl ? (
                    <div className="space-y-4">
                      <div
                        className="bg-black rounded-lg overflow-hidden"
                        style={{
                          maxWidth: "180px", // Reduzido de 200px para 180px
                          margin: "0 auto",
                        }}
                      >
                        {/* Exibir o card gerado */}
                        <div className="h-full max-h-[320px] aspect-[9/16] bg-black rounded-lg overflow-auto shadow-xl">
                          <div
                            className="w-full h-full overflow-auto"
                            dangerouslySetInnerHTML={{ __html: htmlTemplate }}
                          />
                        </div>
                      </div>

                      {/* Post Description Section */}
                      <div className="mt-2 border rounded-md p-2">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-xs font-medium">Descrição para Post</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingDescription(!isEditingDescription)}
                            className="h-6 text-xs"
                          >
                            {isEditingDescription ? "Concluir" : "Editar"}
                          </Button>
                        </div>

                        {isEditingDescription ? (
                          <Textarea
                            value={postDescription}
                            onChange={(e) => setPostDescription(e.target.value)}
                            className="min-h-[80px] max-h-[100px] text-xs"
                            placeholder="Descrição para o post no TikTok"
                          />
                        ) : (
                          <div className="bg-muted p-2 rounded-md text-xs whitespace-pre-line max-h-[80px] overflow-y-auto">
                            {postDescription || "Nenhuma descrição gerada ainda."}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center gap-2 mt-1">
                        <Button size="sm" onClick={handleDownloadCard} className="text-xs h-7" disabled={isDownloading}>
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Baixando...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Baixar Tudo
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDownloadDescription} className="text-xs h-7">
                          <FileText className="h-3 w-3 mr-1" />
                          Só Descrição
                        </Button>
                      </div>

                      <Alert className="bg-green-50 border-green-200 py-1">
                        <AlertCircle className="h-3 w-3 text-green-600" />
                        <AlertDescription className="text-xs text-green-800">
                          Card gerado com sucesso! Baixe o card e a descrição para publicação.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      <ImageIcon className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">Gere um card para visualizá-lo aqui</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
