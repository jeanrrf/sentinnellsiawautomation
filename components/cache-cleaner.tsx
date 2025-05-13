"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, RefreshCw, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function CacheCleaner() {
  const [isClearing, setIsClearing] = useState(false)
  const [lastCleared, setLastCleared] = useState<string | null>(null)
  const { toast } = useToast()

  const handleClearCache = async () => {
    if (isClearing) return

    setIsClearing(true)

    try {
      const response = await fetch("/api/cache/clear-all", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao limpar cache")
      }

      const now = new Date().toLocaleString()
      setLastCleared(now)

      toast({
        title: "Cache limpo com sucesso",
        description: `Todo o cache foi limpo em ${now}`,
        variant: "success",
      })
    } catch (error: any) {
      console.error("Erro ao limpar cache:", error)
      toast({
        variant: "destructive",
        title: "Erro ao limpar cache",
        description: error.message || "Ocorreu um erro ao limpar o cache",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limpeza de Cache</CardTitle>
        <CardDescription>Limpe o cache do sistema para liberar espaço e remover dados antigos</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Esta operação irá limpar todos os produtos em cache, manter apenas o vídeo mais recente e remover arquivos
          temporários.
        </p>

        {lastCleared && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Última limpeza: {lastCleared}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="destructive" className="w-full" onClick={handleClearCache} disabled={isClearing}>
          {isClearing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Limpando Cache...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Todo o Cache
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
