"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink } from "lucide-react"

export default function PublicacaoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [pendingVideos, setPendingVideos] = useState([])
  const [publishedVideos, setPublishedVideos] = useState([])
  const [error, setError] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()

  // Buscar vídeos ao carregar a página
  useEffect(() => {
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

    fetchVideos()
  }, [])

  // Função para publicar um vídeo
  const handlePublishVideo = async (productId: string) => {
    try {
      setIsPublishing(true)

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
      const publishedResponse = await fetch("/api/published-videos")
      if (publishedResponse.ok) {
        const publishedData = await publishedResponse.json()
        setPublishedVideos(publishedData.videos || [])
      }

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
    }
  }

  // Renderizar um card de vídeo
  const renderVideoCard = (video: any, isPending = true) => {
    return (
      <Card key={video.productId} className="overflow-hidden">
        <div className="grid grid-cols-[120px_1fr] h-full">
          <div className="bg-black flex items-center justify-center">
            <iframe
              src={video.videoUrl}
              className="w-full h-full"
              style={{ aspectRatio: "9/16", maxHeight: "200px" }}
              title={video.productName}
              allowFullScreen
            ></iframe>
          </div>
          <div className="p-4 flex flex-col">
            <h3 className="text-sm font-medium line-clamp-2">{video.productName}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              <p>Preço: R$ {video.price}</p>
              <p>Duração: {video.duration}s</p>
              <p>Criado em: {new Date(video.createdAt).toLocaleString()}</p>
              {video.publishedAt && <p>Publicado em: {new Date(video.publishedAt).toLocaleString()}</p>}
            </div>
            <div className="mt-auto pt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => window.open(video.videoUrl, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visualizar
              </Button>
              {isPending && (
                <Button
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handlePublishVideo(video.productId)}
                  disabled={isPublishing}
                >
                  {isPublishing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
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
