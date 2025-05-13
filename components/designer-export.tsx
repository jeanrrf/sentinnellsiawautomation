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
  const [previewUrl, setPreviewUrl] = useState("")
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

  // Função para mostrar toast - limitado a 4 segundos
  const showToast = (title: string, description: string, variant?: "default" | "destructive") => {
    // Não mostrar nada
    return
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

        // Verificar se os dados vêm da API Shopee
        if (!data.success || !data.products || !Array.isArray(data.products)) {
          throw new Error("Dados inválidos recebidos da API Shopee")
        }

        setProducts(data.products || [])
      } catch (err: any) {
        setError(err.message || "Ocorreu um erro ao buscar produtos")
        console.error("Erro ao buscar produtos:", err)
        showToast(
          "Erro ao buscar produtos",
          "Não foi possível obter produtos da API Shopee. Verifique sua conexão.",
          "destructive",
        )
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
      const selectedProductData = products.find((p) => p.itemId === selectedProduct)
      if (!selectedProductData) {
        throw new Error(`Produto com ID ${selectedProduct} não encontrado na lista de produtos.`)
      }

      // Gerar o timestamp para evitar cache
      const timestamp = Date.now()

      // Definir a URL do preview com o timestamp
      setPreviewUrl(`/api/generate-product-card?id=${selectedProduct}&style=${cardStyle}&t=${timestamp}`)

      setGenerationProgress(100)
      setCardGenerated(true)

      // Generate post description
      if (selectedProductData) {
        try {
          // Tentar obter descrição da API
          const descResponse = await fetch("/api/generate-description", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product: selectedProductData }),
          })

          if (descResponse.ok) {
            const descData = await descResponse.json()
            if (descData.success && descData.description) {
              setPostDescription(descData.description)
            } else {
              // Fallback para descrição gerada localmente
              setPostDescription(generatePostDescription(selectedProductData))
            }
          } else {
            // Fallback para descrição gerada localmente
            setPostDescription(generatePostDescription(selectedProductData))
          }
        } catch (descError) {
          console.error("Erro ao gerar descrição:", descError)
          // Fallback para descrição gerada localmente
          setPostDescription(generatePostDescription(selectedProductData))
        }
      }

      // Mudar para a aba de preview automaticamente
      setActiveTab("preview")
    } catch (error: any) {
      console.error("Erro ao gerar card:", error)
      console.error("Stack trace:", error.stack)
      setGenerationProgress(0)
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
  }

  // Update the handleDownloadCard function to download both files
  const handleDownloadCard = async () => {
    if (!previewUrl) return

    setIsDownloading(true)

    try {
      // Download the card image
      const a = document.createElement("a")
      a.href = previewUrl
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
      width = Math.floor(height / ratio)
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
      .then(() => {})
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
    const baseUrl = previewUrl.split("&t=")[0]
    const newPreviewUrl = baseUrl + `&t=${timestamp}`
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
                {previewUrl ? (
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
                            <div className="w-full h-full overflow-hidden bg-white">
                              <img
                                src={previewUrl || "/placeholder.svg"}
                                alt="Preview do card"
                                className="w-full h-full object-contain"
                                onError={() => setPreviewError(true)}
                              />
                            </div>
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
                  {cardGenerated && previewUrl ? (
                    <div className="space-y-4">
                      <div
                        className="bg-black rounded-lg overflow-hidden"
                        style={{
                          maxWidth: "180px", // Reduzido de 200px para 180px
                          margin: "0 auto",
                        }}
                      >
                        {/* Exibir o card gerado */}
                        <div className="w-full aspect-[9/16] relative" style={{ maxHeight: "320px" }}>
                          <img
                            src={previewUrl || "/placeholder.svg"}
                            alt="Card gerado"
                            className="w-full h-full object-contain"
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
