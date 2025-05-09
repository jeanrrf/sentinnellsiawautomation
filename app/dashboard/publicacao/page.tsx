"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, Copy } from "lucide-react"

export default function PublicacaoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [pendingVideos, setPendingVideos] = useState([])
  const [publishedVideos, setPublishedVideos] = useState([])
  const [error, setError] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Referências para os iframes de vídeo
  const videoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Buscar vídeos ao carregar a página
  useEffect(() => {
    fetchVideos()
  }, [])

  // Renderizar os vídeos quando os dados são carregados
  useEffect(() => {
    renderVideos()
  }, [pendingVideos, publishedVideos])

  // Função para buscar vídeos
  const fetchVideos = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Buscar vídeos pendentes
      const pendingResponse = await fetch("/api/videos")
      if (!pendingResponse.ok) {
        throw new Error(`Falha ao buscar vídeos pendentes: ${pendingResponse.status}`)
      }
      const pendingData = await pendingResponse.json()

      // Buscar vídeos publicados
      const publishedResponse = await fetch("/api/published-videos")
      if (!publishedResponse.ok) {
        throw new Error(`Falha ao buscar vídeos publicados: ${publishedResponse.status}`)
      }
      const publishedData = await publishedResponse.json()

      setPendingVideos(pendingData.videos || [])
      setPublishedVideos(publishedData.videos || [])
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao buscar vídeos")
      console.error("Erro ao buscar vídeos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para renderizar os vídeos nos iframes
  const renderVideos = () => {
    // Renderizar vídeos pendentes
    pendingVideos.forEach((video) => {
      renderVideo(video, false)
    })

    // Renderizar vídeos publicados
    publishedVideos.forEach((video) => {
      renderVideo(video, true)
    })
  }

  // Função para renderizar um vídeo específico
  const renderVideo = (video: any, isPublished: boolean) => {
    const videoId = `video-${isPublished ? "pub-" : ""}${video.productId}`
    const container = videoRefs.current[videoId]

    if (container && video.htmlTemplate) {
      // Limpar o container
      container.innerHTML = ""

      try {
        // Criar um iframe para o vídeo
        const iframe = document.createElement("iframe")
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        iframe.style.border = "none"
        iframe.style.overflow = "hidden"
        iframe.title = video.productName || "Video Preview"
        iframe.sandbox.add("allow-same-origin")

        // Adicionar ao container
        container.appendChild(iframe)

        // Escrever o conteúdo no iframe
        iframe.onload = () => {
          if (iframe.contentDocument) {
            iframe.contentDocument.open()
            iframe.contentDocument.write(video.htmlTemplate)
            iframe.contentDocument.close()
          }
        }

        // Iniciar o carregamento
        iframe.src = "about:blank"
      } catch (error) {
        console.error(`Erro ao renderizar vídeo ${video.productId}:`, error)
        container.innerHTML = `<div class="flex items-center justify-center h-full bg-muted">
          <p class="text-muted-foreground text-center text-xs">Erro ao carregar vídeo</p>
        </div>`
      }
    }
  }

  // Função para publicar um vídeo
  const handlePublishVideo = async (productId: string) => {
    try {
      setIsPublishing(true)
      setPublishingId(productId)

      const response = await fetch("/api/publish-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao publicar vídeo: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Falha ao publicar vídeo")
      }

      // Atualizar as listas de vídeos
      setPendingVideos((prev) => prev.filter((video: any) => video.productId !== productId))

      // Buscar vídeos publicados novamente
      await fetchVideos()

      toast({
        title: "Vídeo publicado com sucesso",
        description: "O vídeo foi publicado e está disponível para visualização",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error: any) {
      console.error("Erro ao publicar vídeo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao publicar vídeo",
        description: error.message,
        className: "bg-red-100 border-red-500 text-red-800",
      })
    } finally {
      setIsPublishing(false)
      setPublishingId(null)
    }
  }

  // Função para abrir o preview em uma nova janela
  const openPreviewInNewWindow = (videoUrl: string) => {
    if (!videoUrl) return

    // Criar uma nova janela com o tamanho adequado
    const width = 1080
    const height = 1920

    // Ajustar para caber na tela
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height

    let adjustedWidth = width
    let adjustedHeight = height

    if (width > screenWidth * 0.9) {
      const ratio = width / height
      adjustedWidth = Math.floor(screenWidth * 0.9)
      adjustedHeight = Math.floor(adjustedWidth / ratio)
    }

    if (adjustedHeight > screenHeight * 0.9) {
      const ratio = width / height
      adjustedHeight = Math.floor(screenHeight * 0.9)
      adjustedWidth = Math.floor(adjustedHeight * ratio)
    }

    const left = Math.floor((screenWidth - adjustedWidth) / 2)
    const top = Math.floor((screenHeight - adjustedHeight) / 2)

    window.open(
      videoUrl,
      "preview",
      `width=${adjustedWidth},height=${adjustedHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    )
  }

  // Função para copiar o link do vídeo
  const copyVideoLink = (videoUrl: string) => {
    if (!videoUrl) return

    navigator.clipboard
      .writeText(window.location.origin + videoUrl)
      .then(() => {
        toast({
          title: "Link copiado",
          description: "O link do vídeo foi copiado para a área de transferência",
          className: "bg-green-100 border-green-500 text-green-800",
        })
      })
      .catch((err) => {
        console.error("Erro ao copiar link:", err)
        toast({
          variant: "destructive",
          title: "Erro ao copiar link",
          description: "Não foi possível copiar o link para a área de transferência",
          className: "bg-red-100 border-red-500 text-red-800",
        })
      })
  }

  // Renderizar um card de vídeo
  const renderVideoCard = (video: any, isPending = true) => {
    const videoId = `video-${isPending ? "" : "pub-"}${video.productId}`

    return (
      <Card key={videoId} className="overflow-hidden">
        <div className="grid grid-cols-[120px_1fr] h-full">
          <div className="bg-black flex items-center justify-center">
            <div
              ref={(el) => (videoRefs.current[videoId] = el)}
              className="w-full h-full"
              style={{ aspectRatio: "9/16", maxHeight: "200px" }}
            ></div>
          </div>
          <div className="p-4 flex flex-col">
            <h3 className="text-sm font-medium line-clamp-2">{video.productName}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              <p>Preço: R$ {video.price}</p>
              <p>Duração: {video.duration}s</p>
              <p>
                Criado em:{" "}
                {new Date(video.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {video.publishedAt && (
                <p>
                  Publicado em:{" "}
                  {new Date(video.publishedAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            <div className="mt-auto pt-2 flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => openPreviewInNewWindow(video.videoUrl)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visualizar
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => copyVideoLink(video.videoUrl)}>
                <Copy className="h-3 w-3 mr-1" />
                Copiar Link
              </Button>
              {isPending && (
                <Button
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handlePublishVideo(video.productId)}
                  disabled={isPublishing && publishingId === video.productId}
                >
                  {isPublishing && publishingId === video.productId ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Publicar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Publicação de Vídeos</h1>
          <p className="text-muted-foreground">Gerencie e publique seus vídeos do TikTok</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pendentes ({pendingVideos.length})</TabsTrigger>
            <TabsTrigger value="published">Publicados ({publishedVideos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingVideos.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingVideos.map((video: any) => renderVideoCard(video))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum vídeo pendente encontrado.</p>
                <p className="text-sm mt-2">Gere novos vídeos na seção Designer para vê-los aqui.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="published" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : publishedVideos.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {publishedVideos.map((video: any) => renderVideoCard(video, false))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum vídeo publicado encontrado.</p>
                <p className="text-sm mt-2">Publique vídeos da aba "Pendentes" para vê-los aqui.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
