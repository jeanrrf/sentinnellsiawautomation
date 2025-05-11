"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Upload, CheckCircle } from "lucide-react"
import { VideoConversionHelp } from "./video-conversion-help"

export function ImageToVideoConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile)
        setStatus("idle")
        setError(null)
      } else {
        setError("Por favor, selecione um arquivo de imagem válido.")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    try {
      setStatus("uploading")
      setProgress(10)

      // Create form data
      const formData = new FormData()
      formData.append("image", file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // Simulate API call
      setTimeout(() => {
        clearInterval(progressInterval)
        setProgress(100)
        setStatus("success")
        setVideoUrl("/placeholder-video.mp4")
      }, 3000)

      // In a real implementation, you would make an actual API call:
      // const response = await fetch('/api/convert-image-to-video', {
      //   method: 'POST',
      //   body: formData,
      // })
      //
      // if (!response.ok) {
      //   throw new Error('Falha ao converter imagem para vídeo')
      // }
      //
      // const data = await response.json()
      // setVideoUrl(data.videoUrl)
      // setStatus('success')
      // setProgress(100)
    } catch (err: any) {
      setStatus("error")
      setError(err.message || "Ocorreu um erro ao converter a imagem para vídeo.")
      setProgress(0)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Conversor de Imagem para Vídeo</CardTitle>
        <CardDescription>Transforme suas imagens em vídeos animados para suas publicações</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image">Selecione uma imagem</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={status === "uploading" || status === "processing"}
            />
            {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
          </div>

          {status !== "idle" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === "error" && error && (
            <div className="bg-destructive/15 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {status === "success" && videoUrl && (
            <div className="space-y-2">
              <div className="bg-success/15 p-3 rounded-md flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm text-success">Vídeo gerado com sucesso!</p>
              </div>
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Prévia do vídeo disponível</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.open(videoUrl, "_blank")}
              >
                Baixar Vídeo
              </Button>
            </div>
          )}

          <Button
            type="submit"
            disabled={!file || status === "uploading" || status === "processing"}
            className="w-full"
          >
            {status === "uploading" || status === "processing" ? (
              "Processando..."
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Converter para Vídeo
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <VideoConversionHelp />
      </CardFooter>
    </Card>
  )
}
