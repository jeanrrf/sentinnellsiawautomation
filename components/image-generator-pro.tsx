"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Download, ImageIcon, Loader2, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  timestamp: number
}

export function ImageGeneratorPro() {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [quality, setQuality] = useState(75)
  const [enhanceDetails, setEnhanceDetails] = useState(false)
  const [style, setStyle] = useState("realistic")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Simulated image generation
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Por favor, insira uma descrição para gerar a imagem.")
      return
    }

    setError(null)
    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 500)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      clearInterval(progressInterval)
      setProgress(100)

      // Generate a random placeholder image
      const dimensions = aspectRatio.split(":").map(Number)
      const width = dimensions[0] * 100
      const height = dimensions[1] * 100

      const imageId = `img-${Date.now()}`
      const imageUrl = `/placeholder.svg?height=${height}&width=${width}&query=${encodeURIComponent(prompt)}`

      const newImage = {
        id: imageId,
        url: imageUrl,
        prompt,
        timestamp: Date.now(),
      }

      setGeneratedImages((prev) => [newImage, ...prev])
      setSelectedImage(newImage)

      toast({
        title: "Imagem gerada com sucesso!",
        description: "Sua imagem foi criada conforme solicitado.",
      })
    } catch (err) {
      setError("Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.")
      console.error("Error generating image:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveImage = async () => {
    if (!selectedImage) return

    setIsSaving(true)

    try {
      // Simulate saving delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Imagem salva!",
        description: "A imagem foi salva com sucesso na sua biblioteca.",
      })
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a imagem. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const downloadImage = () => {
    if (!selectedImage) return

    // In a real app, this would trigger a download
    toast({
      title: "Download iniciado",
      description: "Sua imagem está sendo baixada.",
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Configurações de Geração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Descrição da Imagem</Label>
            <Textarea
              id="prompt"
              placeholder="Descreva a imagem que você deseja gerar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="negativePrompt">Elementos a Evitar (opcional)</Label>
            <Textarea
              id="negativePrompt"
              placeholder="Elementos que você não quer na imagem..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>

          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label>Proporção</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Quadrado (1:1)</SelectItem>
                    <SelectItem value="4:3">Paisagem (4:3)</SelectItem>
                    <SelectItem value="3:4">Retrato (3:4)</SelectItem>
                    <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estilo</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realista</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="3d">3D Render</SelectItem>
                    <SelectItem value="painting">Pintura</SelectItem>
                    <SelectItem value="sketch">Esboço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Qualidade</Label>
                  <span className="text-sm text-muted-foreground">{quality}%</span>
                </div>
                <Slider value={[quality]} min={25} max={100} step={5} onValueChange={(value) => setQuality(value[0])} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enhance-details">Melhorar Detalhes</Label>
                <Switch id="enhance-details" checked={enhanceDetails} onCheckedChange={setEnhanceDetails} />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={generateImage} disabled={isGenerating || !prompt.trim()} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Gerar Imagem
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Visualização</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedImage ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.url || "/placeholder.svg"}
                alt={selectedImage.prompt}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border bg-muted">
              <p className="text-center text-muted-foreground">Gere uma imagem para visualizá-la aqui</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={saveImage} disabled={!selectedImage || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar na Biblioteca
          </Button>
          <Button onClick={downloadImage} disabled={!selectedImage}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Histórico de Imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {generatedImages.length > 0 ? (
              generatedImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border ${
                    selectedImage?.id === image.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.prompt}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full flex h-32 items-center justify-center">
                <p className="text-center text-muted-foreground">Nenhuma imagem gerada ainda</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
