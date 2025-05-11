"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  ImageIcon,
  ExternalLink,
  Copy,
  Info,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DownloadManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)
  const { toast } = useToast()

  // Resetar estados
  const resetState = () => {
    setIsLoading(false)
    setProgress(0)
    setError(null)
    setSuccess(null)
    setDownloadUrl(null)
  }

  // Função para download simples (arquivo de texto)
  const handleSimpleDownload = () => {
    resetState()
    setIsLoading(true)

    // Simular progresso
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 300)

    // Criar link de download e clicar nele
    const downloadUrl = "/api/download-simples"
    setDownloadUrl(downloadUrl)

    // Tentar download automático
    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = downloadUrl
      downloadLinkRef.current.click()
    }

    // Limpar após alguns segundos
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setIsLoading(false)
      setSuccess("Download preparado! Se o download não iniciar automaticamente, clique no botão 'Baixar Agora'.")

      toast({
        title: "Download preparado",
        description: "Se o download não iniciar automaticamente, clique no link de download.",
      })
    }, 2000)
  }

  // Função para download de card
  const handleCardDownload = (cardId: string) => {
    resetState()
    setIsLoading(true)

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

    // Criar link de download
    const downloadUrl = `/api/download-card-simples?id=${cardId}`
    setDownloadUrl(downloadUrl)

    // Tentar download automático
    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = downloadUrl
      downloadLinkRef.current.click()
    }

    // Limpar após alguns segundos
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setIsLoading(false)
      setSuccess(
        `Download do card ${cardId} preparado! Se o download não iniciar automaticamente, clique no botão 'Baixar Agora'.`,
      )

      toast({
        title: "Download preparado",
        description: "Se o download não iniciar automaticamente, clique no link de download.",
      })
    }, 2000)
  }

  // Função para download de todos os cards
  const handleAllCardsDownload = () => {
    resetState()
    setIsLoading(true)
    setProgress(10)

    // Verificar se o endpoint está funcionando
    fetch("/api/download-simples")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`)
        }

        setProgress(30)

        // Se o teste básico funcionar, preparar o download de todos os cards
        const downloadUrl = "/api/auto-download"
        setDownloadUrl(downloadUrl)

        // Tentar download automático
        if (downloadLinkRef.current) {
          downloadLinkRef.current.href = downloadUrl
          downloadLinkRef.current.click()
        }

        // Simular progresso
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval)
              return 90
            }
            return prev + 10
          })
        }, 500)

        // Limpar após alguns segundos
        setTimeout(() => {
          clearInterval(interval)
          setProgress(100)
          setIsLoading(false)
          setSuccess(
            "Download de todos os cards preparado! Se o download não iniciar automaticamente, clique no botão 'Baixar Agora'.",
          )

          toast({
            title: "Download preparado",
            description: "Se o download não iniciar automaticamente, clique no link de download.",
          })
        }, 3000)
      })
      .catch((err) => {
        setIsLoading(false)
        setError(`Falha no download: ${err.message}`)

        toast({
          variant: "destructive",
          title: "Erro no download",
          description: err.message,
        })
      })
  }

  // Função para copiar URL para a área de transferência
  const copyDownloadUrl = () => {
    if (downloadUrl) {
      navigator.clipboard
        .writeText(window.location.origin + downloadUrl)
        .then(() => {
          toast({
            title: "URL copiada",
            description: "URL de download copiada para a área de transferência",
          })
        })
        .catch((err) => {
          toast({
            variant: "destructive",
            title: "Erro ao copiar URL",
            description: "Não foi possível copiar a URL para a área de transferência",
          })
        })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciador de Downloads</CardTitle>
        <CardDescription>Baixe cards e arquivos gerados pelo sistema</CardDescription>
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

        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do download</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {downloadUrl && !isLoading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-grow">
                <h4 className="font-medium text-blue-700">Download disponível</h4>
                <p className="text-sm text-blue-600">
                  Se o download não iniciar automaticamente, use uma das opções abaixo:
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (downloadLinkRef.current) {
                        downloadLinkRef.current.click()
                      }
                    }}
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Baixar Agora
                  </Button>

                  <Button size="sm" variant="outline" onClick={copyDownloadUrl}>
                    <Copy className="mr-1 h-4 w-4" />
                    Copiar URL
                  </Button>

                  <Button size="sm" variant="outline" asChild>
                    <Link href={downloadUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Abrir em Nova Aba
                    </Link>
                  </Button>
                </div>

                <div className="text-xs text-blue-600 mt-2">
                  <p>Se estiver tendo problemas:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Verifique se o bloqueador de pop-ups está desativado</li>
                    <li>Tente usar o botão "Abrir em Nova Aba"</li>
                    <li>Copie a URL e cole diretamente na barra de endereços</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="downloads" className="mt-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="downloads">Downloads Rápidos</TabsTrigger>
            <TabsTrigger value="troubleshoot">Solução de Problemas</TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={handleSimpleDownload} disabled={isLoading} className="flex items-center">
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Testar Download Básico
              </Button>

              <Button
                onClick={() => handleCardDownload("exemplo123")}
                disabled={isLoading}
                variant="outline"
                className="flex items-center"
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="mr-2 h-4 w-4" />
                )}
                Baixar Card de Exemplo
              </Button>

              <Button
                onClick={handleAllCardsDownload}
                disabled={isLoading}
                variant="default"
                className="flex items-center"
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Baixar Todos os Cards
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="troubleshoot" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Problemas comuns de download</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong>Bloqueio de pop-ups:</strong> Seu navegador pode estar bloqueando os downloads automáticos.
                    Verifique a barra de endereços para notificações de bloqueio.
                  </li>
                  <li>
                    <strong>Permissões:</strong> O site pode precisar de permissão para iniciar downloads automáticos.
                    Verifique as configurações do seu navegador.
                  </li>
                  <li>
                    <strong>Extensões de segurança:</strong> Desative temporariamente extensões de segurança ou
                    bloqueadores de anúncios que possam estar interferindo.
                  </li>
                  <li>
                    <strong>Cache do navegador:</strong> Tente limpar o cache do navegador ou usar uma janela anônima.
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild>
                  <Link href="/api/download-simples" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Download Direto
                  </Link>
                </Button>

                <Button variant="outline" onClick={() => (window.location.href = "/api/download-simples")}>
                  <Download className="mr-2 h-4 w-4" />
                  Navegar para Download
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col items-start">
        <p className="text-sm text-muted-foreground">
          Se estiver enfrentando problemas com o download automático, tente os botões de teste acima para diagnosticar o
          problema.
        </p>
      </CardFooter>

      {/* Link de download oculto para uso programático */}
      <a ref={downloadLinkRef} href="#" download style={{ display: "none" }} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    </Card>
  )
}
