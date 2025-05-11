"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Download, RefreshCw } from "lucide-react"

export default function ModernCardDesigner() {
  const [template, setTemplate] = useState<"modern" | "minimal">("modern")
  const [colorScheme, setColorScheme] = useState<"dark" | "light" | "gradient">("dark")
  const [accentColor, setAccentColor] = useState("#FF4D4D")
  const [showBadges, setShowBadges] = useState(true)
  const [descriptionStyle, setDescriptionStyle] = useState<"clean" | "highlighted">("clean")
  const [roundedCorners, setRoundedCorners] = useState(true)
  const [previewUrl, setPreviewUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Generate preview URL based on current settings
  const generatePreviewUrl = () => {
    const params = new URLSearchParams({
      template,
      colorScheme,
      accentColor,
      showBadges: showBadges.toString(),
      descriptionStyle,
      roundedCorners: roundedCorners.toString(),
      t: Date.now().toString(), // Cache buster
    })

    return `/api/modern-card-test?${params.toString()}`
  }

  // Update preview when settings change
  const updatePreview = () => {
    setIsLoading(true)
    setPreviewUrl(generatePreviewUrl())
  }

  // Initial preview
  useEffect(() => {
    updatePreview()
  }, [])

  // Handle image load complete
  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // Download the current design
  const downloadCard = () => {
    const link = document.createElement("a")
    link.href = previewUrl
    link.download = `card-${template}-${colorScheme}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Card Designer Moderno</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Card Preview"
                  className="max-w-full h-auto border rounded-lg shadow-md"
                  style={{ maxHeight: "80vh" }}
                  onLoad={handleImageLoad}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="design" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="space-y-6">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <RadioGroup
                      value={template}
                      onValueChange={(value) => setTemplate(value as "modern" | "minimal")}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="modern" id="modern" />
                        <Label htmlFor="modern">Moderno</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="minimal" id="minimal" />
                        <Label htmlFor="minimal">Minimalista</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Color Scheme */}
                  <div className="space-y-2">
                    <Label>Esquema de Cores</Label>
                    <RadioGroup
                      value={colorScheme}
                      onValueChange={(value) => setColorScheme(value as "dark" | "light" | "gradient")}
                      className="grid grid-cols-3 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label htmlFor="dark">Escuro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light">Claro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gradient" id="gradient" />
                        <Label htmlFor="gradient">Gradiente</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-2">
                    <Label>Cor de Destaque</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-badges">Mostrar Badges</Label>
                      <Switch id="show-badges" checked={showBadges} onCheckedChange={setShowBadges} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="rounded-corners">Cantos Arredondados</Label>
                      <Switch id="rounded-corners" checked={roundedCorners} onCheckedChange={setRoundedCorners} />
                    </div>

                    <div className="space-y-2">
                      <Label>Estilo da Descrição</Label>
                      <RadioGroup
                        value={descriptionStyle}
                        onValueChange={(value) => setDescriptionStyle(value as "clean" | "highlighted")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="clean" id="clean" />
                          <Label htmlFor="clean">Limpo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="highlighted" id="highlighted" />
                          <Label htmlFor="highlighted">Destacado</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    As configurações de conteúdo estão disponíveis na versão completa do gerador. Esta é uma prévia com
                    dados de exemplo.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-4">
                <Button onClick={updatePreview} className="w-full" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar Visualização
                </Button>

                <Button onClick={downloadCard} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
