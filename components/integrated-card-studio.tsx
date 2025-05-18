"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Download,
  RefreshCw,
  Sparkles,
  Wand2,
  Palette,
  Copy,
  Plus,
  Loader2,
  History,
  Save,
  Play,
  Pause,
  Settings,
  ImageIcon,
  Package,
  Calendar,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Undo,
  RotateCcw,
} from "lucide-react"
import { GenerationMode } from "@/lib/unified-card-service"

// Templates disponíveis
const TEMPLATES = [
  { id: "modern", name: "Moderno" },
  { id: "elegant", name: "Elegante" },
  { id: "bold", name: "Ousado" },
  { id: "minimal", name: "Minimalista" },
  { id: "vibrant", name: "Vibrante" },
]

// Tipos de frequência
const FREQUENCY_TYPES = [
  { id: "once", name: "Uma vez" },
  { id: "daily", name: "Diariamente" },
  { id: "weekly", name: "Semanalmente" },
  { id: "monthly", name: "Mensalmente" },
]

// Dias da semana
const WEEKDAYS = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda" },
  { id: 2, name: "Terça" },
  { id: 3, name: "Quarta" },
  { id: 4, name: "Quinta" },
  { id: 5, name: "Sexta" },
  { id: 6, name: "Sábado" },
]

// Tipos de busca
const SEARCH_TYPES = [
  { id: "best_sellers", name: "Mais Vendidos" },
  { id: "biggest_discounts", name: "Maiores Descontos" },
  { id: "best_rated", name: "Melhor Avaliados" },
  { id: "trending", name: "Em Alta" },
]

