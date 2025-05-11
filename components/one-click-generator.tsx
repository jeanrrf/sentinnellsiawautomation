"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Download, RefreshCw, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function OneClickGenerator() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const { toast } = useToast()

  const handleOneClickGenerate = () => {
    setIsLoading(true)
    setProgress(0)
    setError(null)
    setSuccess(null)
    setInfo("Iniciando geração de cards...")

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 5
      })
    }, 200)

    // Check if Redis is available first
    fetch("/api/system-check")
      .then((res) => res.json())
      .then((data) => {
        if (!data.redis) {
          setInfo("Redis não está disponível. Usando dados de exemplo...")
        }

        // Open the auto-download endpoint in a new tab
        const newTab = window.open("/api/auto-download", "_blank")

        // Check if the tab was opened successfully
        if (!newTab) {
          clearInterval(interval)
          setIsLoading(false)
          setError("O navegador bloqueou a abertura da nova aba. Por favor, permita pop-ups para este site.")

          toast({
            variant: "destructive",
            title: "Erro ao abrir nova aba",
            description: "O navegador bloqueou a abertura da nova aba. Por favor, permita pop-ups para este site.",
          })
          return
        }

        // Complete the progress after a delay
        setTimeout(() => {
          clearInterval(interval)
          setProgress(100)
          setIsLoading(false)
          setSuccess("Geração iniciada em uma nova aba!")
          setInfo(null)

          toast({
            title: "Geração iniciada",
            description: "A geração e download dos cards foi iniciada em uma nova aba.",
          })
        }, 2000)
      })
      .catch((err) => {
        clearInterval(interval)
        setIsLoading(false)
        setError(`Erro ao verificar o sistema: ${err.message}`)
        setInfo(null)

        toast({
          variant: "destructive",
          title: "Erro ao verificar o sistema",
          description: `Não foi possível verificar o status do sistema: ${err.message}`,
        })
      })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Geração com Um Clique</CardTitle>
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
          <h3 className="font-medium text-blue-800 mb-2">O que isso faz?</h3>
          <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
            <li>Seleciona automaticamente um produto do cache (ou usa um exemplo se não houver produtos)</li>
            <li>Gera cards usando o template moderno e o template Agemini</li>
            <li>Cria um arquivo de texto com informações do produto</li>
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
              <Download className="mr-2 h-5 w-5" />
              Gerar e Baixar Cards
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
