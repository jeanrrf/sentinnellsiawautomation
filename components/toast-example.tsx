"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast, useToast, ToastAction } from "@/components/ui/use-toast"
import { useState } from "react"

export function ToastExample() {
  const { toast: hookToast } = useToast()
  const [position, setPosition] = useState<
    "top-right" | "bottom-right" | "top-left" | "bottom-left" | "top-center" | "bottom-center"
  >("bottom-right")

  const showDefaultToast = () => {
    toast({
      title: "Notificação padrão",
      description: "Esta é uma notificação padrão do sistema.",
    })
  }

  const showSuccessToast = () => {
    toast.success({
      title: "Operação concluída",
      description: "A operação foi concluída com sucesso!",
    })
  }

  const showErrorToast = () => {
    toast.error({
      title: "Erro",
      description: "Ocorreu um erro ao processar sua solicitação.",
    })
  }

  const showWarningToast = () => {
    toast.warning({
      title: "Atenção",
      description: "Esta ação pode ter consequências inesperadas.",
    })
  }

  const showInfoToast = () => {
    toast.info({
      title: "Informação",
      description: "Aqui está uma informação importante para você.",
    })
  }

  const showActionToast = () => {
    toast({
      title: "Ação necessária",
      description: "Você precisa tomar uma ação.",
      action: (
        <ToastAction altText="Tentar novamente" onClick={() => alert("Ação executada!")}>
          Tentar novamente
        </ToastAction>
      ),
    })
  }

  const showPersistentToast = () => {
    toast({
      title: "Notificação persistente",
      description: "Esta notificação não desaparecerá automaticamente.",
      duration: 0, // 0 significa que não desaparecerá automaticamente
      important: true,
    })
  }

  const showPositionedToast = () => {
    hookToast({
      title: `Notificação (${position})`,
      description: `Esta notificação aparecerá na posição ${position}.`,
      position,
    })
  }

  const changePosition = (newPosition: typeof position) => {
    setPosition(newPosition)
    toast.setOptions({ position: newPosition })
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Sistema de Toast</CardTitle>
        <CardDescription>Demonstração do sistema de toast com várias opções e variantes.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button onClick={showDefaultToast} variant="outline">
            Toast Padrão
          </Button>
          <Button onClick={showSuccessToast} variant="outline" className="text-green-500">
            Toast Sucesso
          </Button>
          <Button onClick={showErrorToast} variant="outline" className="text-red-500">
            Toast Erro
          </Button>
          <Button onClick={showWarningToast} variant="outline" className="text-yellow-500">
            Toast Aviso
          </Button>
          <Button onClick={showInfoToast} variant="outline" className="text-blue-500">
            Toast Info
          </Button>
          <Button onClick={showActionToast} variant="outline">
            Toast com Ação
          </Button>
          <Button onClick={showPersistentToast} variant="outline">
            Toast Persistente
          </Button>
          <Button onClick={showPositionedToast} variant="outline">
            Toast Posicionado
          </Button>
          <Button onClick={() => toast.dismiss()} variant="outline">
            Fechar Todos
          </Button>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Posição do Toast:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button
              onClick={() => changePosition("top-left")}
              variant={position === "top-left" ? "default" : "outline"}
              size="sm"
            >
              Superior Esquerdo
            </Button>
            <Button
              onClick={() => changePosition("top-center")}
              variant={position === "top-center" ? "default" : "outline"}
              size="sm"
            >
              Superior Centro
            </Button>
            <Button
              onClick={() => changePosition("top-right")}
              variant={position === "top-right" ? "default" : "outline"}
              size="sm"
            >
              Superior Direito
            </Button>
            <Button
              onClick={() => changePosition("bottom-left")}
              variant={position === "bottom-left" ? "default" : "outline"}
              size="sm"
            >
              Inferior Esquerdo
            </Button>
            <Button
              onClick={() => changePosition("bottom-center")}
              variant={position === "bottom-center" ? "default" : "outline"}
              size="sm"
            >
              Inferior Centro
            </Button>
            <Button
              onClick={() => changePosition("bottom-right")}
              variant={position === "bottom-right" ? "default" : "outline"}
              size="sm"
            >
              Inferior Direito
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          O sistema de toast pode ser usado tanto dentro quanto fora de componentes React.
        </p>
      </CardFooter>
    </Card>
  )
}
