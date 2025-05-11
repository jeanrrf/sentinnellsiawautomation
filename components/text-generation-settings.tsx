"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { TextTone } from "@/lib/text-generation-service"
import { Sparkles, RefreshCw, Save, Wand2 } from "lucide-react"

interface TextGenerationSettingsProps {
  onSettingsChange?: (settings: any) => void
}

export function TextGenerationSettings({ onSettingsChange }: TextGenerationSettingsProps) {
  const [activeTab, setActiveTab] = useState("style")
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    tone: {
      [TextTone.YOUTHFUL]: true,
      [TextTone.HUMOROUS]: true,
      [TextTone.PERSUASIVE]: true,
      [TextTone.PROFESSIONAL]: false,
      [TextTone.CASUAL]: false,
    },
    maxLength: 300,
    includeEmojis: true,
    includeHashtags: true,
    highlightDiscount: true,
    highlightFeatures: true,
    highlightUrgency: true,
  })
  const [exampleText, setExampleText] = useState("")
  const { toast } = useToast()

  // Atualizar configurações
  const updateSettings = (newSettings: any) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    if (onSettingsChange) {
      onSettingsChange(updatedSettings)
    }
  }

  // Gerar exemplo de texto
  const generateExample = async () => {
    setIsLoading(true)

    try {
      // Preparar opções com base nas configurações
      const tones = Object.entries(settings.tone)
        .filter(([_, enabled]) => enabled)
        .map(([tone]) => tone)

      const options = {
        tone: tones,
        maxLength: settings.maxLength,
        includeEmojis: settings.includeEmojis,
        includeHashtags: settings.includeHashtags,
        highlightDiscount: settings.highlightDiscount,
        highlightFeatures: settings.highlightFeatures,
        highlightUrgency: settings.highlightUrgency,
      }

      // Produto de exemplo
      const exampleProduct = {
        itemId: "123456789",
        productName: "Fone de Ouvido Bluetooth com Cancelamento de Ruído",
        price: "149.90",
        priceDiscountRate: "30",
        sales: "1250",
        ratingStar: "4.8",
        shopName: "Tech Store Oficial",
        freeShipping: true,
      }

      // Chamar a API
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: exampleProduct,
          options,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setExampleText(data.description)
      } else {
        throw new Error(data.error || "Erro ao gerar exemplo")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar exemplo",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Salvar configurações
  const saveSettings = () => {
    localStorage.setItem("textGenerationSettings", JSON.stringify(settings))

    toast({
      title: "Configurações salvas",
      description: "Suas configurações de geração de texto foram salvas com sucesso.",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Configurações de Geração de Texto</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Powered by Gemini
          </Badge>
        </div>
        <CardDescription>Personalize como os textos são gerados para seus cards de produtos</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="style">Estilo</TabsTrigger>
            <TabsTrigger value="preview">Prévia</TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Tom da Mensagem</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="tone-youthful" className="flex flex-col space-y-1">
                      <span>Jovem</span>
                      <span className="font-normal text-xs text-muted-foreground">
                        Linguagem moderna e descontraída
                      </span>
                    </Label>
                    <Switch
                      id="tone-youthful"
                      checked={settings.tone[TextTone.YOUTHFUL]}
                      onCheckedChange={(checked) =>
                        updateSettings({ tone: { ...settings.tone, [TextTone.YOUTHFUL]: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="tone-humorous" className="flex flex-col space-y-1">
                      <span>Humorístico</span>
                      <span className="font-normal text-xs text-muted-foreground">
                        Textos divertidos e bem-humorados
                      </span>
                    </Label>
                    <Switch
                      id="tone-humorous"
                      checked={settings.tone[TextTone.HUMOROUS]}
                      onCheckedChange={(checked) =>
                        updateSettings({ tone: { ...settings.tone, [TextTone.HUMOROUS]: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="tone-persuasive" className="flex flex-col space-y-1">
                      <span>Persuasivo</span>
                      <span className="font-normal text-xs text-muted-foreground">Foco em conversão e vendas</span>
                    </Label>
                    <Switch
                      id="tone-persuasive"
                      checked={settings.tone[TextTone.PERSUASIVE]}
                      onCheckedChange={(checked) =>
                        updateSettings({ tone: { ...settings.tone, [TextTone.PERSUASIVE]: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="tone-professional" className="flex flex-col space-y-1">
                      <span>Profissional</span>
                      <span className="font-normal text-xs text-muted-foreground">Tom mais formal e técnico</span>
                    </Label>
                    <Switch
                      id="tone-professional"
                      checked={settings.tone[TextTone.PROFESSIONAL]}
                      onCheckedChange={(checked) =>
                        updateSettings({ tone: { ...settings.tone, [TextTone.PROFESSIONAL]: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="tone-casual" className="flex flex-col space-y-1">
                      <span>Casual</span>
                      <span className="font-normal text-xs text-muted-foreground">Conversacional e natural</span>
                    </Label>
                    <Switch
                      id="tone-casual"
                      checked={settings.tone[TextTone.CASUAL]}
                      onCheckedChange={(checked) =>
                        updateSettings({ tone: { ...settings.tone, [TextTone.CASUAL]: checked } })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="max-length">Tamanho Máximo: {settings.maxLength} caracteres</Label>
                </div>
                <Slider
                  id="max-length"
                  min={100}
                  max={500}
                  step={10}
                  value={[settings.maxLength]}
                  onValueChange={(value) => updateSettings({ maxLength: value[0] })}
                />
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-medium mb-2">Elementos do Texto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="include-emojis" className="flex flex-col space-y-1">
                      <span>Emojis</span>
                      <span className="font-normal text-xs text-muted-foreground">Incluir emojis no texto</span>
                    </Label>
                    <Switch
                      id="include-emojis"
                      checked={settings.includeEmojis}
                      onCheckedChange={(checked) => updateSettings({ includeEmojis: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="include-hashtags" className="flex flex-col space-y-1">
                      <span>Hashtags</span>
                      <span className="font-normal text-xs text-muted-foreground">Incluir hashtags relevantes</span>
                    </Label>
                    <Switch
                      id="include-hashtags"
                      checked={settings.includeHashtags}
                      onCheckedChange={(checked) => updateSettings({ includeHashtags: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="highlight-discount" className="flex flex-col space-y-1">
                      <span>Destacar Desconto</span>
                      <span className="font-normal text-xs text-muted-foreground">Enfatizar descontos e promoções</span>
                    </Label>
                    <Switch
                      id="highlight-discount"
                      checked={settings.highlightDiscount}
                      onCheckedChange={(checked) => updateSettings({ highlightDiscount: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="highlight-features" className="flex flex-col space-y-1">
                      <span>Destacar Características</span>
                      <span className="font-normal text-xs text-muted-foreground">Enfatizar recursos do produto</span>
                    </Label>
                    <Switch
                      id="highlight-features"
                      checked={settings.highlightFeatures}
                      onCheckedChange={(checked) => updateSettings({ highlightFeatures: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="highlight-urgency" className="flex flex-col space-y-1">
                      <span>Criar Urgência</span>
                      <span className="font-normal text-xs text-muted-foreground">Adicionar senso de urgência</span>
                    </Label>
                    <Switch
                      id="highlight-urgency"
                      checked={settings.highlightUrgency}
                      onCheckedChange={(checked) => updateSettings({ highlightUrgency: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Exemplo de Texto Gerado</h3>
                <Button variant="outline" size="sm" onClick={generateExample} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Gerar Exemplo
                    </>
                  )}
                </Button>
              </div>

              <Textarea
                value={exampleText}
                readOnly
                placeholder="Clique em 'Gerar Exemplo' para ver como ficará o texto com suas configurações."
                className="min-h-[200px]"
              />

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Dicas para textos eficazes:</h3>
                <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
                  <li>Combine diferentes tons para textos mais dinâmicos</li>
                  <li>Use emojis com moderação para destacar pontos importantes</li>
                  <li>Hashtags ajudam na descoberta do seu conteúdo</li>
                  <li>Crie urgência para aumentar a taxa de conversão</li>
                  <li>Destaque os benefícios, não apenas as características</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter>
        <Button onClick={saveSettings} className="w-full">
          <Save className="mr-2 h-5 w-5" />
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  )
}
