"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, Copy, Trash2, AlertCircle, Download } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PublicacaoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [pendingVideos, setPendingVideos] = useState([])
  const [publishedVideos, setPublishedVideos] = useState([])
  const [error, setError] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<any>(null)
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

  // Função para confirmar exclusão de vídeo
  const confirmDeleteVideo = (video: any) => {
    setVideoToDelete(video)
    setShowDeleteDialog(true)
  }

  // Função para excluir um vídeo
  const handleDeleteVideo = async () => {
    if (!videoToDelete) return

    try {
      setIsDeleting(true)
      setDeletingId(videoToDelete.productId)

      const response = await fetch("/api/videos/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: videoToDelete.productId }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao excluir vídeo: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Falha ao excluir vídeo")
      }

      // Atualizar a lista de vídeos pendentes
      setPendingVideos((prev) => prev.filter((video: any) => video.productId !== videoToDelete.productId))

      toast({
        title: "Vídeo excluído com sucesso",
        description: "O vídeo foi removido permanentemente",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error: any) {
      console.error("Erro ao excluir vídeo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir vídeo",
        description: error.message,
        className: "bg-red-100 border-red-500 text-red-800",
      })
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
      setShowDeleteDialog(false)
      setVideoToDelete(null)
    }
  }

  // Função para baixar o vídeo em MP4
  const handleDownloadVideo = async (productId: string) => {
    try {
      setIsDownloading(true)
      setDownloadingId(productId)

      // Iniciar o download do vídeo
      const downloadUrl = `/api/videos/${productId}/download`

      // Criar um link temporário para download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `shopee_product_${productId}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download iniciado",
        description: "O vídeo está sendo baixado em formato MP4",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error: any) {
      console.error("Erro ao baixar vídeo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao baixar vídeo",
        description: error.message || "Ocorreu um erro ao baixar o vídeo",
        className: "bg-red-100 border-red-500 text-red-800",
      })
    } finally {
      // Pequeno atraso para melhorar a experiência do usuário
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadingId(null)
      }, 1000)
    }
  }

  // Função para visualizar o vídeo em uma nova janela
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
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleDownloadVideo(video.productId)}
                disabled={isDownloading && downloadingId === video.productId}
              >
                {isDownloading && downloadingId === video.productId ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Baixar MP4
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => copyVideoLink(video.videoUrl)}>
                <Copy className="h-3 w-3 mr-1" />
                Copiar Link
              </Button>
              {isPending && (
                <>
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
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => confirmDeleteVideo(video)}
                    disabled={isDeleting && deletingId === video.productId}
                  >
                    {isDeleting && deletingId === video.productId ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    Excluir
                  </Button>
                </>
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

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {videoToDelete && (
            <div className="mt-2 p-2 bg-muted rounded-md">
              <div className="font-medium">{videoToDelete.productName}</div>
              <div className="text-xs text-muted-foreground">ID: {videoToDelete.productId}</div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteVideo()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
