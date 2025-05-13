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
import { useToast } from "@/components/ui/use-toast"
import {
  Download,
  RefreshCw,
  Sparkles,
  Wand2,
  Clock,
  Palette,
  Copy,
  Plus,
  Loader2,
  History,
  Save,
  Trash,
  Play,
  Settings,
  ImageIcon,
  FileText,
  Package,
  LayoutGrid,
  Undo,
  Pause,
} from "lucide-react"
import { GenerationMode } from "@/lib/unified-card-service"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Modos de interface
enum StudioMode {
  DESIGNER = "designer", // Interface completa de design
  QUICK = "quick", // Interface simplificada para geração rápida
  SCHEDULER = "scheduler", // Interface para agendamento
  HISTORY = "history", // Histórico de geração
}

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

export function UnifiedCardStudio() {
  const { toast } = useToast()

  // Estado da interface
  const [studioMode, setStudioMode] = useState<StudioMode>(StudioMode.DESIGNER)
  const [activeTab, setActiveTab] = useState("design")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [downloadingType, setDownloadingType] = useState<string | null>(null)

  // Estado do produto
  const [product, setProduct] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Estado do resultado
  const [cardGenerated, setCardGenerated] = useState(false)
  const [cardUrls, setCardUrls] = useState<{ [format: string]: string }>({})
  const [secondaryCardUrls, setSecondaryCardUrls] = useState<{ [format: string]: string }>({})
  const [description, setDescription] = useState("")
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

  // Configurações de agendamento
  const [schedules, setSchedules] = useState<any[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<any>({
    id: "",
    name: "",
    enabled: true,
    frequency: "daily",
    time: "09:00",
    weekdays: [1, 3, 5], // Segunda, Quarta, Sexta
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

  // Estado do histórico
  const [generationHistory, setGenerationHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    loadExampleProducts()
    loadSchedules()
    loadGenerationHistory()
  }, [])

  // Carregar produtos de exemplo
  const loadExampleProducts = async () => {
    setIsLoading(true)

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
      setIsLoading(false)
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
      setCurrentSchedule(exampleSchedules[0])
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
          mode: GenerationMode.QUICK,
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
    }
  }

  // Atualizar configuração de design
  const updateDesignConfig = (updates: Partial<typeof designConfig>) => {
    setDesignConfig((prev) => ({ ...prev, ...updates }))
  }

  // Atualizar agendamento atual
  const updateCurrentSchedule = (updates: Partial<typeof currentSchedule>) => {
    setCurrentSchedule((prev) => ({ ...prev, ...updates }))
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
        studioMode === StudioMode.DESIGNER
          ? GenerationMode.MANUAL
          : studioMode === StudioMode.QUICK
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

      // Adicionar ao histórico
      const newHistoryEntry = {
        id: `gen_${Date.now()}`,
        productId: product.itemId,
        productName: product.productName,
        timestamp: new Date().toISOString(),
        mode: generationMode,
        template: designConfig.template,
        cardUrls: mockResult.cardUrls,
      }

      setGenerationHistory((prev) => [newHistoryEntry, ...prev])

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

  // Criar ou atualizar agendamento
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

      // Se o agendamento atual foi excluído, selecionar outro
      if (currentSchedule.id === scheduleId) {
        if (updatedSchedules.length > 0) {
          setCurrentSchedule(updatedSchedules[0])
        } else {
          setCurrentSchedule({
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
        }
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
      template: "modern",
      darkMode: true,
      includeSecondVariation: true,
      lastRun: null,
      nextRun: null,
    })
  }

  // Selecionar agendamento
  const selectSchedule = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (schedule) {
      setCurrentSchedule({ ...schedule })
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

  // Renderizar interface de designer
  const renderDesignerInterface = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Painel de Visualização */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Visualização</CardTitle>
            <CardDescription>Visualize o card em tempo real com as configurações aplicadas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <Select value={selectedProductId || ""} onValueChange={selectProduct}>
                <SelectTrigger className="w-[300px]">
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

            <div className="relative">
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {generationProgress < 30
                        ? "Gerando descrição com IA..."
                        : generationProgress < 70
                          ? "Criando imagens..."
                          : "Finalizando..."}
                    </p>
                    <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-primary transition-all duration-300 ease-in-out"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {cardGenerated ? (
                <img
                  src={cardUrls.png || "/placeholder.svg"}
                  alt="Card Preview"
                  className="max-w-full h-auto border rounded-lg shadow-md"
                  style={{ maxHeight: "70vh" }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center bg-muted rounded-lg"
                  style={{ width: "400px", height: "600px" }}
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

            {cardGenerated && (
              <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
                <Button onClick={() => downloadCard("png")} variant="outline" disabled={isDownloading}>
                  {isDownloading && downloadingType === "png" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  PNG
                </Button>
                <Button onClick={() => downloadCard("jpeg")} variant="outline" disabled={isDownloading}>
                  {isDownloading && downloadingType === "jpeg" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  JPEG
                </Button>

                {designConfig.includeSecondVariation && (
                  <>
                    <Button onClick={() => downloadCard("png", true)} variant="outline" disabled={isDownloading}>
                      {isDownloading && downloadingType === "png" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      PNG (Alt)
                    </Button>
                    <Button onClick={() => downloadCard("jpeg", true)} variant="outline" disabled={isDownloading}>
                      {isDownloading && downloadingType === "jpeg" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      JPEG (Alt)
                    </Button>
                  </>
                )}

                <Button onClick={downloadAllFormats} className="col-span-2" disabled={isDownloading}>
                  {isDownloading && downloadingType === "all" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="mr-2 h-4 w-4" />
                  )}
                  Baixar Todos os Formatos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Painel de Controles */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Personalize o design e conteúdo do seu card</CardDescription>
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

            <div className="mt-6">
              <Button onClick={generateCard} className="w-full" disabled={isGenerating || !product}>
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
            </div>
          </CardContent>
        </Card>

        {cardGenerated && description && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Descrição Gerada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line mb-3">{description}</div>
              <Button onClick={copyDescription} variant="outline" className="w-full">
                {copySuccess === "description" ? (
                  <>
                    <Copy className="mr-2 h-4 w-4 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Descrição
                  </>
                )}
              </Button>
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
            <div className="mb-6">
              <Label htmlFor="quick-product" className="mb-2 block">
                Selecione um Produto
              </Label>
              <Select value={selectedProductId || ""} onValueChange={selectProduct}>
                <SelectTrigger id="quick-product">
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

            {product && (
              <div className="mb-4 p-4 bg-muted rounded-md">
                <p className="mb-1 font-medium">{product.productName}</p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Preço: R$ {product.price}</span>
                  <span>Vendas: {product.sales}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Estilo</Label>
                <Select
                  value={designConfig.template}
                  onValueChange={(value) => updateDesignConfig({ template: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um estilo" />
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
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="quick-dark-mode"
                    checked={designConfig.darkMode}
                    onCheckedChange={(checked) => updateDesignConfig({ darkMode: checked })}
                  />
                  <Label htmlFor="quick-dark-mode">Modo Escuro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="quick-second-variation"
                    checked={designConfig.includeSecondVariation}
                    onCheckedChange={(checked) => updateDesignConfig({ includeSecondVariation: checked })}
                  />
                  <Label htmlFor="quick-second-variation">Duas Variações</Label>
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-2 mt-4 mb-6">
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
              <div className="mt-4 space-y-6">
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
                      {isDownloading && downloadingType === "jpeg" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      JPEG
                    </Button>
                  </div>
                </div>

                {designConfig.includeSecondVariation && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-2 flex flex-col items-center">
                      <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                        <img
                          src={secondaryCardUrls.png || "/placeholder.svg"}
                          alt="PNG Card (Alt)"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => downloadCard("png", true)}
                        disabled={isDownloading}
                      >
                        {isDownloading && downloadingType === "png" ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        PNG (Alt)
                      </Button>
                    </div>

                    <div className="border rounded-md p-2 flex flex-col items-center">
                      <div className="relative w-full aspect-[9/16] bg-black rounded-md overflow-hidden">
                        <img
                          src={secondaryCardUrls.jpeg || "/placeholder.svg"}
                          alt="JPEG Card (Alt)"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => downloadCard("jpeg", true)}
                        disabled={isDownloading}
                      >
                        {isDownloading && downloadingType === "jpeg" ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        JPEG (Alt)
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-md p-3">
                  <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line mb-2">{description}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={copyDescription}>
                      {copySuccess === "description" ? (
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={downloadAllFormats}
                      disabled={isDownloading}
                    >
                      {isDownloading && downloadingType === "all" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Package className="h-4 w-4 mr-1" />
                      )}
                      Baixar Tudo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={loadExampleProducts} disabled={isLoading || isGenerating}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Produtos
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
            <CardDescription>Gerencie seus agendamentos de geração automática</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" size="sm" className="w-full" onClick={createNewSchedule}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Agendamento
            </Button>

            {schedules.length === 0 ? (
              <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                Nenhum agendamento encontrado
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors ${
                      currentSchedule.id === schedule.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => selectSchedule(schedule.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{schedule.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {FREQUENCY_TYPES.find((f) => f.id === schedule.frequency)?.name || schedule.frequency} às{" "}
                          {schedule.time}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${schedule.enabled ? "text-green-500" : "text-gray-400"}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleScheduleStatus(schedule.id)
                          }}
                        >
                          {schedule.enabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          <span className="sr-only">{schedule.enabled ? "Desativar" : "Ativar"}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSchedule(schedule.id)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex justify-between items-center">
                      <Badge variant={schedule.enabled ? "default" : "outline"}>
                        {schedule.enabled ? "Ativo" : "Inativo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Próxima execução: {formatDate(schedule.nextRun)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentSchedule.id && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => runScheduleNow(currentSchedule.id)}
                  disabled={!currentSchedule.id}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Executar Agora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{currentSchedule.id ? `Editar: ${currentSchedule.name}` : "Novo Agendamento"}</CardTitle>
            <CardDescription>Configure quando e como os cards serão gerados automaticamente</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!currentSchedule.id ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <p className="text-muted-foreground mb-4">
                  Selecione um agendamento existente ou crie um novo para começar.
                </p>
                <Button variant="outline" onClick={createNewSchedule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Agendamento
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="schedule">Agendamento</TabsTrigger>
                  <TabsTrigger value="options">Opções</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-name">Nome do Agendamento</Label>
                    <Input
                      id="schedule-name"
                      value={currentSchedule.name}
                      onChange={(e) => updateCurrentSchedule({ name: e.target.value })}
                      placeholder="Nome do agendamento"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="schedule-enabled"
                      checked={currentSchedule.enabled}
                      onCheckedChange={(checked) => updateCurrentSchedule({ enabled: checked })}
                    />
                    <Label htmlFor="schedule-enabled">Ativar Agendamento</Label>
                  </div>

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
                    <Label htmlFor="limit">Limite de Produtos</Label>
                    <Select
                      value={currentSchedule.limit.toString()}
                      onValueChange={(value) => updateCurrentSchedule({ limit: Number(value) })}
                    >
                      <SelectTrigger id="limit">
                        <SelectValue placeholder="Selecione um limite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 produto</SelectItem>
                        <SelectItem value="3">3 produtos</SelectItem>
                        <SelectItem value="5">5 produtos</SelectItem>
                        <SelectItem value="10">10 produtos</SelectItem>
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
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
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
                      <div className="grid grid-cols-7 gap-2">
                        {WEEKDAYS.map((day) => (
                          <Button
                            key={day.id}
                            type="button"
                            variant={currentSchedule.weekdays?.includes(day.id) ? "default" : "outline"}
                            className="h-10"
                            onClick={() => toggleWeekday(day.id)}
                          >
                            {day.name.substring(0, 3)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentSchedule.frequency === "monthly" && (
                    <div className="space-y-2">
                      <Label htmlFor="day-of-month">Dia do Mês</Label>
                      <Select
                        value={currentSchedule.dayOfMonth.toString()}
                        onValueChange={(value) => updateCurrentSchedule({ dayOfMonth: Number(value) })}
                      >
                        <SelectTrigger id="day-of-month">
                          <SelectValue placeholder="Selecione o dia do mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              Dia {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Última execução:</span>
                      <span>{formatDate(currentSchedule.lastRun)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Próxima execução:</span>
                      <span>{formatDate(currentSchedule.nextRun)}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="options" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dark-mode"
                      checked={currentSchedule.darkMode}
                      onCheckedChange={(checked) => updateCurrentSchedule({ darkMode: checked })}
                    />
                    <Label htmlFor="dark-mode">Modo Escuro</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-second-variation"
                      checked={currentSchedule.includeSecondVariation}
                      onCheckedChange={(checked) => updateCurrentSchedule({ includeSecondVariation: checked })}
                    />
                    <Label htmlFor="include-second-variation">Incluir Segunda Variação</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="save-to-gallery"
                      checked={currentSchedule.saveToGallery}
                      onCheckedChange={(checked) => updateCurrentSchedule({ saveToGallery: checked })}
                    />
                    <Label htmlFor="save-to-gallery">Salvar na Galeria</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify-by-email"
                      checked={currentSchedule.notifyByEmail}
                      onCheckedChange={(checked) => updateCurrentSchedule({ notifyByEmail: checked })}
                    />
                    <Label htmlFor="notify-by-email">Notificar por E-mail</Label>
                  </div>

                  {currentSchedule.notifyByEmail && (
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail para Notificação</Label>
                      <Input
                        id="email"
                        type="email"
                        value={currentSchedule.email || ""}
                        onChange={(e) => updateCurrentSchedule({ email: e.target.value })}
                        placeholder="seu@email.com"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>

          <CardFooter className="flex justify-end">
            {currentSchedule.id && (
              <Button onClick={saveSchedule} disabled={isSavingSchedule || !currentSchedule.name}>
                {isSavingSchedule ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Agendamento
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )

  // Renderizar interface de histórico
  const renderHistoryInterface = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Geração
        </CardTitle>
        <CardDescription>Visualize e reutilize cards gerados anteriormente</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : generationHistory.length === 0 ? (
          <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
            Nenhum histórico de geração encontrado
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={loadGenerationHistory}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Opções
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Opções de Histórico</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar Histórico
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Trash className="h-4 w-4 mr-2" />
                    Limpar Histórico
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              {generationHistory.map((entry) => (
                <Accordion key={entry.id} type="single" collapsible className="border rounded-md">
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <div className="font-medium">{entry.productName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{formatDate(entry.timestamp)}</span>
                          <Badge variant="outline" className="ml-2">
                            {entry.mode === GenerationMode.MANUAL
                              ? "Designer"
                              : entry.mode === GenerationMode.QUICK
                                ? "Geração Rápida"
                                : "Automação"}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="aspect-[9/16] bg-black rounded-md overflow-hidden">
                            <img
                              src={entry.cardUrls.png || "/placeholder.svg"}
                              alt="Card Preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Download className="h-4 w-4 mr-1" />
                              PNG
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Download className="h-4 w-4 mr-1" />
                              JPEG
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Detalhes</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Template:</span>
                                <span>{TEMPLATES.find((t) => t.id === entry.template)?.name || entry.template}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Modo:</span>
                                <span>
                                  {entry.mode === GenerationMode.MANUAL
                                    ? "Designer"
                                    : entry.mode === GenerationMode.QUICK
                                      ? "Geração Rápida"
                                      : "Automação"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Data:</span>
                                <span>{formatDate(entry.timestamp)}</span>
                              </div>
                              {entry.scheduleId && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Agendamento:</span>
                                  <span>
                                    {schedules.find((s) => s.id === entry.scheduleId)?.name || entry.scheduleId}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                // Configurar o designer com as mesmas configurações
                                updateDesignConfig({
                                  template: entry.template,
                                  darkMode: true,
                                })
                                // Selecionar o produto
                                selectProduct(entry.productId)
                                // Mudar para o modo designer
                                setStudioMode(StudioMode.DESIGNER)
                                // Gerar o card
                                setTimeout(() => {
                                  generateCard()
                                }, 100)
                              }}
                            >
                              <Undo className="h-4 w-4 mr-1" />
                              Recriar
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="flex-1">
                                  <LayoutGrid className="h-4 w-4 mr-1" />
                                  Visualizar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Visualização do Card</DialogTitle>
                                  <DialogDescription>Card gerado em {formatDate(entry.timestamp)}</DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-center py-4">
                                  <img
                                    src={entry.cardUrls.png || "/placeholder.svg"}
                                    alt="Card Preview"
                                    className="max-h-[70vh] border rounded-lg shadow-md"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" className="w-full">
                                    <Download className="h-4 w-4 mr-1" />
                                    Baixar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Studio de Cards</h1>
        <p className="text-muted-foreground mb-6">
          Plataforma unificada para design, geração e automação de cards para produtos
        </p>

        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant={studioMode === StudioMode.DESIGNER ? "default" : "outline"}
            onClick={() => setStudioMode(StudioMode.DESIGNER)}
            className="flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            Designer
          </Button>

          <Button
            variant={studioMode === StudioMode.QUICK ? "default" : "outline"}
            onClick={() => setStudioMode(StudioMode.QUICK)}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Geração Rápida
          </Button>

          <Button
            variant={studioMode === StudioMode.SCHEDULER ? "default" : "outline"}
            onClick={() => setStudioMode(StudioMode.SCHEDULER)}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Automação
          </Button>

          <Button
            variant={studioMode === StudioMode.HISTORY ? "default" : "outline"}
            onClick={() => setStudioMode(StudioMode.HISTORY)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Histórico
          </Button>
        </div>
      </div>

      {studioMode === StudioMode.DESIGNER && renderDesignerInterface()}
      {studioMode === StudioMode.QUICK && renderQuickInterface()}
      {studioMode === StudioMode.SCHEDULER && renderSchedulerInterface()}
      {studioMode === StudioMode.HISTORY && renderHistoryInterface()}
    </div>
  )
}
