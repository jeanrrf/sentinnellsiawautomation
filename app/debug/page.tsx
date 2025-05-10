"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VideoConversionHelp } from "@/components/video-conversion-help"

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchApiDebug = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/debug-shopee")
      const data = await response.json()

      setApiResponse(data)
    } catch (err: any) {
      setError(err.message || "Erro ao analisar a API da Shopee")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Debug</h1>
      <p className="text-muted-foreground mb-6">Ferramentas de debug para desenvolvedores.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Testar API da Shopee</CardTitle>
            <CardDescription>Teste a conexão com a API da Shopee</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/debug-shopee" method="GET">
              <Button type="submit" className="w-full">
                Testar API
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testar Geração de Vídeo</CardTitle>
            <CardDescription>Teste o processo de geração de vídeo</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/video-system-check" method="GET">
              <Button type="submit" className="w-full">
                Testar Geração
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <VideoConversionHelp />
    </div>
  )
}
