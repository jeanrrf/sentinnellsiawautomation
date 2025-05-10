"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Video, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface VideoRecorderProps {
  htmlContent: string
  productId: string
  duration?: number
  onRecordingComplete?: (videoBlob: Blob, videoUrl: string) => void
}

export function VideoRecorder({ htmlContent, productId, duration = 5, onRecordingComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [countdown, setCountdown] = useState(3)
  const [showCountdown, setShowCountdown] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const { toast } = useToast()

  // Renderizar o HTML no container de preview
  useEffect(() => {
    if (htmlContent && previewRef.current) {
      try {
        // Limpar o conteúdo anterior
        previewRef.current.innerHTML = ""

        // Criar um iframe isolado para o preview
        const iframe = document.createElement("iframe")
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        iframe.style.border = "none"
        iframe.style.overflow = "hidden"
        iframe.title = "Card Preview"
        iframe.sandbox.add("allow-same-origin")

        // Adicionar ao container
        previewRef.current.appendChild(iframe)

        // Escrever o conteúdo no iframe após ele ser carregado
        iframe.onload = () => {
          if (iframe.contentDocument) {
            iframe.contentDocument.open()
            iframe.contentDocument.write(htmlContent)
            iframe.contentDocument.close()
          }
        }

        // Iniciar o carregamento
        iframe.src = "about:blank"
      } catch (error) {
        console.error("Error rendering preview:", error)
        setError("Erro ao renderizar o preview do card")
      }
    }
  }, [htmlContent])

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  // Função para iniciar a contagem regressiva antes da gravação
  const startCountdown = () => {
    setShowCountdown(true)
    setCountdown(3)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setShowCountdown(false)
          startRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Função para iniciar a gravação
  const startRecording = async () => {
    if (!previewRef.current) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Container de preview não encontrado",
      })
      return
    }

    setIsRecording(true)
    setRecordingProgress(0)
    setError(null)
    chunksRef.current = []

    try {
      // Capturar o elemento de preview como stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          frameRate: 30,
        },
        audio: false,
      })

      streamRef.current = stream

      // Criar o MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      })

      mediaRecorderRef.current = mediaRecorder

      // Configurar handlers de eventos
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)

        try {
          // Criar blob do vídeo
          const videoBlob = new Blob(chunksRef.current, { type: "video/webm" })
          setVideoBlob(videoBlob)

          // Criar URL para o blob
          const url = URL.createObjectURL(videoBlob)
          setVideoUrl(url)

          // Notificar o componente pai
          if (onRecordingComplete) {
            onRecordingComplete(videoBlob, url)
          }

          toast({
            title: "Vídeo gravado com sucesso",
            description: "Você pode baixar o vídeo agora",
          })
        } catch (error) {
          console.error("Erro ao processar vídeo:", error)
          setError("Erro ao processar o vídeo")
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Falha ao processar o vídeo",
          })
        } finally {
          setIsProcessing(false)
          setIsRecording(false)
          setRecordingProgress(100)

          // Parar todos os tracks do stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }
        }
      }

      // Iniciar a gravação
      mediaRecorder.start(100)

      // Atualizar o progresso
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 100 / (duration * 10)
        if (progress >= 100) {
          clearInterval(progressInterval)
          progress = 100
        }
        setRecordingProgress(progress)
      }, 100)

      // Parar a gravação após a duração especificada
      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop()
          clearInterval(progressInterval)
        }
      }, duration * 1000)

      toast({
        title: "Gravação iniciada",
        description: `Gravando por ${duration} segundos...`,
      })
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error)
      setIsRecording(false)
      setError("Erro ao iniciar a gravação. Verifique as permissões do navegador.")
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao iniciar a gravação. Verifique as permissões do navegador.",
      })
    }
  }

  // Função para baixar o vídeo
  const downloadVideo = () => {
    if (!videoBlob) return

    const a = document.createElement("a")
    a.href = videoUrl
    a.download = `shopee-card-${productId}-${new Date().getTime()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    toast({
      title: "Download iniciado",
      description: "O vídeo está sendo baixado",
    })
  }

  // Função para reiniciar o processo
  const resetRecording = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    setVideoBlob(null)
    setVideoUrl("")
    setRecordingProgress(0)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "9/16" }}>
        {/* Container de preview */}
        <div ref={previewRef} className="w-full h-full" style={{ display: videoUrl ? "none" : "block" }}></div>

        {/* Vídeo gravado */}
        {videoUrl && (
          <video ref={videoRef} src={videoUrl} className="w-full h-full" controls autoPlay loop muted></video>
        )}

        {/* Overlay de contagem regressiva */}
        {showCountdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="text-white text-7xl font-bold">{countdown}</div>
          </div>
        )}

        {/* Overlay de erro */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="text-white text-center p-4">
              <p className="text-red-400 font-bold mb-2">Erro</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      {(isRecording || isProcessing || recordingProgress > 0) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{isRecording ? "Gravando..." : isProcessing ? "Processando..." : "Concluído"}</span>
            <span>{Math.round(recordingProgress)}%</span>
          </div>
          <Progress value={recordingProgress} className="h-1" />
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        {!videoUrl ? (
          <Button onClick={startCountdown} disabled={isRecording || isProcessing || !htmlContent} className="flex-1">
            {isRecording || isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Video className="mr-2 h-4 w-4" />
            )}
            {isRecording ? `Gravando (${duration}s)...` : isProcessing ? "Processando..." : "Gravar Vídeo"}
          </Button>
        ) : (
          <>
            <Button onClick={downloadVideo} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Baixar Vídeo
            </Button>
            <Button variant="outline" onClick={resetRecording}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Nova Gravação
            </Button>
          </>
        )}
      </div>

      {/* Instruções */}
      {!videoUrl && !isRecording && !isProcessing && (
        <div className="text-xs text-muted-foreground">
          <p>
            Ao clicar em "Gravar Vídeo", você precisará selecionar a área da tela que contém o card. Selecione apenas a
            área do card para melhor qualidade.
          </p>
        </div>
      )}
    </div>
  )
}
