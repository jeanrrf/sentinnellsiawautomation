"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Download, RefreshCw, Sparkles, Wand2, CalendarIcon, Clock, Palette, Copy, Plus, Loader2 } from "lucide-react"
import { GenerationMode } from "@/lib/unified-card-service"

// Modos de interface
enum InterfaceMode {
  DESIGNER = "designer", // Interface completa de design
  QUICK = "quick", // Interface simplificada para geração rápida
  SCHEDULER = "scheduler", // Interface para agendamento
}

export function UnifiedCardGenerator() {
  const { toast } = useToast()

  // Estado da interface
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>(InterfaceMode.DESIGNER)
  const [activeTab, setActiveTab] = useState("design")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Estado do produto
  const [product, setProduct] = useState<any>(null)

  // Estado do resultado
  const [cardGenerated, setCardGenerated] = useState(false)
  const [cardUrls, setCardUrls] = useState<{ [format: string]: string }>({})
  const [secondaryCardUrls, setSecondaryCardUrls] = useState<{ [format: string]: string }>({})
  const [description, setDescription] = useState("")

  // Configurações de design
  const [designConfig, setDesignConfig] = useState({
    template: "modern",
    darkMode: true,
    accentColor: "#FF4D4D",
    showBadges: true,
    roundedCorners: true,
    useAI: true,
    customDescription: "",
    includeEmojis: true,
    includeHashtags: true,
    highlightDiscount: true,
    highlightUrgency: true,
    includeSecondVariation: true,
  })

  // Configurações de agendamento
  const [scheduleConfig, setScheduleConfig] = useState({
    date: undefined as Date | undefined,
    time: "12:00",
    frequency: "once",
    productCount: 5,
  })

  // Carregar produto de exemplo ao iniciar
  useEffect(() => {
    loadExampleProduct()
  }, [])

  // Carregar produto de exemplo
  const loadExampleProduct = async () => {
    setIsLoading(true)

    try {
      // Em produção, buscaria da API
      const exampleProduct = {
        itemId: "123456789",
        productName: "Fone de Ouvido Bluetooth com Cancelamento de Ruído",
        price: "149.90",
        priceDiscountRate: "30",
        sales: "1250",
        ratingStar: "4.8",
        shopName: "Tech Store Oficial",
        freeShipping: true,
        imageUrl: "/diverse-people-listening-headphones.png",
      }

      setProduct(exampleProduct)

      toast({
        title: "Produto carregado",
        description: "Produto de exemplo carregado com sucesso",
      })
    } catch (error: any) {
      console.error("Erro ao carregar produto:", error)

      toast({
        variant: "destructive",
        title: "Erro ao carregar produto",
        description: error.message || "Não foi possível carregar o produto de exemplo",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar configuração de design
  const updateDesignConfig = (updates: Partial<typeof designConfig>) => {
    setDesignConfig((prev) => ({ ...prev, ...updates }))
  }

  // Atualizar configuração de agendamento
  const updateScheduleConfig = (updates: Partial<typeof scheduleConfig>) => {
    setScheduleConfig((prev) => ({ ...prev, ...updates }))
  }

  // Simular progresso de geração
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

  // Gerar card
  const generateCard = async () => {
    if (!product) {
      toast({
        variant: "destructive",
        title: "Nenhum produto selecionado",
        description: "Selecione um produto para gerar o card",
      })
      return
    }

    setIsGenerating(true)
    setCardGenerated(false)
    const stopProgress = simulateProgress()

    try {
      // Em produção, chamaria a API real
      // Simulação de chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simular resposta da API
      const generationMode =
        interfaceMode === InterfaceMode.DESIGNER
          ? GenerationMode.MANUAL
          : interfaceMode === InterfaceMode.QUICK
            ? GenerationMode.QUICK
            : GenerationMode.AUTOMATED

      const mockResult = {
        success: true,
        cardUrls: {
          png: `/api/render-card/png/${product.itemId}?template=${designConfig.template}&darkMode=${designConfig.darkMode}`,
          jpeg: `/api/render-card/jpeg/${product.itemId}?template=${designConfig.template}&darkMode=${designConfig.darkMode}`,
        },
        secondaryCardUrls: designConfig.includeSecondVariation
          ? {
              png: `/api/render-card/png/${product.itemId}?template=elegant&darkMode=${designConfig.darkMode}`,
              jpeg: `/api/render-card/jpeg/${product.itemId}?template=elegant&darkMode=${designConfig.darkMode}`,
            }
          : undefined,
        description:
          designConfig.customDescription ||
          "🔥 SUPER OFERTA! 🔥\n\n" +
            product.productName +
            "\n\n💰 Apenas R$ " +
            product.price +
            "\n\n#oferta #shopee #desconto",
        product,
        metadata: {
          generationTime: 1200,
          mode: generationMode,
          template: designConfig.template,
        },
      }

      // Atualizar estado com o resultado
      setCardUrls(mockResult.cardUrls)
      setSecondaryCardUrls(mockResult.secondaryCardUrls || {})
      setDescription(mockResult.description)
      setGenerationProgress(100)
      setCardGenerated(true)

      toast({
        title: "Card gerado com sucesso",
        description: `Card gerado no modo ${generationMode} em ${mockResult.metadata.generationTime}ms`,
      })
    } catch (error: any) {
      console.error("Erro ao gerar card:", error)

      toast({
        variant: "destructive",
        title: "Erro ao gerar card",
        description: error.message || "Não foi possível gerar o card",
      })
    } finally {
      stopProgress()
      setIsGenerating(false)
    }
  }

  // Criar agendamento
  const createSchedule = async () => {
    if (!scheduleConfig.date) {
      toast({
        variant: "destructive",
        title: "Data não selecionada",
        description: "Selecione uma data para o agendamento",
      })
      return
    }

    setIsLoading(true)

    try {
      // Em produção, chamaria a API real
      // Simulação de chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Agendamento criado",
        description: `Agendamento criado para ${format(scheduleConfig.date, "dd/MM/yyyy")} às ${scheduleConfig.time}`,
      })

      // Resetar formulário
      updateScheduleConfig({
        date: undefined,
        time: "12:00",
        frequency: "once",
        productCount: 5,
      })
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error)

      toast({
        variant: "destructive",
        title: "Erro ao criar agendamento",
        description: error.message || "Não foi possível criar o agendamento",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Download de card
  const downloadCard = async (format: string, isSecondary = false) => {
    setIsDownloading(true)

    try {
      const url = isSecondary ? secondaryCardUrls[format] : cardUrls[format]

      if (!url) {
        throw new Error(`URL do card no formato ${format} não disponível`)
      }

      // Em produção, usaria uma função real de download
      // Simulação de download
      const link = document.createElement("a")
      link.href = url
      link.download = `card-${product?.itemId}-${isSecondary ? "secondary" : "primary"}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download iniciado",
        description: `Download do card no formato ${format.toUpperCase()} iniciado`,
      })
    } catch (error: any) {
      console.error("Erro ao baixar card:", error)

      toast({
        variant: "destructive",
        title: "Erro ao baixar card",
        description: error.message || "Não foi possível baixar o card",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Copiar descrição
  const copyDescription = async () => {
    try {
      await navigator.clipboard.writeText(description)

      toast({
        title: "Descrição copiada",
        description: "Descrição copiada para a área de transferência",
      })
    } catch (error: any) {
      console.error("Erro ao copiar descrição:", error)

      toast({
        variant: "destructive",
        title: "Erro ao copiar descrição",
        description: error.message || "Não foi possível copiar a descrição",
      })
    }
  }

  // Renderizar interface de designer
  const renderDesignerInterface = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Painel de Visualização */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Visualização</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="relative">
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {cardGenerated ? (
                <img
                  src={cardUrls.png || "/placeholder.svg"}
                  alt="Card Preview"
                  className="max-w-full h-auto border rounded-lg shadow-md"
                  style={{ maxHeight: "80vh" }}
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-muted rounded-lg"
                  style={{ width: "400px", height: "600px" }}
                >
                  <p className="text-muted-foreground">Clique em "Gerar Card" para visualizar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Controles */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="design" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="space-y-6">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <RadioGroup
                    value={designConfig.template}
                    onValueChange={(value) => updateDesignConfig({ template: value })}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="modern" id="modern" />
                      <Label htmlFor="modern">Moderno</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="elegant" id="elegant" />
                      <Label htmlFor="elegant">Elegante</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bold" id="bold" />
                      <Label htmlFor="bold">Ousado</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <Label>Cor de Destaque</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value={designConfig.accentColor}
                      onChange={(e) => updateDesignConfig({ accentColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={designConfig.accentColor}
                      onChange={(e) => updateDesignConfig({ accentColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Modo Escuro</Label>
                    <Switch
                      id="dark-mode"
                      checked={designConfig.darkMode}
                      onCheckedChange={(checked) => updateDesignConfig({ darkMode: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-badges">Mostrar Badges</Label>
                    <Switch
                      id="show-badges"
                      checked={designConfig.showBadges}
                      onCheckedChange={(checked) => updateDesignConfig({ showBadges: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="rounded-corners">Cantos Arredondados</Label>
                    <Switch
                      id="rounded-corners"
                      checked={designConfig.roundedCorners}
                      onCheckedChange={(checked) => updateDesignConfig({ roundedCorners: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="second-variation">Incluir Segunda Variação</Label>
                    <Switch
                      id="second-variation"
                      checked={designConfig.includeSecondVariation}
                      onCheckedChange={(checked) => updateDesignConfig({ includeSecondVariation: checked })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="use-ai">Gerar Descrição com IA</Label>
                    <Switch
                      id="use-ai"
                      checked={designConfig.useAI}
                      onCheckedChange={(checked) => updateDesignConfig({ useAI: checked })}
                    />
                  </div>

                  {!designConfig.useAI && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-description">Descrição Personalizada</Label>
                      <textarea
                        id="custom-description"
                        value={designConfig.customDescription}
                        onChange={(e) => updateDesignConfig({ customDescription: e.target.value })}
                        className="w-full min-h-[150px] p-2 border rounded-md"
                        placeholder="Digite sua descrição personalizada aqui..."
                      />
                    </div>
                  )}

                  {designConfig.useAI && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-emojis">Incluir Emojis</Label>
                        <Switch
                          id="include-emojis"
                          checked={designConfig.includeEmojis}
                          onCheckedChange={(checked) => updateDesignConfig({ includeEmojis: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-hashtags">Incluir Hashtags</Label>
                        <Switch
                          id="include-hashtags"
                          checked={designConfig.includeHashtags}
                          onCheckedChange={(checked) => updateDesignConfig({ includeHashtags: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="highlight-discount">Destacar Desconto</Label>
                        <Switch
                          id="highlight-discount"
                          checked={designConfig.highlightDiscount}
                          onCheckedChange={(checked) => updateDesignConfig({ highlightDiscount: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="highlight-urgency">Criar Urgência</Label>
                        <Switch
                          id="highlight-urgency"
                          checked={designConfig.highlightUrgency}
                          onCheckedChange={(checked) => updateDesignConfig({ highlightUrgency: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-4">
              <Button onClick={generateCard} className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar Card
                  </>
                )}
              </Button>

              {cardGenerated && (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => downloadCard("png")} variant="outline" disabled={isDownloading}>
                    <Download className="mr-2 h-4 w-4" />
                    PNG
                  </Button>
                  <Button onClick={() => downloadCard("jpeg")} variant="outline" disabled={isDownloading}>
                    <Download className="mr-2 h-4 w-4" />
                    JPEG
                  </Button>

                  {designConfig.includeSecondVariation && (
                    <>
                      <Button onClick={() => downloadCard("png", true)} variant="outline" disabled={isDownloading}>
                        <Download className="mr-2 h-4 w-4" />
                        PNG (Alt)
                      </Button>
                      <Button onClick={() => downloadCard("jpeg", true)} variant="outline" disabled={isDownloading}>
                        <Download className="mr-2 h-4 w-4" />
                        JPEG (Alt)
                      </Button>
                    </>
                  )}

                  <Button onClick={copyDescription} variant="outline" className="col-span-2">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Descrição
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {cardGenerated && description && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Descrição Gerada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line">{description}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  // Renderizar interface de geração rápida
  const renderQuickInterface = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Geração Rápida de Cards
        </CardTitle>
        <CardDescription>
          Crie cards otimizados para SEO e altas taxas de conversão com apenas um clique
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {product && (
              <div className="mb-4 p-4 bg-muted rounded-md">
                <p className="mb-1 font-medium">{product.productName}</p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Preço: R$ {product.price}</span>
                  <span>Vendas: {product.sales}</span>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-2 mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {generationProgress < 30
                    ? "Gerando descrição com IA..."
                    : generationProgress < 70
                      ? "Criando imagens..."
                      : "Finalizando..."}
                </p>
              </div>
            )}

            {cardGenerated && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-2 flex flex-col items-center">
                    <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                      <img
                        src={cardUrls.png || "/placeholder.svg"}
                        alt="PNG Card"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => downloadCard("png")}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PNG
                    </Button>
                  </div>

                  <div className="border rounded-md p-2 flex flex-col items-center">
                    <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                      <img
                        src={cardUrls.jpeg || "/placeholder.svg"}
                        alt="JPEG Card"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => downloadCard("jpeg")}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      JPEG
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line mb-2">{description}</div>
                  <Button size="sm" variant="outline" className="w-full" onClick={copyDescription}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar Texto
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={loadExampleProduct} disabled={isLoading || isGenerating}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>

        {!cardGenerated ? (
          <Button onClick={generateCard} disabled={isLoading || isGenerating || !product}>
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
          <Button onClick={() => setCardGenerated(false)} disabled={isGenerating}>
            <Wand2 className="mr-2 h-4 w-4" />
            Novo Card
          </Button>
        )}
      </CardFooter>
    </Card>
  )

  // Renderizar interface de agendamento
  const renderSchedulerInterface = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Agendamento de Geração
        </CardTitle>
        <CardDescription>Configure quando e como os cards serão gerados automaticamente</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="schedule-date">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="schedule-date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !scheduleConfig.date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduleConfig.date ? format(scheduleConfig.date, "PPP") : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={scheduleConfig.date}
                onSelect={(date) => updateScheduleConfig({ date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-time">Horário</Label>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              id="schedule-time"
              type="time"
              value={scheduleConfig.time}
              onChange={(e) => updateScheduleConfig({ time: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-frequency">Frequência</Label>
          <Select
            value={scheduleConfig.frequency}
            onValueChange={(value) => updateScheduleConfig({ frequency: value })}
          >
            <SelectTrigger id="schedule-frequency">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Uma vez</SelectItem>
              <SelectItem value="daily">Diariamente</SelectItem>
              <SelectItem value="weekly">Semanalmente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-count">Quantidade de Produtos</Label>
          <Input
            id="product-count"
            type="number"
            min={1}
            max={20}
            value={scheduleConfig.productCount}
            onChange={(e) => updateScheduleConfig({ productCount: Number.parseInt(e.target.value) || 5 })}
          />
          <p className="text-xs text-muted-foreground">Número de produtos diferentes para gerar em cada execução</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="schedule-dark-mode">Modo Escuro</Label>
            <Switch
              id="schedule-dark-mode"
              checked={designConfig.darkMode}
              onCheckedChange={(checked) => updateDesignConfig({ darkMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="schedule-all-styles">Todos os Estilos</Label>
            <Switch
              id="schedule-all-styles"
              checked={designConfig.includeSecondVariation}
              onCheckedChange={(checked) => updateDesignConfig({ includeSecondVariation: checked })}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={createSchedule} disabled={isLoading || !scheduleConfig.date} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-5 w-5" />
              Criar Agendamento
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Gerador Unificado de Cards</h1>
        <p className="text-muted-foreground mb-6">
          Crie cards modernos e visualmente atraentes para seus produtos com nosso gerador unificado.
        </p>

        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant={interfaceMode === InterfaceMode.DESIGNER ? "default" : "outline"}
            onClick={() => setInterfaceMode(InterfaceMode.DESIGNER)}
            className="flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            Designer Completo
          </Button>

          <Button
            variant={interfaceMode === InterfaceMode.QUICK ? "default" : "outline"}
            onClick={() => setInterfaceMode(InterfaceMode.QUICK)}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Geração Rápida
          </Button>

          <Button
            variant={interfaceMode === InterfaceMode.SCHEDULER ? "default" : "outline"}
            onClick={() => setInterfaceMode(InterfaceMode.SCHEDULER)}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Agendamento
          </Button>
        </div>
      </div>

      {interfaceMode === InterfaceMode.DESIGNER && renderDesignerInterface()}
      {interfaceMode === InterfaceMode.QUICK && renderQuickInterface()}
      {interfaceMode === InterfaceMode.SCHEDULER && renderSchedulerInterface()}
    </div>
  )
}
