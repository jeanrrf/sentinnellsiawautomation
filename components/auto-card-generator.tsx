"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Download, RefreshCw, FileText, Copy, Sparkles, Palette } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadFile, downloadTextFile, downloadMultipleFiles } from "@/lib/download-utils"
import { generateCardsForProduct, cleanupCardResources, type CardGenerationResult } from "@/lib/card-generation-service"
import { useToast } from "@/components/ui/use-toast"

export function AutoCardGenerator() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [bestSeller, setBestSeller] = useState<any>(null)
  const [error, setError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [description, setDescription] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingType, setDownloadingType] = useState<string | null>(null)
  const [cardGenerated, setCardGenerated] = useState(false)
  const [cardResult, setCardResult] = useState<CardGenerationResult | null>(null)
  const [affiliateLink, setAffiliateLink] = useState("")
  const [activeTemplate, setActiveTemplate] = useState("style1")
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [selectedTemplate1, setSelectedTemplate1] = useState("modern")
  const [selectedTemplate2, setSelectedTemplate2] = useState("elegant")
  const [useGradient, setUseGradient] = useState(true)

  useEffect(() => {
    fetchBestSeller()

    // Limpar recursos ao desmontar o componente
    return () => {
      if (cardResult) {
        cleanupCardResources(cardResult)
      }
    }
  }, [])

  const fetchBestSeller = async () => {
    try {
      setIsLoading(true)
      setError("")
      setCardGenerated(false)

      // Limpar recursos anteriores
      if (cardResult) {
        cleanupCardResources(cardResult)
        setCardResult(null)
      }

      const response = await fetch("/api/best-sellers")

      if (!response.ok) {
        throw new Error(`Falha ao buscar produtos mais vendidos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success || !data.products || data.products.length === 0) {
        throw new Error("Nenhum produto encontrado")
      }

      const topSeller = data.products[0]
      setBestSeller(topSeller)
      setAffiliateLink(topSeller.offerLink || "")

      toast({
        title: "Produto carregado",
        description: "Produto mais vendido carregado com sucesso",
      })
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao buscar produtos")

      toast({
        variant: "destructive",
        title: "Erro ao carregar produto",
        description: err.message || "Não foi possível carregar o produto mais vendido",
      })
    } finally {
      setIsLoading(false)
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
    if (!bestSeller) {
      return
    }

    setIsGenerating(true)
    setCardGenerated(false)
    const stopProgress = simulateProgress()

    // Limpar recursos anteriores
    if (cardResult) {
      cleanupCardResources(cardResult)
    }

    try {
      // Verificar se o produto tem informações de frete
      // Se não tiver, tentar inferir com base no nome ou preço
      if (bestSeller.freeShipping === undefined) {
        if (
          bestSeller.productName.toLowerCase().includes("frete grátis") ||
          (bestSeller.priceDiscountRate && Number.parseInt(bestSeller.priceDiscountRate) > 50)
        ) {
          bestSeller.freeShipping = true
        }
      }

      // Usar o serviço centralizado para gerar os cards com as novas configurações
      const result = await generateCardsForProduct(bestSeller, {
        useAI: true,
        template1: selectedTemplate1,
        template2: selectedTemplate2,
        includeSecondVariation: true,
        useGradient: useGradient,
      })

      if (!result.success) {
        throw new Error(result.error || "Falha ao gerar cards")
      }

      setCardResult(result)
      setDescription(result.description || "")
      setGenerationProgress(100)
      setCardGenerated(true)

      toast({
        title: "Cards gerados com sucesso",
        description: "Os cards foram gerados e estão prontos para download",
      })
    } catch (error: any) {
      console.error("Erro ao gerar cards:", error)
      setError(error.message || "Ocorreu um erro ao gerar os cards")

      toast({
        variant: "destructive",
        title: "Erro ao gerar cards",
        description: error.message || "Não foi possível gerar os cards",
      })
    } finally {
      stopProgress()
      setIsGenerating(false)
    }
  }

  const handleDownload = async (type: string, variation = 1) => {
    if (!cardGenerated || !cardResult) return

    setIsDownloading(true)
    setDownloadingType(type)

    try {
      const productName = bestSeller.productName.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_")
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filePrefix = `tiktok_${productName}_${timestamp}`

      switch (type) {
        case "png":
          if (variation === 1 && cardResult.pngUrl) {
            await downloadFile(cardResult.pngUrl, `${filePrefix}_1.png`)
          } else if (variation === 2 && cardResult.pngUrl2) {
            await downloadFile(cardResult.pngUrl2, `${filePrefix}_2.png`)
          }
          break
        case "jpeg":
          if (variation === 1 && cardResult.jpegUrl) {
            await downloadFile(cardResult.jpegUrl, `${filePrefix}_1.jpg`)
          } else if (variation === 2 && cardResult.jpegUrl2) {
            await downloadFile(cardResult.jpegUrl2, `${filePrefix}_2.jpg`)
          }
          break
        case "description":
          // Prepare text content with description and affiliate link
          const textContent = `${description}\n\n📲 LINK: ${affiliateLink}`
          await downloadTextFile(textContent, `${filePrefix}_description.txt`)
          break
        case "all":
          // Download all files as a package
          const files = []

          if (cardResult.pngUrl) {
            files.push({ url: cardResult.pngUrl, filename: `${filePrefix}_1.png` })
          }

          if (cardResult.jpegUrl) {
            files.push({ url: cardResult.jpegUrl, filename: `${filePrefix}_1.jpg` })
          }

          if (cardResult.pngUrl2) {
            files.push({ url: cardResult.pngUrl2, filename: `${filePrefix}_2.png` })
          }

          if (cardResult.jpegUrl2) {
            files.push({ url: cardResult.jpegUrl2, filename: `${filePrefix}_2.jpg` })
          }

          files.push({
            url: URL.createObjectURL(new Blob([`${description}\n\n📲 LINK: ${affiliateLink}`], { type: "text/plain" })),
            filename: `${filePrefix}_description.txt`,
          })

          await downloadMultipleFiles(files)

          // Clean up text URL
          URL.revokeObjectURL(files[files.length - 1].url)
          break
      }

      toast({
        title: "Download concluído",
        description: `Arquivo${type === "all" ? "s" : ""} baixado${type === "all" ? "s" : ""} com sucesso`,
      })
    } catch (error) {
      console.error(`Erro ao baixar ${type}:`, error)
      setError(`Falha ao baixar ${type}. Por favor, tente novamente.`)

      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: `Não foi possível baixar o arquivo. ${error}`,
      })
    } finally {
      setIsDownloading(false)
      setDownloadingType(null)
    }
  }

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopySuccess(type)
      setTimeout(() => setCopySuccess(null), 2000)

      toast({
        title: "Copiado!",
        description: "Conteúdo copiado para a área de transferência",
      })
    } catch (err) {
      console.error("Falha ao copiar: ", err)
      setError("Não foi possível copiar para a área de transferência")

      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência",
      })
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gerador de Cards para TikTok
        </CardTitle>
        <CardDescription>Crie cards otimizados para SEO e altas taxas de conversão</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>
        ) : (
          <>
            {bestSeller && (
              <div className="mb-4 p-4 bg-muted rounded-md">
                <p className="mb-1 font-medium">{bestSeller.productName}</p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Preço: R$ {bestSeller.price}</span>
                  <span>Vendas: {bestSeller.sales}</span>
                </div>
                {affiliateLink && (
                  <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground truncate max-w-[70%]">{affiliateLink}</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(affiliateLink, "link")}>
                        {copySuccess === "link" ? (
                          <>
                            <Copy className="h-4 w-4 mr-1 text-green-500" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!cardGenerated && (
              <div className="mb-6 p-4 border rounded-md">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Palette className="h-4 w-4 mr-2" />
                  Opções de Design
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Estilo Principal</label>
                    <Select value={selectedTemplate1} onValueChange={setSelectedTemplate1}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Moderno</SelectItem>
                        <SelectItem value="minimal">Minimalista</SelectItem>
                        <SelectItem value="bold">Ousado</SelectItem>
                        <SelectItem value="elegant">Elegante</SelectItem>
                        <SelectItem value="vibrant">Vibrante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Estilo Alternativo</label>
                    <Select value={selectedTemplate2} onValueChange={setSelectedTemplate2}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elegant">Elegante</SelectItem>
                        <SelectItem value="modern">Moderno</SelectItem>
                        <SelectItem value="minimal">Minimalista</SelectItem>
                        <SelectItem value="bold">Ousado</SelectItem>
                        <SelectItem value="vibrant">Vibrante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useGradient}
                      onChange={(e) => setUseGradient(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Usar gradiente de fundo</span>
                  </label>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-2 mt-4">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">
                  {generationProgress < 30
                    ? "Gerando descrição com IA..."
                    : generationProgress < 70
                      ? "Criando imagens..."
                      : "Finalizando..."}
                </p>
              </div>
            )}

            {cardGenerated && cardResult && (
              <div className="mt-4 space-y-4">
                <Tabs defaultValue="style1" className="w-full" value={activeTemplate} onValueChange={setActiveTemplate}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="style1">
                      Estilo {selectedTemplate1.charAt(0).toUpperCase() + selectedTemplate1.slice(1)}
                    </TabsTrigger>
                    <TabsTrigger value="style2">
                      Estilo {selectedTemplate2.charAt(0).toUpperCase() + selectedTemplate2.slice(1)}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="style1" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-2 flex flex-col items-center">
                        <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                          <img
                            src={cardResult.pngUrl || "/placeholder.svg"}
                            alt="PNG Card"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => handleDownload("png", 1)}
                          disabled={isDownloading}
                        >
                          {isDownloading && downloadingType === "png" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          PNG
                        </Button>
                      </div>

                      <div className="border rounded-md p-2 flex flex-col items-center">
                        <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                          <img
                            src={cardResult.jpegUrl || "/placeholder.svg"}
                            alt="JPEG Card"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => handleDownload("jpeg", 1)}
                          disabled={isDownloading}
                        >
                          {isDownloading && downloadingType === "jpeg" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          JPEG
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="style2" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-2 flex flex-col items-center">
                        <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                          <img
                            src={cardResult.pngUrl2 || "/placeholder.svg"}
                            alt="PNG Card (Alt)"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => handleDownload("png", 2)}
                          disabled={isDownloading}
                        >
                          {isDownloading && downloadingType === "png" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          PNG
                        </Button>
                      </div>

                      <div className="border rounded-md p-2 flex flex-col items-center">
                        <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                          <img
                            src={cardResult.jpegUrl2 || "/placeholder.svg"}
                            alt="JPEG Card (Alt)"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => handleDownload("jpeg", 2)}
                          disabled={isDownloading}
                        >
                          {isDownloading && downloadingType === "jpeg" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          JPEG
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="border rounded-md p-3">
                  <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line mb-2">{description}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload("description")}
                      disabled={isDownloading}
                    >
                      {isDownloading && downloadingType === "description" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <FileText className="h-4 w-4 mr-1" />
                      )}
                      Baixar Texto
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyToClipboard(`${description}\n\n📲 LINK: ${affiliateLink}`, "desc")}
                    >
                      {copySuccess === "desc" ? (
                        <>
                          <Copy className="h-4 w-4 mr-1 text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar Texto
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={fetchBestSeller} disabled={isLoading || isGenerating}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>

        {!cardGenerated ? (
          <Button onClick={handleGenerate} disabled={isLoading || isGenerating || !bestSeller}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Cards
              </>
            )}
          </Button>
        ) : (
          <Button onClick={() => handleDownload("all")} disabled={isDownloading}>
            {isDownloading && downloadingType === "all" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar Tudo
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
