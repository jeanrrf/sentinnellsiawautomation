"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Step {
  title: string
  content: string
  position: "top" | "right" | "bottom" | "left" | "center"
  element?: string
}

export function FeatureTour() {
  const [showTour, setShowTour] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const steps: Step[] = [
    {
      title: "Nova funcionalidade: Mídia do Produto",
      content: "Agora você pode acessar todas as imagens e vídeos dos seus produtos em um só lugar!",
      position: "center",
    },
    {
      title: "Acesse pelo menu",
      content: "Clique em 'Mídia do Produto' no menu principal para acessar a nova funcionalidade.",
      position: "bottom",
      element: '[data-tour="media-tab"]',
    },
    {
      title: "Busque produtos facilmente",
      content: "Digite o nome do produto para encontrá-lo rapidamente e visualizar suas mídias.",
      position: "top",
      element: '[data-tour="search-product"]',
    },
    {
      title: "Visualize e baixe",
      content: "Veja todas as imagens e vídeos do produto, copie URLs ou faça download dos arquivos.",
      position: "right",
      element: '[data-tour="media-gallery"]',
    },
  ]

  useEffect(() => {
    // Verificar se o tour já foi mostrado
    const tourShown = localStorage.getItem("mediaTourShown")
    if (!tourShown) {
      setShowTour(true)
    }
  }, [])

  useEffect(() => {
    if (showTour && steps[currentStep].element) {
      const element = document.querySelector(steps[currentStep].element!)
      if (element) {
        const rect = element.getBoundingClientRect()
        const step = steps[currentStep]

        let top = 0
        let left = 0

        switch (step.position) {
          case "top":
            top = rect.top - 150
            left = rect.left + rect.width / 2 - 150
            break
          case "right":
            top = rect.top + rect.height / 2 - 100
            left = rect.right + 20
            break
          case "bottom":
            top = rect.bottom + 20
            left = rect.left + rect.width / 2 - 150
            break
          case "left":
            top = rect.top + rect.height / 2 - 100
            left = rect.left - 320
            break
        }

        setPosition({ top, left })
      }
    } else if (showTour) {
      // Centralizar para o primeiro passo
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 150,
      })
    }
  }, [currentStep, showTour, steps])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    setShowTour(false)
    localStorage.setItem("mediaTourShown", "true")
  }

  if (!showTour) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card
        className="w-[300px] shadow-lg absolute transition-all duration-300"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{steps[currentStep].title}</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={completeTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm">{steps[currentStep].content}</CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-primary" : "bg-gray-300"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {currentStep < steps.length - 1 ? "Próximo" : "Concluir"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
