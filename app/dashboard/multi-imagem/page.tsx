"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedProductCard } from "@/components/animated-product-card"
import { TransitionSettings } from "@/components/transition-settings"
import { type TransitionConfig, DEFAULT_TRANSITION_CONFIG } from "@/lib/multi-image-card-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createLogger } from "@/lib/logger"
import { Loader2, Download, Share2 } from "lucide-react"

const logger = createLogger("animated-cards-page")

export default function AnimatedCardsPage() {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [transitionConfig, setTransitionConfig] = useState<Partial<TransitionConfig>>(DEFAULT_TRANSITION_CONFIG)
  const [frameUrls, setFrameUrls] = useState<string[]>([])
  const [downloadLoading, setDownloadLoading] = useState(false)

  // Buscar produto de exemplo
  useEffect(() => {
    const fetchSampleProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/sample-data")

        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.products && data.products.length > 0) {
          // Adicionar URLs de imagem extras para testar a transição
          const sampleProduct = data.products[0]

          // Simular múltiplas imagens para o produto
          sampleProduct.images = [
            sampleProduct.imageUrl,
            "/diverse-products-still-life.png",
            "/diverse-people-listening-headphones.png",
          ]

          setProduct(sampleProduct)
        } else {
          throw new Error(data.error || "Erro ao buscar produtos")
        }
      } catch (error) {
        logger.error("Erro ao buscar produto:", error)
        // Criar um produto de exemplo como fallback
        setProduct({
          itemId: "123456",
          productName: "Produto de Exemplo",
          price: "149.90",
          sales: "1500",
          ratingStar: "4.8",
          imageUrl: "/generic-product-display.png",
          images: ["/generic-product-display.png", "/placeholder.svg?key=zo22h", "/placeholder.svg?key=8r00q"],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSampleProduct()
  }, [])

  const handleFramesGenerated = (urls: string[]) => {
    setFrameUrls(urls)
  }

  const handleDownloadGif = async () => {
    try {
      setDownloadLoading(true)

      // Em uma implementação real, enviaria os frames para o servidor para gerar o GIF
      const response = await fetch("/api/generate-animated-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.itemId,
          format: "gif",
          transitionConfig,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao gerar GIF: ${response.status}`)
      }

      // Processar o download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `produto-animado-${product.itemId}.gif`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error("Erro ao baixar GIF:", error)
      alert("Erro ao baixar o GIF. Por favor, tente novamente.")
    } finally {
      setDownloadLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Cards com Transição de Imagens</h1>
        <p className="text-muted-foreground">
          Crie cards animados que alternam automaticamente entre várias imagens do produto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <TransitionSettings value={transitionConfig} onChange={setTransitionConfig} />

          <Card>
            <CardHeader>
              <CardTitle>Exportar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Exporte o card animado como GIF ou vídeo para usar em suas publicações.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDownloadGif}
                  disabled={downloadLoading || frameUrls.length === 0}
                  className="w-full"
                >
                  {downloadLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar como GIF
                    </>
                  )}
                </Button>

                <Button variant="outline" disabled={downloadLoading || frameUrls.length === 0} className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Tabs defaultValue="preview">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              <TabsTrigger value="info">Informações</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="pt-4">
              {product && (
                <AnimatedProductCard
                  product={product}
                  images={product.images}
                  transitionConfig={transitionConfig}
                  onGenerated={handleFramesGenerated}
                />
              )}
            </TabsContent>

            <TabsContent value="info" className="pt-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Sobre Cards Animados</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Os cards animados permitem mostrar múltiplas imagens de um produto em um único card, aumentando o
                      engajamento e a taxa de conversão.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Benefícios:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                      <li>Maior engajamento nas redes sociais</li>
                      <li>Destaque entre outros anúncios estáticos</li>
                      <li>Exibição de múltiplos ângulos do produto</li>
                      <li>Aumento nas taxas de clique e conversão</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Dicas de uso:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                      <li>Use 3-5 imagens para melhor resultado</li>
                      <li>Escolha imagens que mostrem diferentes aspectos do produto</li>
                      <li>Ajuste a velocidade de transição conforme a complexidade da imagem</li>
                      <li>Para TikTok, o efeito de zoom costuma ter melhor desempenho</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
