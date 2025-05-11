"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductSelector } from "@/components/product-selector"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, ImageIcon, Loader2, AlertTriangle, Edit, Smartphone } from "lucide-react"

export function ImageGeneratorPro({ products = [] }) {
  const [selectedProductId, setSelectedProductId] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [generatedDescription, setGeneratedDescription] = useState("")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState("")
  const [descriptionError, setDescriptionError] = useState("")
  const [template, setTemplate] = useState("default")
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { toast } = useToast()

  // Get the selected product object based on the selected ID
  const selectedProduct = selectedProductId ? products.find((p) => p.itemId === selectedProductId) : null

  const templates = [
    { id: "default", name: "Padrão", description: "Template padrão com foco no produto" },
    { id: "promo", name: "Promoção", description: "Destaca o preço e promoções" },
    { id: "features", name: "Características", description: "Foca nas características do produto" },
  ]

  const generateDescription = async () => {
    if (!selectedProduct) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Por favor, selecione um produto para gerar a descrição.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingDescription(true)
    setDescriptionError("")
    setIsEditingDescription(false)

    try {
      // Create a fallback description based on product data
      const price = Number.parseFloat(selectedProduct.price)
      const sales = Number.parseInt(selectedProduct.sales || "0")
      const rating = Number.parseFloat(selectedProduct.ratingStar || "4.5")

      // Format numbers for better readability
      const formattedSales = sales.toLocaleString("pt-BR")

      // Create different templates based on product attributes
      let description = ""

      if (sales > 1000) {
        // Popular product template
        description = `🔥 SUPER OFERTA! 🔥\n\n${selectedProduct.productName}\n\n⭐ Avaliação: ${rating.toFixed(1)}/5\n💰 Apenas R$${price.toFixed(2)}\n🛒 Mais de ${formattedSales} clientes satisfeitos!\n\nProduto de alta qualidade com ótimo preço. Não perca esta oportunidade!\n\n#oferta #shopee #qualidade`
      } else {
        // New or less popular product template
        description = `✨ DESCUBRA AGORA! ✨\n\n${selectedProduct.productName}\n\n⭐ Avaliação: ${rating.toFixed(1)}/5\n💰 Preço especial: R$${price.toFixed(2)}\n🛍️ Já vendido para ${formattedSales} clientes!\n\nProduto com excelente custo-benefício. Aproveite enquanto durar o estoque!\n\n#novidade #shopee #oferta`
      }

      setGeneratedDescription(description)
      setEditedDescription(description)

      toast({
        title: "Descrição gerada com sucesso!",
        description: "Uma descrição otimizada foi criada para o produto.",
      })
    } catch (error) {
      console.error("Erro ao gerar descrição:", error)
      setDescriptionError("Ocorreu um erro ao gerar a descrição. Por favor, tente novamente.")
      toast({
        title: "Erro ao gerar descrição",
        description: "Ocorreu um erro ao gerar a descrição do produto.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const toggleEditDescription = () => {
    if (isEditingDescription) {
      // Save the edited description
      setGeneratedDescription(editedDescription)
      setIsEditingDescription(false)
      toast({
        title: "Descrição atualizada",
        description: "Suas alterações na descrição foram salvas.",
      })
    } else {
      // Start editing
      setIsEditingDescription(true)
    }
  }

  const generateImage = async () => {
    if (!selectedProduct) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Por favor, selecione um produto para gerar a imagem.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImage(null)
    setError("")

    try {
      console.log("Generating image for product:", selectedProduct)

      // Use the generated description if available, otherwise use a default one
      const description =
        generatedDescription ||
        `${selectedProduct.productName} - Produto de alta qualidade com ótimo preço. Já vendido para mais de ${selectedProduct.sales} clientes satisfeitos!`

      const response = await fetch("/api/generate-product-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: selectedProduct,
          template: template,
          description: description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`Erro ao gerar imagem: ${result.error || result.details || response.statusText}`)
      }

      if (!result.success) {
        throw new Error(`Erro ao gerar imagem: ${result.error || "Resposta inválida do servidor"}`)
      }

      if (result.html) {
        setGeneratedImage(result)
        toast({
          title: "Imagem gerada com sucesso!",
          description: "A imagem do produto foi gerada com sucesso.",
        })
      } else {
        throw new Error("Resposta inválida do servidor: HTML não encontrado")
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error)
      setError(error.message || "Ocorreu um erro ao gerar a imagem do produto.")
      toast({
        title: "Erro ao gerar imagem",
        description: error.message || "Ocorreu um erro ao gerar a imagem do produto.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async () => {
    if (!generatedImage || !selectedProduct) return

    setIsDownloading(true)

    try {
      // Since we don't have HTML-to-image conversion anymore,
      // we'll just download the product image as a fallback
      const imageUrl = selectedProduct.imageUrl || "/placeholder.svg"
      console.log("Downloading image from URL:", imageUrl)

      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const imageBlob = await response.blob()

      // Create a filename for the image
      const filename = `product-image-${selectedProduct.itemId}-${Date.now()}.png`

      // Create a download link for the image
      const url = URL.createObjectURL(imageBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download iniciado",
        description: "O download da imagem foi iniciado.",
      })
    } catch (error) {
      console.error("Erro ao baixar imagem:", error)
      toast({
        title: "Erro ao baixar imagem",
        description: error.message || "Ocorreu um erro ao baixar a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // If in fullscreen mode, show only the preview
  if (isFullscreen && generatedImage) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Visualização TikTok (9:16)</h2>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            Sair da Visualização
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted p-4 overflow-hidden">
          <div className="relative h-full aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 overflow-auto" dangerouslySetInnerHTML={{ __html: generatedImage.html }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Selecione um Produto</h2>
            <ProductSelector products={products} value={selectedProductId} onChange={setSelectedProductId} />

            {selectedProduct && (
              <div className="mt-6">
                <Tabs defaultValue="template">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="template">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Template
                    </TabsTrigger>
                    <TabsTrigger value="description">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Descrição
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="template">
                    <h3 className="text-xl font-semibold mb-3">Escolha um Template</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            template === t.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setTemplate(t.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{t.name}</span>
                            {template === t.id && <Badge>Selecionado</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="description">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold">Descrição do Produto</h3>
                      {generatedDescription && !isEditingDescription && (
                        <Button variant="outline" size="sm" onClick={toggleEditDescription}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      )}
                      {isEditingDescription && (
                        <Button variant="outline" size="sm" onClick={toggleEditDescription}>
                          Salvar
                        </Button>
                      )}
                    </div>
                    <div className="border rounded-lg p-3 mb-3">
                      {isGeneratingDescription ? (
                        <div className="flex flex-col items-center justify-center py-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Gerando descrição...</p>
                        </div>
                      ) : descriptionError ? (
                        <div className="flex flex-col items-center justify-center py-4 text-amber-600">
                          <AlertTriangle className="h-8 w-8 mb-2" />
                          <p className="text-sm text-center mb-2">{descriptionError}</p>
                          <Button variant="outline" size="sm" onClick={generateDescription} className="mt-2">
                            Tentar Novamente
                          </Button>
                        </div>
                      ) : isEditingDescription ? (
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="w-full min-h-[150px] p-2 text-sm border rounded-md"
                          placeholder="Edite a descrição do produto aqui..."
                        />
                      ) : generatedDescription ? (
                        <div>
                          <p className="text-sm whitespace-pre-line">{generatedDescription}</p>
                          <Badge variant="outline" className="mt-2">
                            Descrição Gerada
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Gere uma descrição otimizada para o produto.
                          </p>
                          <Button variant="outline" size="sm" onClick={generateDescription} className="mt-2">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Gerar Descrição
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <Button className="w-full mt-6" onClick={generateImage} disabled={isGenerating}>
                  {isGenerating ? "Gerando..." : "Gerar Imagem"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Visualização TikTok (9:16)</h2>
              {generatedImage && (
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Tela Cheia
                </Button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
              {isGenerating ? (
                <div className="h-full aspect-[9/16] bg-black rounded-lg flex items-center justify-center">
                  <div className="space-y-3 w-3/4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-5/6" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-8 w-4/6" />
                    <Skeleton className="h-8 w-3/6" />
                  </div>
                </div>
              ) : error ? (
                <div className="h-full aspect-[9/16] bg-red-50 flex flex-col items-center justify-center p-4 text-red-600 border border-red-200 rounded-lg">
                  <p className="font-semibold mb-2">Erro ao gerar imagem</p>
                  <p className="text-sm text-center">{error}</p>
                </div>
              ) : generatedImage ? (
                <div className="h-full aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-xl">
                  <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: generatedImage.html }} />
                </div>
              ) : (
                <div className="h-full aspect-[9/16] bg-black rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center p-4">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Selecione um produto e gere uma imagem para visualizar</p>
                    <p className="text-xs mt-2 text-muted-foreground/70">Formato TikTok 9:16</p>
                  </div>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="mt-4">
                <Button className="w-full" onClick={downloadImage} disabled={isDownloading}>
                  {isDownloading ? "Baixando..." : "Baixar Imagem"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
