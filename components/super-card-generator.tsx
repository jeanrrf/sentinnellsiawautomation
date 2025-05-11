"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import {
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  CalendarIcon,
  Clock,
  Plus,
  Sparkles,
  Settings,
  Palette,
  Loader2,
} from "lucide-react"

export function SuperCardGenerator() {
  const [activeTab, setActiveTab] = useState("instant")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [lastGeneratedProduct, setLastGeneratedProduct] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [includeAllStyles, setIncludeAllStyles] = useState(true)
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("12:00")
  const [frequency, setFrequency] = useState("once")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Verificar se já geramos recentemente
  useEffect(() => {
    const lastGenerated = localStorage.getItem("lastGeneratedProductId")
    if (lastGenerated) {
      setLastGeneratedProduct(lastGenerated)
    }
  }, [])

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 5
      })
    }, 200)

    return () => clearInterval(interval)
  }

  const handleInstantGenerate = async () => {
    setIsLoading(true)
    setProgress(0)
    setError(null)
    setSuccess(null)
    setInfo("Iniciando geração de cards...")

    const stopProgress = simulateProgress()

    try {
      // Verificar status do sistema
      const systemCheck = await fetch("/api/system-check")
      const systemStatus = await systemCheck.json()

      if (!systemStatus.redis) {
        setInfo("Redis não está disponível. Usando dados de exemplo...")
      }

      // Buscar um produto aleatório diferente do último gerado
      const productsResponse = await fetch("/api/products")
      const productsData = await productsResponse.json()

      if (!productsData.success || !productsData.products || productsData.products.length === 0) {
        throw new Error("Não foi possível obter produtos da API")
      }

      // Filtrar para excluir o último produto gerado
      let availableProducts = productsData.products
      if (lastGeneratedProduct) {
        availableProducts = availableProducts.filter((p) => p.itemId !== lastGeneratedProduct)
      }

      // Se não houver produtos disponíveis após o filtro, use todos
      if (availableProducts.length === 0) {
        availableProducts = productsData.products
      }

      // Selecionar um produto aleatório
      const randomIndex = Math.floor(Math.random() * availableProducts.length)
      const selectedProduct = availableProducts[randomIndex]

      // Salvar o ID do produto gerado
      localStorage.setItem("lastGeneratedProductId", selectedProduct.itemId)
      setLastGeneratedProduct(selectedProduct.itemId)

      setInfo(`Gerando cards para: ${selectedProduct.productName}`)

      // Chamar a API aprimorada com os novos parâmetros
      const downloadUrl = `/api/super-card-download?productId=${selectedProduct.itemId}&darkMode=${darkMode}&allStyles=${includeAllStyles}`

      // Abrir em nova aba
      window.open(downloadUrl, "_blank")

      // Completar o progresso
      clearInterval(stopProgress())
      setProgress(100)
      setIsLoading(false)
      setSuccess(`Cards gerados com sucesso para o produto: ${selectedProduct.productName}!`)

      toast({
        title: "Geração concluída",
        description: `Cards gerados para: ${selectedProduct.productName}`,
      })
    } catch (err: any) {
      clearInterval(stopProgress())
      setIsLoading(false)
      setError(`Erro: ${err.message}`)

      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: err.message,
      })
    }
  }

  const handleScheduleCreate = async () => {
    if (!date) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma data para o agendamento",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/super-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: format(date, "yyyy-MM-dd"),
          time,
          frequency,
          darkMode,
          includeAllStyles,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao criar agendamento: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso",
        })

        // Reset form
        setDate(undefined)
        setTime("12:00")
        setFrequency("once")

        // Redirecionar para a página de agendamentos
        router.push("/dashboard/automacao")
      } else {
        throw new Error(data.message || "Falha ao criar agendamento")
      }
    } catch (err: any) {
      setError(err.message || "Falha ao criar agendamento")
      console.error("Erro ao criar agendamento:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar agendamento",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Super Gerador de Cards</CardTitle>
          </div>
          {lastGeneratedProduct && (
            <Badge variant="outline" className="text-xs">
              Último produto: {lastGeneratedProduct}
            </Badge>
          )}
        </div>
        <CardDescription>Gere e baixe cards de produtos automaticamente com estilo da aba Busca</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Sucesso</AlertTitle>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {info && (
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-700">Informação</AlertTitle>
            <AlertDescription className="text-blue-600">{info}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Nova Superferramenta:</h3>
          <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
            <li>
              Gera cards com o design elegante da aba <strong>Busca</strong>
            </li>
            <li>
              Seleciona automaticamente um produto <strong>diferente</strong> a cada execução
            </li>
            <li>Cria uma descrição otimizada para SEO e conversão</li>
            <li>Opção para gerar em modo escuro ou claro</li>
            <li>Inclui todos os estilos em um único pacote</li>
            <li>Agendamento automático integrado</li>
          </ul>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instant">Geração Instantânea</TabsTrigger>
            <TabsTrigger value="schedule">Agendamento</TabsTrigger>
          </TabsList>

          <TabsContent value="instant" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Opções de Estilo</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  <span className="text-xs">Avançado</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                    <span>Modo Escuro</span>
                    <span className="font-normal text-xs text-muted-foreground">Gerar cards com fundo escuro</span>
                  </Label>
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="all-styles" className="flex flex-col space-y-1">
                    <span>Todos os Estilos</span>
                    <span className="font-normal text-xs text-muted-foreground">Incluir todos os templates</span>
                  </Label>
                  <Switch id="all-styles" checked={includeAllStyles} onCheckedChange={setIncludeAllStyles} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="schedule-date"
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-time">Horário</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input id="schedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-frequency">Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="schedule-dark-mode">Modo Escuro</Label>
                  <Switch id="schedule-dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="schedule-all-styles">Todos os Estilos</Label>
                  <Switch id="schedule-all-styles" checked={includeAllStyles} onCheckedChange={setIncludeAllStyles} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter>
        {activeTab === "instant" ? (
          <Button onClick={handleInstantGenerate} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Gerar Cards Agora
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleScheduleCreate} disabled={isSubmitting || !date} className="w-full" size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Criar Agendamento
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
