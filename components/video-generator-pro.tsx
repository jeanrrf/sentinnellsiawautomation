"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { ProductSelector } from "@/components/product-selector"
import { Loader2, Video, Download, Play, AlertCircle } from "lucide-react"

interface VideoGeneratorProProps {
  products: any[]
}

export function VideoGeneratorPro({ products }: VideoGeneratorProProps) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(10)
  const [videoStyle, setVideoStyle] = useState("portrait")
  const [withAudio, setWithAudio] = useState(false)
  const [generationStep, setGenerationStep] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  // Encontrar o produto selecionado para exibir informações
  const selectedProductInfo = products.find((p) => p.itemId === selectedProduct)

  const handleGenerateVideo = async () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um produto primeiro",
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setGenerationStep("Iniciando geração do vídeo...")

    // Simular progresso
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 5
      })
    }, 500)

    try {
      // Atualizar etapa
      setGenerationStep("Renderizando card e convertendo para vídeo...")

      // Fazer a requisição para gerar o vídeo
      const response = await fetch("/api/generate-product-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          duration: videoDuration,
          style: videoStyle,
          withAudio,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao gerar vídeo")
      }

      // Obter o blob do vídeo
      const videoBlob = await response.blob()

      // Criar URL para o blob
      const url = URL.createObjectURL(videoBlob)
      setVideoUrl(url)

      // Atualizar progresso para 100%
      setProgress(100)
      setGenerationStep("Vídeo gerado com sucesso!")

      toast({
        title: "Vídeo gerado com sucesso",
        description: "Você pode visualizar e baixar o vídeo agora",
      })
    } catch (error) {
      console.error("Erro ao gerar vídeo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar vídeo",
        description: error.message || "Ocorreu um erro ao gerar o vídeo",
      })
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => {
        setIsGenerating(false)
      }, 500)
    }
  }

  const handleDownloadVideo = () => {
    if (!videoUrl) return

    const a = document.createElement("a")
    a.href = videoUrl
    a.download = `produto-${selectedProduct}-${Date.now()}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Vídeos Profissional</CardTitle>
          <CardDescription>Crie vídeos em MP4 para TikTok a partir de produtos da Shopee</CardDescription>
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
            <Label htmlFor="videoStyle">Estilo do Vídeo</Label>
            <Select value={videoStyle} onValueChange={setVideoStyle}>
              <SelectTrigger id="videoStyle">
                <SelectValue placeholder="Selecione o estilo do vídeo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato (9:16) - Ideal para TikTok</SelectItem>
                <SelectItem value="square">Quadrado (1:1) - Instagram</SelectItem>
                <SelectItem value="landscape">Paisagem (16:9) - YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="videoDuration">Duração do Vídeo: {videoDuration} segundos</Label>
            </div>
            <Slider
              id="videoDuration"
              min={5}
              max={15}
              step={1}
              value={[videoDuration]}
              onValueChange={(value) => setVideoDuration(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5s</span>
              <span>10s</span>
              <span>15s</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="withAudio">Incluir Áudio (Música de Fundo)</Label>
            <Switch
              id="withAudio"
              checked={withAudio}
              onCheckedChange={setWithAudio}
              disabled={true} // Desabilitado por enquanto
            />
          </div>

          {isGenerating && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>{generationStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A geração de vídeo pode levar até 30 segundos. O processo utiliza recursos do servidor para renderizar o
              card em alta qualidade.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateVideo} disabled={!selectedProduct || isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Vídeo...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Gerar Vídeo MP4
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview do Vídeo</CardTitle>
          <CardDescription>Visualize e baixe o vídeo gerado para publicação no TikTok</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="info">Informações</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="p-4">
              {videoUrl ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-md mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      loop
                    />
                  </div>

                  <div className="flex gap-2 mt-4 w-full max-w-md">
                    <Button variant="outline" className="flex-1" onClick={() => videoRef.current?.play()}>
                      <Play className="mr-2 h-4 w-4" />
                      Reproduzir
                    </Button>
                    <Button className="flex-1" onClick={handleDownloadVideo}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar MP4
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">Gere um vídeo para visualizá-lo aqui</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Sobre o Gerador de Vídeos</h3>
                  <p className="text-sm text-muted-foreground">
                    Este gerador cria vídeos MP4 de alta qualidade a partir dos cards de produtos, prontos para
                    publicação no TikTok e outras plataformas.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Processo de Geração</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Renderização do card HTML em alta resolução</li>
                    <li>Conversão para vídeo MP4 com efeitos de transição</li>
                    <li>Adição de áudio (opcional, em breve)</li>
                    <li>Otimização para plataformas sociais</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Dicas de Uso</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use o formato retrato (9:16) para TikTok e Reels</li>
                    <li>Duração recomendada: 7-10 segundos</li>
                    <li>Baixe o vídeo e faça upload diretamente no TikTok</li>
                    <li>Adicione hashtags relevantes na descrição do TikTok</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