export function IntegratedCardStudio() {
  const { toast } = useToast()
  const previewRef = useRef<HTMLDivElement>(null)

  // Estado do produto
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Estado de geração
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [cardGenerated, setCardGenerated] = useState(false)
  const [cardUrls, setCardUrls] = useState<{ [format: string]: string }>({})
  const [secondaryCardUrls, setSecondaryCardUrls] = useState<{ [format: string]: string }>({})
  const [description, setDescription] = useState("")
  const [activeVariation, setActiveVariation] = useState<"primary" | "secondary">("primary")

  // Estado de download
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingType, setDownloadingType] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

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

  // Estado de agendamento
  const [schedules, setSchedules] = useState<any[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<any>({
    id: "",
    name: "",
    enabled: true,
    frequency: "daily",
    time: "09:00",
    weekdays: [1, 3, 5],
    dayOfMonth: 1,
    searchType: "best_sellers",
    limit: 5,
    template: "modern",
    darkMode: true,
    includeSecondVariation: true,
    lastRun: null,
    nextRun: null,
  })
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)

  // Estado do histórico
  const [generationHistory, setGenerationHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null)

  // Carregar dados iniciais
  useEffect(() => {
    loadExampleProducts()
    loadSchedules()
    loadGenerationHistory()
  }, [])

  // Carregar produtos de exemplo
  const loadExampleProducts = async () => {
    setIsLoadingProducts(true)

    try {
      // Em produção, buscaria da API
      const exampleProducts = [
        {
          itemId: "123456789",
          productName: "Fone de Ouvido Bluetooth com Cancelamento de Ruído",
          price: "149.90",
          priceDiscountRate: "30",
          sales: "1250",
          ratingStar: "4.8",
          shopName: "Tech Store Oficial",
          freeShipping: true,
          imageUrl: "/diverse-people-listening-headphones.png",
        },
        {
          itemId: "987654321",
          productName: "Smartwatch Fitness Tracker à Prova D'água",
          price: "199.90",
          priceDiscountRate: "25",
          sales: "980",
          ratingStar: "4.6",
          shopName: "Gadget World",
          freeShipping: true,
          imageUrl: "/modern-smartwatch.png",
        },
        {
          itemId: "456789123",
          productName: "Câmera de Segurança Wi-Fi HD 1080p",
          price: "129.90",
          priceDiscountRate: "15",
          sales: "750",
          ratingStar: "4.3",
          shopName: "Smart Home Store",
          freeShipping: false,
          imageUrl: "/outdoor-security-camera.png",
        },
      ]

      setProducts(exampleProducts)
      setProduct(exampleProducts[0])
      setSelectedProductId(exampleProducts[0].itemId)

      toast({
        title: "Produtos carregados",
        description: "Produtos de exemplo carregados com sucesso",
      })
    } catch (error: any) {
      console.error("Erro ao carregar produtos:", error)

      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error.message || "Não foi possível carregar os produtos de exemplo",
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Carregar agendamentos
  const loadSchedules = async () => {
    try {
      // Em produção, buscaria da API
      // Simulação de chamada à API
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Agendamentos de exemplo
      const exampleSchedules = [
        {
          id: "schedule-1",
          name: "Geração Diária de Cards",
          enabled: true,
          frequency: "daily",
          time: "09:00",
          weekdays: [1, 3, 5],
          dayOfMonth: 1,
          searchType: "best_sellers",
          limit: 5,
          template: "modern",
          darkMode: true,
          includeSecondVariation: true,
          lastRun: new Date(Date.now() - 86400000).toISOString(), // Ontem
          nextRun: new Date(Date.now() + 86400000).toISOString(), // Amanhã
        },
        {
          id: "schedule-2",
          name: "Promoções Semanais",
          enabled: true,
          frequency: "weekly",
          time: "10:00",
          weekdays: [1],
          dayOfMonth: 1,
          searchType: "biggest_discounts",
          limit: 3,
          template: "vibrant",
          darkMode: false,
          includeSecondVariation: true,
          lastRun: new Date(Date.now() - 604800000).toISOString(), // Semana passada
          nextRun: new Date(Date.now() + 604800000).toISOString(), // Próxima semana
        },
      ]

      setSchedules(exampleSchedules)
    } catch (error: any) {
      console.error("Erro ao carregar agendamentos:", error)

      toast({
        variant: "destructive",
        title: "Erro ao carregar agendamentos",
        description: error.message || "Não foi possível carregar os agendamentos",
      })
    }
  }

  // Carregar histórico de geração
  const loadGenerationHistory = async () => {
    setIsLoadingHistory(true)

    try {
      // Em produção, buscaria da API
      // Simulação de chamada à API
      await new Promise((resolve) => setTimeout(resolve, 700))

      // Histórico de exemplo
      const exampleHistory = [
        {
          id: "gen_1",
          productId: "123456789",
          productName: "Fone de Ouvido Bluetooth com Cancelamento de Ruído",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
          mode: GenerationMode.MANUAL,
          template: "modern",
          cardUrls: {
            png: "/headphones-card.png",
            jpeg: "/headphones-card.png",
          },
        },
        {
          id: "gen_2",
          productId: "987654321",
          productName: "Smartwatch Fitness Tracker à Prova D'água",
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
          mode: GenerationMode.MANUAL,
          template: "elegant",
          cardUrls: {
            png: "/placeholder.svg?key=eo9uy",
            jpeg: "/placeholder.svg?key=3kk54",
          },
        },
        {
          id: "gen_3",
          productId: "456789123",
          productName: "Câmera de Segurança Wi-Fi HD 1080p",
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          mode: GenerationMode.AUTOMATED,
          template: "vibrant",
          scheduleId: "schedule-1",
          cardUrls: {
            png: "/camera-card.png",
            jpeg: "/camera-card.png",
          },
        },
      ]

      setGenerationHistory(exampleHistory)
    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error)

      toast({
        variant: "destructive",
        title: "Erro ao carregar histórico",
        description: error.message || "Não foi possível carregar o histórico de geração",
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Selecionar produto
  const selectProduct = (productId: string) => {
    const selectedProduct = products.find((p) => p.itemId === productId)
    if (selectedProduct) {
      setProduct(selectedProduct)
      setSelectedProductId(productId)
      // Resetar estado de geração ao trocar de produto
      setCardGenerated(false)
    }
  }

  // Atualizar configuração de design
  const updateDesignConfig = (updates: Partial<typeof designConfig>) => {
    setDesignConfig((prev) => ({ ...prev, ...updates }))
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
          mode: GenerationMode.MANUAL,
          template: designConfig.template,
        },
      }

      // Atualizar estado com o resultado
      setCardUrls(mockResult.cardUrls)
      setSecondaryCardUrls(mockResult.secondaryCardUrls || {})
      setDescription(mockResult.description)
      setGenerationProgress(100)
      setCardGenerated(true)
      setActiveVariation("primary")

      // Adicionar ao histórico
      const newHistoryEntry = {
        id: `gen_${Date.now()}`,
        productId: product.itemId,
        productName: product.productName,
        timestamp: new Date().toISOString(),
        mode: GenerationMode.MANUAL,
        template: designConfig.template,
        cardUrls: mockResult.cardUrls,
      }

      setGenerationHistory((prev) => [newHistoryEntry, ...prev])

      // Rolar para a visualização
      if (previewRef.current) {
        previewRef.current.scrollIntoView({ behavior: "smooth" })
      }

      toast({
        title: "Card gerado com sucesso",
        description: `Card gerado em ${mockResult.metadata.generationTime}ms`,
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

  // Download de card
  const downloadCard = async (format: string, isSecondary = false) => {
    setIsDownloading(true)
    setDownloadingType(format)

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
      setDownloadingType(null)
    }
  }

  // Download de todos os formatos
  const downloadAllFormats = async () => {
    setIsDownloading(true)
    setDownloadingType("all")

    try {
      // Em produção, usaria uma função real de download
      // Simulação de download
      setTimeout(() => {
        toast({
          title: "Download concluído",
          description: "Todos os formatos foram baixados com sucesso",
        })
        setIsDownloading(false)
        setDownloadingType(null)
      }, 1500)
    } catch (error: any) {
      console.error("Erro ao baixar todos os formatos:", error)

      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: error.message || "Não foi possível baixar todos os formatos",
      })
      setIsDownloading(false)
      setDownloadingType(null)
    }
  }

  // Copiar descrição
  const copyDescription = async () => {
    try {
      await navigator.clipboard.writeText(description)
      setCopySuccess("description")
      setTimeout(() => setCopySuccess(null), 2000)

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

  // Criar novo agendamento
  const createNewSchedule = () => {
    setCurrentSchedule({
      id: "",
      name: `Novo Agendamento ${schedules.length + 1}`,
      enabled: true,
      frequency: "daily",
      time: "09:00",
      weekdays: [1, 3, 5],
      dayOfMonth: 1,
      searchType: "best_sellers",
      limit: 5,
      template: designConfig.template,
      darkMode: designConfig.darkMode,
      includeSecondVariation: designConfig.includeSecondVariation,
      lastRun: null,
      nextRun: null,
    })
    setIsEditingSchedule(true)
  }

  // Selecionar agendamento para edição
  const selectSchedule = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (schedule) {
      setCurrentSchedule({ ...schedule })
      setIsEditingSchedule(true)
    }
  }

  // Atualizar agendamento atual
  const updateCurrentSchedule = (updates: Partial<typeof currentSchedule>) => {
    setCurrentSchedule((prev) => ({ ...prev, ...updates }))
  }

  // Salvar agendamento
  const saveSchedule = async () => {
    if (!currentSchedule.name) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o agendamento.",
      })
      return
    }

    setIsSavingSchedule(true)

    try {
      // Em produção, chamaria a API real
      // Simulação de chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Calcular próxima execução
      const nextRun = new Date()
      nextRun.setDate(nextRun.getDate() + 1) // Amanhã
      const updatedSchedule = {
        ...currentSchedule,
        nextRun: nextRun.toISOString(),
      }

      // Verificar se é um novo agendamento ou atualização
      const existingIndex = schedules.findIndex((s) => s.id === updatedSchedule.id)
      let updatedSchedules

      if (existingIndex >= 0) {
        // Atualizar agendamento existente
        updatedSchedules = [...schedules]
        updatedSchedules[existingIndex] = updatedSchedule
      } else {
        // Adicionar novo agendamento
        updatedSchedule.id = `schedule_${Date.now()}`
        updatedSchedules = [...schedules, updatedSchedule]
      }

      setSchedules(updatedSchedules)
      setCurrentSchedule(updatedSchedule)
      setIsEditingSchedule(false)

      toast({
        title: "Agendamento salvo",
        description: "O agendamento foi salvo com sucesso.",
      })
    } catch (error: any) {
      console.error("Erro ao salvar agendamento:", error)

      toast({
        variant: "destructive",
        title: "Erro ao salvar agendamento",
        description: error.message || "Não foi possível salvar o agendamento",
      })
    } finally {
      setIsSavingSchedule(false)
    }
  }

  // Excluir agendamento
  const deleteSchedule = async (scheduleId: string) => {
    try {
      // Em produção, chamaria a API real
      // Simulação de chamada à API
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Filtrar agendamento a ser excluído
      const updatedSchedules = schedules.filter((s) => s.id !== scheduleId)
      setSchedules(updatedSchedules)

      // Se o agendamento atual foi excluído, resetar
      if (currentSchedule.id === scheduleId) {
        setIsEditingSchedule(false)
      }

      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      })
    } catch (error: any) {
      console.error("Erro ao excluir agendamento:", error)

      toast({
        variant: "destructive",
        title: "Erro ao excluir agendamento",
        description: error.message || "Não foi possível excluir o agendamento",
      })
    }
  }

  // Alternar status de ativação do agendamento
  const toggleScheduleStatus = (scheduleId: string) => {
    const updatedSchedules = schedules.map((schedule) => {
      if (schedule.id === scheduleId) {
        const updated = { ...schedule, enabled: !schedule.enabled }

        // Se o agendamento atual foi alterado, atualizar também
        if (currentSchedule.id === scheduleId) {
          setCurrentSchedule(updated)
        }

        return updated
      }
      return schedule
    })

    setSchedules(updatedSchedules)

    toast({
      title: "Status alterado",
      description: `Agendamento ${updatedSchedules.find((s) => s.id === scheduleId)?.enabled ? "ativado" : "desativado"} com sucesso.`,
    })
  }

  // Executar agendamento manualmente
  const runScheduleNow = async (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return

    toast({
      title: "Executando agendamento",
      description: `Iniciando execução manual do agendamento "${schedule.name}"...`,
    })

    // Simular execução (em um sistema real, isso chamaria a API)
    setTimeout(() => {
      // Atualizar data da última execução
      const updatedSchedules = schedules.map((s) => {
        if (s.id === scheduleId) {
          const updated = {
            ...s,
            lastRun: new Date().toISOString(),
            nextRun: new Date(Date.now() + 86400000).toISOString(), // Amanhã
          }

          // Se o agendamento atual foi alterado, atualizar também
          if (currentSchedule.id === scheduleId) {
            setCurrentSchedule(updated)
          }

          return updated
        }
        return s
      })

      setSchedules(updatedSchedules)

      // Adicionar ao histórico
      const newHistoryEntry = {
        id: `gen_${Date.now()}`,
        productId: "123456789",
        productName: "Fone de Ouvido Bluetooth com Cancelamento de Ruído",
        timestamp: new Date().toISOString(),
        mode: GenerationMode.AUTOMATED,
        template: schedule.template,
        scheduleId: schedule.id,
        cardUrls: {
          png: "/headphones-card.png",
          jpeg: "/headphones-card.png",
        },
      }

      setGenerationHistory((prev) => [newHistoryEntry, ...prev])

      toast({
        title: "Execução concluída",
        description: `O agendamento "${schedule.name}" foi executado com sucesso.`,
      })
    }, 2000)
  }

  // Alternar dia da semana
  const toggleWeekday = (dayId: number) => {
    const weekdays = [...(currentSchedule.weekdays || [])]
    const index = weekdays.indexOf(dayId)

    if (index >= 0) {
      // Remover dia (garantir que pelo menos um dia permaneça selecionado)
      if (weekdays.length > 1) {
        weekdays.splice(index, 1)
      }
    } else {
      // Adicionar dia
      weekdays.push(dayId)
    }

    updateCurrentSchedule({ weekdays })
  }

  // Formatar data para exibição
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Recriar card a partir do histórico
  const recreateFromHistory = (entry: any) => {
    // Selecionar o produto
    selectProduct(entry.productId)

    // Configurar o designer com as mesmas configurações
    updateDesignConfig({
      template: entry.template,
      darkMode: true,
    })

    // Gerar o card
    setTimeout(() => {
      generateCard()
    }, 100)

    setSelectedHistoryEntry(null)
  }

  // Aplicar configurações do agendamento ao design atual
  const applyScheduleToDesign = (schedule: any) => {
    updateDesignConfig({
      template: schedule.template,
      darkMode: schedule.darkMode,
      includeSecondVariation: schedule.includeSecondVariation,
    })

    toast({
      title: "Configurações aplicadas",
      description: "As configurações do agendamento foram aplicadas ao design atual.",
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Studio de Cards Integrado</h1>
        <p className="text-muted-foreground">
          Plataforma unificada para design, geração e automação de cards para produtos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Principal - Seleção de Produto e Visualização */}
        <div className="lg:col-span-8 space-y-6">
          {/* Seleção de Produto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Sparkles className="h-5 w-5 text-primary mr-2" />
                Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="product-select" className="mb-2 block">
                    Selecione um Produto
                  </Label>
                  <Select value={selectedProductId || ""} onValueChange={selectProduct}>
                    <SelectTrigger id="product-select">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.itemId} value={p.itemId}>
                          {p.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-none">
                  <Label className="mb-2 block opacity-0">Atualizar</Label>
                  <Button
                    variant="outline"
                    onClick={loadExampleProducts}
                    disabled={isLoadingProducts}
                    className="w-full"
                  >
                    {isLoadingProducts ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar Produtos
                  </Button>
                </div>
              </div>

              {product && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{product.productName}</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preço:</span>
                          <span>R$ {product.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Desconto:</span>
                          <span>{product.priceDiscountRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vendas:</span>
                          <span>{product.sales}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avaliação:</span>
                          <span>{product.ratingStar} ⭐</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-none">
                      <Button onClick={generateCard} disabled={isGenerating || !product}>
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Gerar Card
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visualização do Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <ImageIcon className="h-5 w-5 text-primary mr-2" />
                Visualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={previewRef} className="flex flex-col items-center justify-center">
                {isGenerating && (
                  <div className="w-full mb-4">
                    <div className="space-y-2">
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
                  </div>
                )}

                {cardGenerated ? (
                  <div className="space-y-4 w-full">
                    {/* Seletor de Variação */}
                    {designConfig.includeSecondVariation && (
                      <div className="flex justify-center mb-2">
                        <div className="inline-flex rounded-md shadow-sm">
                          <Button
                            variant={activeVariation === "primary" ? "default" : "outline"}
                            className="rounded-r-none"
                            onClick={() => setActiveVariation("primary")}
                          >
                            Estilo Principal
                          </Button>
                          <Button
                            variant={activeVariation === "secondary" ? "default" : "outline"}
                            className="rounded-l-none"
                            onClick={() => setActiveVariation("secondary")}
                          >
                            Estilo Alternativo
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Visualização do Card */}
                    <div className="flex justify-center">
                      <img
                        src={
                          activeVariation === "primary"
                            ? cardUrls.png || "/placeholder.svg"
                            : secondaryCardUrls.png || "/placeholder.svg"
                        }
                        alt="Card Preview"
                        className="max-w-full h-auto border rounded-lg shadow-md"
                        style={{ maxHeight: "70vh" }}
                      />
                    </div>

                    {/* Botões de Download */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button
                        onClick={() => downloadCard("png", activeVariation === "secondary")}
                        variant="outline"
                        disabled={isDownloading}
                      >
                        {isDownloading && downloadingType === "png" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        PNG
                      </Button>
                      <Button
                        onClick={() => downloadCard("jpeg", activeVariation === "secondary")}
                        variant="outline"
                        disabled={isDownloading}
                      >
                        {isDownloading && downloadingType === "jpeg" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        JPEG
                      </Button>
                      <Button onClick={copyDescription} variant="outline" disabled={isDownloading}>
                        {copySuccess === "description" ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Texto
                          </>
                        )}
                      </Button>
                      <Button onClick={downloadAllFormats} disabled={isDownloading}>
                        {isDownloading && downloadingType === "all" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="mr-2 h-4 w-4" />
                        )}
                        Baixar Tudo
                      </Button>
                    </div>

                    {/* Descrição */}
                    <div className="border rounded-md p-3">
                      <h3 className="text-sm font-medium mb-2">Descrição</h3>
                      <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line mb-2">{description}</div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center bg-muted rounded-lg"
                    style={{ width: "100%", height: "400px" }}
                  >
                    {product ? (
                      <>
                        <ImageIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground text-center max-w-xs">
                          Clique em "Gerar Card" para visualizar o card para{" "}
                          <span className="font-medium">{product.productName}</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Selecione um produto para começar</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel Lateral - Configurações, Agendamentos e Histórico */}
        <div className="lg:col-span-4 space-y-6">
          {/* Configurações de Design */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Palette className="h-5 w-5 text-primary mr-2" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              <Tabs defaultValue="design" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="space-y-4">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <RadioGroup
                      value={designConfig.template}
                      onValueChange={(value) => updateDesignConfig({ template: value })}
                      className="grid grid-cols-3 gap-2"
                    >
                      {TEMPLATES.map((template) => (
                        <div key={template.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={template.id} id={template.id} />
                          <Label htmlFor={template.id}>{template.name}</Label>
                        </div>
                      ))}
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
                  <div className="space-y-3">
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
                  <div className="space-y-3">
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
            </CardContent>
          </Card>

          {/* Agendamentos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Calendar className="h-5 w-5 text-primary mr-2" />
                Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              {isEditingSchedule ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-name">Nome do Agendamento</Label>
                    <Input
                      id="schedule-name"
                      value={currentSchedule.name}
                      onChange={(e) => updateCurrentSchedule({ name: e.target.value })}
                      placeholder="Nome do agendamento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequência</Label>
                    <Select
                      value={currentSchedule.frequency}
                      onValueChange={(value) => updateCurrentSchedule({ frequency: value })}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Selecione uma frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      type="time"
                      value={currentSchedule.time}
                      onChange={(e) => updateCurrentSchedule({ time: e.target.value })}
                    />
                  </div>

                  {currentSchedule.frequency === "weekly" && (
                    <div className="space-y-2">
                      <Label>Dias da Semana</Label>
                      <div className="grid grid-cols-7 gap-1">
                        {WEEKDAYS.map((day) => (
                          <Button
                            key={day.id}
                            type="button"
                            size="sm"
                            variant={currentSchedule.weekdays?.includes(day.id) ? "default" : "outline"}
                            className="h-8 text-xs"
                            onClick={() => toggleWeekday(day.id)}
                          >
                            {day.name.substring(0, 1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="search-type">Tipo de Busca</Label>
                    <Select
                      value={currentSchedule.searchType}
                      onValueChange={(value) => updateCurrentSchedule({ searchType: value })}
                    >
                      <SelectTrigger id="search-type">
                        <SelectValue placeholder="Selecione um tipo de busca" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEARCH_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <Select
                      value={currentSchedule.template}
                      onValueChange={(value) => updateCurrentSchedule({ template: value })}
                    >
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATES.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="schedule-enabled"
                      checked={currentSchedule.enabled}
                      onCheckedChange={(checked) => updateCurrentSchedule({ enabled: checked })}
                    />
                    <Label htmlFor="schedule-enabled">Ativar Agendamento</Label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveSchedule} disabled={isSavingSchedule} className="flex-1">
                      {isSavingSchedule ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingSchedule(false)}
                      disabled={isSavingSchedule}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={createNewSchedule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Agendamento
                  </Button>

                  {schedules.length === 0 ? (
                    <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                      Nenhum agendamento encontrado
                    </div>
                  ) : (
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-2">
                        {schedules.map((schedule) => (
                          <div key={schedule.id} className="p-3 border rounded-md hover:bg-muted transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{schedule.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {FREQUENCY_TYPES.find((f) => f.id === schedule.frequency)?.name || schedule.frequency}{" "}
                                  às {schedule.time}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-7 w-7 ${schedule.enabled ? "text-green-500" : "text-gray-400"}`}
                                  onClick={() => toggleScheduleStatus(schedule.id)}
                                >
                                  {schedule.enabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                  <span className="sr-only">{schedule.enabled ? "Desativar" : "Ativar"}</span>
                                </Button>
                              </div>
                            </div>

                            <div className="mt-2 flex justify-between items-center">
                              <Badge variant={schedule.enabled ? "default" : "outline"}>
                                {schedule.enabled ? "Ativo" : "Inativo"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Próxima: {formatDate(schedule.nextRun)}
                              </span>
                            </div>

                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => selectSchedule(schedule.id)}
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => applyScheduleToDesign(schedule)}
                              >
                                <Undo className="h-3 w-3 mr-1" />
                                Aplicar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => runScheduleNow(schedule.id)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Executar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <History className="h-5 w-5 text-primary mr-2" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              {selectedHistoryEntry ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={() => setSelectedHistoryEntry(null)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Voltar
                    </Button>
                    <span className="text-sm">{formatDate(selectedHistoryEntry.timestamp)}</span>
                  </div>

                  <div className="text-center">
                    <h3 className="font-medium">{selectedHistoryEntry.productName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Template: {TEMPLATES.find((t) => t.id === selectedHistoryEntry.template)?.name || "Padrão"}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <img
                      src={selectedHistoryEntry.cardUrls.png || "/placeholder.svg"}
                      alt="Card Preview"
                      className="max-w-full h-auto border rounded-lg shadow-md"
                      style={{ maxHeight: "300px" }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const link = document.createElement("a")
                        link.href = selectedHistoryEntry.cardUrls.png
                        link.download = `card-${selectedHistoryEntry.id}.png`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                    <Button className="flex-1" onClick={() => recreateFromHistory(selectedHistoryEntry)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Recriar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Gerações Recentes</h3>
                    <Button variant="outline" size="sm" onClick={loadGenerationHistory}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Atualizar
                    </Button>
                  </div>

                  {isLoadingHistory ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : generationHistory.length === 0 ? (
                    <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                      Nenhum histórico de geração encontrado
                    </div>
                  ) : (
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-2">
                        {generationHistory.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 border rounded-md hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => setSelectedHistoryEntry(entry)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium line-clamp-1">{entry.productName}</h4>
                                <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="mt-2 flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                {TEMPLATES.find((t) => t.id === entry.template)?.name || entry.template}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  entry.mode === GenerationMode.AUTOMATED ? "bg-blue-50" : "bg-green-50"
                                }`}
                              >
                                {entry.mode === GenerationMode.AUTOMATED ? "Automático" : "Manual"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
