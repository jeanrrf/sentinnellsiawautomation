"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductSelector } from "./product-selector"
import { useToast } from "@/components/ui/use-toast"
import { createLogger, ErrorCodes } from "@/lib/logger"
import { usePersistentState } from "@/hooks/use-persistent-state"

// Criar logger específico para este componente
const logger = createLogger("VideoGeneratorPro")

export function VideoGeneratorPro() {
  // Usar estado persistente para o produto selecionado
  const [selectedProduct, setSelectedProduct] = usePersistentState<any | null>("videoGeneratorProSelectedProduct", null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  // Usar estado persistente para as configurações do vídeo
  const [selectedStyle, setSelectedStyle] = usePersistentState<string>("videoGeneratorProStyle", "portrait")
  const [selectedQuality, setSelectedQuality] = usePersistentState<string>("videoGeneratorProQuality", "medium")
  const [withAudio, setWithAudio] = usePersistentState<boolean>("videoGeneratorProWithAudio", true)
  const [optimize, setOptimize] = usePersistentState<boolean>("videoGeneratorProOptimize", true)
  const [fps, setFps] = usePersistentState<number>("videoGeneratorProFps", 30)
  const { toast } = useToast()

  // Função para gerar o vídeo
  const generateVideo = async () => {
    if (!selectedProduct) {
      toast({
        title: "Erro",
        description: "Selecione um produto primeiro",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      logger.info("Iniciando geração de vídeo", {
        context: {
          productId: selectedProduct.itemId,
          style: selectedStyle,
          quality: selectedQuality,
          withAudio,
          optimize,
          fps,
        },
      })

      // Preparar os dados para a requisição
      const requestData = {
        productId: selectedProduct.itemId,
        style: selectedStyle,
        quality: selectedQuality,
        withAudio,
        optimize,
        fps,
      }

      // Fazer a requisição para a API
      const response = await fetch("/api/generate-product-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`Erro ao gerar vídeo: ${response.statusText}`)
      }

      // Obter a URL do vídeo gerado
      const videoBlob = await response.blob()
      const videoUrl = URL.createObjectURL(videoBlob)
      setGeneratedVideoUrl(videoUrl)

      toast({
        title: "Sucesso!",
        description: "Vídeo gerado com sucesso",
      })

      logger.info("Vídeo gerado com sucesso", {
        context: {
          productId: selectedProduct.itemId,
          blobSize: videoBlob.size,
        },
      })
    } catch (error) {
      logger.error("Falha ao gerar vídeo", {
        code: ErrorCodes.VIDEO.GENERATION_FAILED,
        details: error,
        context: {
          productId: selectedProduct?.itemId,
          error: error.message,
        },
      })

      toast({
        title: "Erro ao gerar vídeo",
        description: error.message || "Ocorreu um erro ao gerar o vídeo",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Limpar a URL do objeto quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (generatedVideoUrl) {
        URL.revokeObjectURL(generatedVideoUrl)
      }
    }
  }, [generatedVideoUrl])

  // Função para atualizar o produto selecionado
  const handleProductSelect = (product: any) => {
    logger.debug("Produto selecionado no VideoGeneratorPro", {
      context: { productId: product?.itemId },
    })
    setSelectedProduct(product)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerador de Vídeo Pro</CardTitle>
        <CardDescription>Crie vídeos profissionais para seus produtos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Selecione um produto</h3>
            <ProductSelector onSelect={handleProductSelect} selectedProduct={selectedProduct} />
          </div>

          {selectedProduct && (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Configurações do vídeo</h3>
                <Tabs value={selectedStyle} onValueChange={setSelectedStyle}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="portrait">Vertical</TabsTrigger>
                    <TabsTrigger value="square">Quadrado</TabsTrigger>
                    <TabsTrigger value="landscape">Horizontal</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Qualidade</h3>
                <Tabs value={selectedQuality} onValueChange={setSelectedQuality}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="low">Baixa</TabsTrigger>
                    <TabsTrigger value="medium">Média</TabsTrigger>
                    <TabsTrigger value="high">Alta</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="withAudio"
                    checked={withAudio}
                    onChange={(e) => setWithAudio(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="withAudio" className="text-sm font-medium">
                    Incluir áudio
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="optimize"
                    checked={optimize}
                    onChange={(e) => setOptimize(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="optimize" className="text-sm font-medium">
                    Otimizar para web
                  </label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="fps" className="text-sm font-medium">
                    FPS: {fps}
                  </label>
                  <input
                    type="range"
                    id="fps"
                    min="15"
                    max="60"
                    step="1"
                    value={fps}
                    onChange={(e) => setFps(Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}

          {generatedVideoUrl && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Vídeo gerado</h3>
              <video
                src={generatedVideoUrl}
                controls
                className="w-full rounded-lg border border-gray-200"
                style={{ maxHeight: "400px" }}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={generateVideo} disabled={!selectedProduct || isGenerating} className="w-full">
          {isGenerating ? "Gerando..." : "Gerar vídeo"}
        </Button>
      </CardFooter>
    </Card>
  )
}
