"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Video, Camera, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { ProductSelector } from "@/components/product-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface VideoGeneratorProps {
  products: any[]
}

export function VideoGenerator({ products }: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [htmlTemplate, setHtmlTemplate] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [useAI, setUseAI] = useState(true)
  const [customDescription, setCustomDescription] = useState("")
  const [videoStyle, setVideoStyle] = useState("portrait")
  const iframeRef = useRef<HTMLIFrameElement>(null)
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
    try {
      console.log("Gerando card para o produto:", selectedProduct)

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          useAI,
          customDescription: !useAI ? customDescription : undefined,
          videoStyle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }))
        throw new Error(errorData.message || `Erro ${response.status}: Falha ao gerar o card`)
      }

      const data = await response.json()

      if (data.success) {
        console.log("Card gerado com sucesso:", data)
        setHtmlTemplate(data.htmlTemplate)
        setPreviewUrl(data.previewUrl)

        toast({
          title: "Card gerado com sucesso",
          description: "Você pode visualizar o card na aba de preview",
        })
      } else {
        throw new Error(data.message || "Falha ao gerar o card")
      }
    } catch (error) {
      console.error("Error generating video:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar o card",
        description: error.message,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyHtml = () => {
    navigator.clipboard
      .writeText(htmlTemplate)
      .then(() => {
        toast({
          title: "HTML copiado",
          description: "O código HTML do card foi copiado para a área de transferência",
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Cards</CardTitle>
          <CardDescription>Crie cards para TikTok a partir de produtos da Shopee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Selecione o Produto</Label>
            <ProductSelector products={products} value={selectedProduct} onChange={setSelectedProduct} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="useAI">Usar IA para Descrição</Label>
              <Switch id="useAI" checked={useAI} onCheckedChange={setUseAI} />
            </div>
            {!useAI && (
              <Textarea
                placeholder="Digite uma descrição personalizada para o produto"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="min-h-[100px]"
              />
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
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={!selectedProduct || isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Gerar Card
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Visualize e exporte seu card gerado</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="p-4">
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <div className="w-full max-h-[400px] overflow-auto border rounded-lg">
                    <iframe
                      ref={iframeRef}
                      src={previewUrl}
                      className="w-full h-[400px] border-0"
                      title="Card Preview"
                    />
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
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Video className="mx-auto h-12 w-12 mb-2" />
                  <p>Gere um card para visualizá-lo aqui</p>
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
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled={!htmlTemplate} onClick={handleCopyHtml}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar HTML
          </Button>
          <Button disabled={!previewUrl} onClick={handleTakeScreenshot}>
            <Camera className="mr-2 h-4 w-4" />
            Tirar Screenshot
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
