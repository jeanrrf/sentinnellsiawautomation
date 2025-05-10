"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Download, Loader2 } from "lucide-react"

export function WebmToMp4Converter() {
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    if (!file.type.includes("webm")) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo WebM.",
      })
      return
    }

    setInputFile(file)
    setOutputUrl(null)
  }

  const convertToMp4 = async () => {
    if (!inputFile) return

    setIsConverting(true)
    setProgress(0)

    // Simulação de conversão (em uma implementação real, você usaria um serviço web)
    // Aqui estamos apenas simulando o progresso

    const totalSteps = 10
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setProgress(i * (100 / totalSteps))
    }

    // Em uma implementação real, você enviaria o arquivo para um serviço de conversão
    // e receberia o MP4 de volta. Aqui, estamos apenas retornando o mesmo arquivo.

    setOutputUrl(URL.createObjectURL(inputFile))
    setIsConverting(false)

    toast({
      title: "Conversão simulada",
      description:
        "Em um ambiente real, o arquivo seria convertido para MP4. Por limitações do navegador, estamos apenas simulando a conversão.",
    })
  }

  const handleDownload = () => {
    if (!outputUrl) return

    const a = document.createElement("a")
    a.href = outputUrl
    a.download = inputFile ? inputFile.name.replace(".webm", ".mp4") : "video.mp4"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Converter WebM para MP4</h3>

      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="video/webm"
          className="hidden"
          onChange={handleFileChange}
          id="webm-upload"
        />

        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Selecionar arquivo WebM
        </Button>

        {inputFile && <p className="text-sm text-gray-500 truncate">Arquivo selecionado: {inputFile.name}</p>}
      </div>

      {isConverting ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Convertendo...</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : (
        <Button onClick={convertToMp4} disabled={!inputFile || isConverting} className="w-full">
          {isConverting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Convertendo...
            </>
          ) : (
            <>Converter para MP4</>
          )}
        </Button>
      )}

      {outputUrl && (
        <Button variant="default" onClick={handleDownload} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Baixar MP4
        </Button>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Nota: Esta é uma simulação de conversão. Em um ambiente real, você precisaria usar um serviço de backend para
        converter WebM para MP4.
      </p>
    </div>
  )
}
