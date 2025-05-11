"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, AlertTriangle, CheckCircle, Info, Sparkles, Zap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export function OneClickGenerator() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [lastGeneratedProduct, setLastGeneratedProduct] = useState<string | null>(null)
  const { toast } = useToast()

  // Verificar se já geramos recentemente
  useEffect(() => {
    const lastGenerated = localStorage.getItem("lastGeneratedProductId")
    if (lastGenerated) {
      setLastGeneratedProduct(lastGenerated)
    }
  }, [])

  const handleOneClickGenerate = async () => {
    setIsLoading(true)
    setProgress(0)
    setError(null)
    setSuccess(null)
    setInfo("Iniciando geração de cards...")

    // Simular progresso
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 5
      })
    }, 200)

    try {
      // Verificar status do sistema primeiro
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

      // Chamar a API aprimorada que gera todos os modelos de cards
      const downloadUrl = `/api/enhanced-auto-download?productId=${selectedProduct.itemId}`

      // Abrir em nova aba
      window.open(downloadUrl, "_blank")

      // Completar o progresso
      clearInterval(interval)
      setProgress(100)
      setIsLoading(false)
      setSuccess(`Cards gerados com sucesso para o produto: ${selectedProduct.productName}!`)

      toast({
        title: "Geração concluída",
        description: `Cards gerados para: ${selectedProduct.productName}`,
      })
    } catch (err: any) {
      clearInterval(interval)
      setIsLoading(false)
      setError(`Erro: ${err.message}`)

      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: err.message,
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Geração com Um Clique</CardTitle>
          </div>
          {lastGeneratedProduct && (
            <Badge variant="outline" className="text-xs">
              Último produto: {lastGeneratedProduct}
            </Badge>
          )}
        </div>
        <CardDescription>Gere e baixe cards de produtos automaticamente com apenas um clique</CardDescription>
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
          <h3 className="font-medium text-blue-800 mb-2">Funcionalidades Aprimoradas:</h3>
          <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
            <li>
              Seleciona automaticamente um produto <strong>diferente</strong> a cada execução
            </li>
            <li>
              Gera cards em <strong>todos os modelos disponíveis</strong> (Modern, Elegant, Bold, etc.)
            </li>
            <li>Cria uma descrição otimizada para SEO e conversão</li>
            <li>Empacota tudo em um arquivo ZIP para download</li>
            <li>Executa todo o processo com apenas um clique</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleOneClickGenerate} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              Gerar Todos os Modelos
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
