"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Film, Play, Download, Trash2, ArrowUp, ArrowDown, Settings, ImageIcon } from "lucide-react"

interface ImageItem {
  id: string
  file: File
  url: string
  duration: number
}

export function ImageToVideoConverter() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  // Configurações
  const [framerate, setFramerate] = useState(30)
  const [transitionDuration, setTransitionDuration] = useState(0.5)
  const [defaultImageDuration, setDefaultImageDuration] = useState(3)
  const [videoQuality, setVideoQuality] = useState("high")
  const [addZoomEffect, setAddZoomEffect] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  // Limpar URLs de objeto quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
      images.forEach((image) => URL.revokeObjectURL(image.url))
    }
  }, [videoUrl, images])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles = Array.from(e.target.files)
    const newImages: ImageItem[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      url: URL.createObjectURL(file),
      duration: defaultImageDuration,
    }))

    setImages((prev) => [...prev, ...newImages])

    // Limpar o input para permitir selecionar os mesmos arquivos novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    toast({
      title: "Imagens adicionadas",
      description: `${newFiles.length} imagens foram adicionadas à fila.`,
    })

    // Mudar para a aba de edição se for o primeiro upload
    if (images.length === 0) {
      setActiveTab("edit")
    }
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const moveImage = (id: string, direction: "up" | "down") => {
    setImages((prev) => {
      const index = prev.findIndex((img) => img.id === id)
      if (index === -1) return prev

      const newImages = [...prev]
      const [removed] = newImages.splice(index, 1)

      if (direction === "up" && index > 0) {
        newImages.splice(index - 1, 0, removed)
      } else if (direction === "down" && index < prev.length - 1) {
        newImages.splice(index + 1, 0, removed)
      } else {
        newImages.splice(index, 0, removed)
      }

      return newImages
    })
  }

  const updateImageDuration = (id: string, duration: number) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, duration } : img)))
  }

  const applyDurationToAll = (duration: number) => {
    setImages((prev) => prev.map((img) => ({ ...img, duration })))
    setDefaultImageDuration(duration)
  }

  const generateVideo = async () => {
    if (images.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma imagem",
        description: "Adicione pelo menos uma imagem para gerar o vídeo.",
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setVideoUrl(null)

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas não encontrado")

      // Configurar canvas
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Contexto 2D não disponível")

      // Determinar as dimensões do vídeo com base na primeira imagem
      const firstImage = await loadImage(images[0].url)
      canvas.width = firstImage.width
      canvas.height = firstImage.height

      // Configurar MediaRecorder
      const stream = canvas.captureStream(framerate)
      const options: MediaRecorderOptions = {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: videoQuality === "high" ? 8000000 : videoQuality === "medium" ? 5000000 : 2500000,
      }

      // Verificar se o navegador suporta o codec
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm"
      }

      const recorder = new MediaRecorder(stream, options)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Criar o blob do vídeo
        const videoBlob = new Blob(chunks, { type: "video/webm" })

        // Converter WebM para MP4 usando um serviço web
        setProgress(95)

        try {
          // Aqui usamos o URL.createObjectURL diretamente, mas em uma implementação
          // completa, você poderia usar um serviço para converter WebM para MP4
          const url = URL.createObjectURL(videoBlob)
          setVideoUrl(url)
          setActiveTab("preview")

          toast({
            title: "Vídeo gerado com sucesso",
            description: "Seu vídeo está pronto para visualização e download.",
          })
        } catch (error) {
          console.error("Erro ao processar vídeo final:", error)
          toast({
            variant: "destructive",
            title: "Erro ao finalizar vídeo",
            description: "Ocorreu um erro ao processar o vídeo final.",
          })
        }

        setProgress(100)
        setIsGenerating(false)
      }

      // Iniciar gravação
      recorder.start()

      // Renderizar cada imagem sequencialmente
      let currentTime = 0

      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const nextImage = i < images.length - 1 ? images[i + 1] : null

        // Atualizar progresso
        setProgress(Math.floor((i / images.length) * 90))

        // Carregar imagem atual
        const img = await loadImage(image.url)

        // Renderizar imagem com duração e transição
        await renderImageSegment(
          ctx,
          img,
          nextImage ? await loadImage(nextImage.url) : null,
          image.duration,
          i,
          images.length,
        )

        currentTime += image.duration
      }

      // Parar gravação após renderizar todas as imagens
      recorder.stop()
    } catch (error) {
      console.error("Erro ao gerar vídeo:", error)
      setIsGenerating(false)
      toast({
        variant: "destructive",
        title: "Erro ao gerar vídeo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    }
  }

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  const renderImageSegment = async (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    nextImg: HTMLImageElement | null,
    duration: number,
    index: number,
    totalImages: number,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const totalDuration = duration * 1000 // em ms
      const transitionTime = transitionDuration * 1000 // em ms

      // Função para animar um quadro
      const drawFrame = (timestamp: number) => {
        const elapsed = timestamp - startTime

        if (elapsed >= totalDuration) {
          resolve()
          return
        }

        // Limpar canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        // Calcular progresso da animação (0 a 1)
        const progress = elapsed / totalDuration

        // Aplicar zoom se ativado
        if (addZoomEffect) {
          const scale = 1 + progress * 0.05 // Zoom de 0% a 5%
          const scaledWidth = ctx.canvas.width * scale
          const scaledHeight = ctx.canvas.height * scale
          const offsetX = (scaledWidth - ctx.canvas.width) / 2
          const offsetY = (scaledHeight - ctx.canvas.height) / 2

          ctx.drawImage(img, -offsetX, -offsetY, scaledWidth, scaledHeight)
        } else {
          // Desenhar imagem sem efeito
          ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height)
        }

        // Aplicar transição para a próxima imagem se estiver no final
        if (nextImg && elapsed > totalDuration - transitionTime) {
          const transitionProgress = (elapsed - (totalDuration - transitionTime)) / transitionTime

          // Desenhar próxima imagem com opacidade crescente
          ctx.globalAlpha = transitionProgress
          ctx.drawImage(nextImg, 0, 0, ctx.canvas.width, ctx.canvas.height)
          ctx.globalAlpha = 1
        }

        requestAnimationFrame(drawFrame)
      }

      // Iniciar animação
      requestAnimationFrame(drawFrame)
    })
  }

  const handleDownload = () => {
    if (!videoUrl) return

    const a = document.createElement("a")
    a.href = videoUrl
    a.download = `video-${Date.now()}.webm` // Idealmente seria .mp4, mas estamos gerando webm
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const clearAll = () => {
    // Revogar URLs de objeto
    images.forEach((image) => URL.revokeObjectURL(image.url))
    if (videoUrl) URL.revokeObjectURL(videoUrl)

    // Limpar estado
    setImages([])
    setVideoUrl(null)
    setActiveTab("upload")

    toast({
      title: "Tudo limpo",
      description: "Todas as imagens e vídeos foram removidos.",
    })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="edit" disabled={images.length === 0}>
            Editar
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!videoUrl}>
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Arraste e solte suas imagens aqui</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ou clique para selecionar arquivos</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  id="image-upload"
                />
                <Button onClick={() => fileInputRef.current?.click()}>Selecionar Imagens</Button>
              </div>
            </CardContent>
          </Card>

          {images.length > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {images.length} {images.length === 1 ? "imagem adicionada" : "imagens adicionadas"}
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("edit")}>
                Continuar para Edição
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:row-span-2">
              <CardContent className="pt-6 h-full">
                <h3 className="text-lg font-medium mb-4">Imagens ({images.length})</h3>

                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma imagem adicionada</p>
                    <Button variant="link" onClick={() => setActiveTab("upload")} className="mt-2">
                      Adicionar imagens
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-grow">
                          <p className="text-sm font-medium truncate">{image.file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Label htmlFor={`duration-${image.id}`} className="text-xs">
                              Duração: {image.duration}s
                            </Label>
                            <Slider
                              id={`duration-${image.id}`}
                              min={1}
                              max={10}
                              step={0.5}
                              value={[image.duration]}
                              onValueChange={(value) => updateImageDuration(image.id, value[0])}
                              className="w-24"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveImage(image.id, "up")}
                            disabled={index === 0}
                            className="h-6 w-6"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveImage(image.id, "down")}
                            disabled={index === images.length - 1}
                            className="h-6 w-6"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImage(image.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-4">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar mais
                  </Button>

                  <Button variant="destructive" size="sm" onClick={clearAll} disabled={images.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar tudo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Configurações</h3>
                  <Settings className="h-5 w-5 text-gray-500" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="default-duration">Duração padrão</Label>
                      <span className="text-sm text-gray-500">{defaultImageDuration}s</span>
                    </div>
                    <Slider
                      id="default-duration"
                      min={1}
                      max={10}
                      step={0.5}
                      value={[defaultImageDuration]}
                      onValueChange={(value) => setDefaultImageDuration(value[0])}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyDurationToAll(defaultImageDuration)}
                      disabled={images.length === 0}
                      className="w-full mt-1"
                    >
                      Aplicar a todas as imagens
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="transition-duration">Duração da transição</Label>
                      <span className="text-sm text-gray-500">{transitionDuration}s</span>
                    </div>
                    <Slider
                      id="transition-duration"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[transitionDuration]}
                      onValueChange={(value) => setTransitionDuration(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-quality">Qualidade do vídeo</Label>
                    <Select value={videoQuality} onValueChange={setVideoQuality}>
                      <SelectTrigger id="video-quality">
                        <SelectValue placeholder="Selecione a qualidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa (menor arquivo)</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta (melhor qualidade)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="framerate">Taxa de quadros (FPS)</Label>
                      <span className="text-sm text-gray-500">{framerate} fps</span>
                    </div>
                    <Slider
                      id="framerate"
                      min={24}
                      max={60}
                      step={1}
                      value={[framerate]}
                      onValueChange={(value) => setFramerate(value[0])}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="zoom-effect" className="cursor-pointer">
                      Efeito de zoom suave
                    </Label>
                    <Switch id="zoom-effect" checked={addZoomEffect} onCheckedChange={setAddZoomEffect} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Gerar Vídeo</h3>

                {isGenerating ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Gerando vídeo...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Isso pode levar alguns minutos dependendo do número de imagens.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Clique no botão abaixo para gerar seu vídeo com {images.length} imagens.
                      {images.length > 0 && (
                        <> Duração total estimada: {images.reduce((acc, img) => acc + img.duration, 0).toFixed(1)}s</>
                      )}
                    </p>

                    <Button onClick={generateVideo} disabled={images.length === 0 || isGenerating} className="w-full">
                      <Film className="h-4 w-4 mr-2" />
                      Gerar Vídeo MP4
                    </Button>

                    {videoUrl && (
                      <Button variant="outline" onClick={() => setActiveTab("preview")} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Ver Vídeo Gerado
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {videoUrl ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Preview do Vídeo</h3>

                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} src={videoUrl} controls className="w-full h-full" autoPlay />
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setActiveTab("edit")}>
                      Voltar para Edição
                    </Button>

                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Vídeo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Informações do Vídeo</h3>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Número de imagens:</span>
                      <span className="text-sm font-medium">{images.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Duração total:</span>
                      <span className="text-sm font-medium">
                        {images.reduce((acc, img) => acc + img.duration, 0).toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Taxa de quadros:</span>
                      <span className="text-sm font-medium">{framerate} fps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Qualidade:</span>
                      <span className="text-sm font-medium capitalize">{videoQuality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Formato:</span>
                      <span className="text-sm font-medium">WebM (compatível com a maioria dos navegadores)</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Nota:</strong> O vídeo é gerado no formato WebM, que é compatível com a maioria dos
                      navegadores modernos. Para converter para MP4, você pode usar ferramentas online gratuitas após o
                      download.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum vídeo gerado</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                Volte para a aba de edição e clique em "Gerar Vídeo" para criar seu vídeo.
              </p>
              <Button onClick={() => setActiveTab("edit")}>Ir para Edição</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Canvas oculto usado para renderização */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
