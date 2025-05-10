"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Trash2, Download, ExternalLink, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

export function CacheViewer() {
  const [isLoading, setIsLoading] = useState(true)
  const [videos, setVideos] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("videos")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/videos")

      if (!response.ok) {
        throw new Error(`Falha ao buscar vídeos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setVideos(data.videos || [])
    } catch (err: any) {
      setError(err.message || "Falha ao buscar vídeos")
      console.error("Erro ao buscar vídeos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVideo = async (id: string) => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Falha ao excluir vídeo: ${response.status} ${response.statusText}`)
      }

      toast({
        title: "Vídeo excluído",
        description: "O vídeo foi excluído com sucesso",
      })

      // Refresh videos list
      fetchVideos()
    } catch (err: any) {
      setError(err.message || "Falha ao excluir vídeo")
      console.error("Erro ao excluir vídeo:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir vídeo",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePublishVideo = async (id: string) => {
    try {
      const response = await fetch(`/api/videos/${id}/publish`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Falha ao publicar vídeo: ${response.status} ${response.statusText}`)
      }

      toast({
        title: "Vídeo publicado",
        description: "O vídeo foi enviado para publicação no TikTok",
      })

      // Refresh videos list
      fetchVideos()
    } catch (err: any) {
      setError(err.message || "Falha ao publicar vídeo")
      console.error("Erro ao publicar vídeo:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao publicar vídeo",
      })
    }
  }

  const handleDownloadVideo = async (id: string) => {
    try {
      window.open(`/api/videos/${id}/download`, "_blank")
    } catch (err: any) {
      console.error("Erro ao baixar vídeo:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao baixar vídeo",
      })
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="videos">Vídeos Gerados</TabsTrigger>
          <TabsTrigger value="descriptions">Descrições em Cache</TabsTrigger>
          <TabsTrigger value="products">Produtos em Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardDescription>Vídeos gerados e armazenados no cache, prontos para publicação</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : videos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID do Produto</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => (
                      <TableRow key={video.id}>
                        <TableCell>{video.productId}</TableCell>
                        <TableCell>{new Date(video.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{video.duration}s</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              video.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : video.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {video.status === "pending"
                              ? "Pendente"
                              : video.status === "published"
                                ? "Publicado"
                                : video.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Adicionar botão de visualização se tiver URL do Blob */}
                            {video.blobUrl && (
                              <Button variant="outline" size="sm" onClick={() => window.open(video.blobUrl, "_blank")}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => handleDownloadVideo(video.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishVideo(video.id)}
                              disabled={video.status === "published"}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVideo(video.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum vídeo encontrado</p>
                  <p className="text-sm text-muted-foreground mt-2">Gere vídeos na aba Designer para vê-los aqui</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={fetchVideos} disabled={isLoading} className="ml-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="descriptions">
          <Card>
            <CardHeader>
              <CardDescription>Descrições de produtos geradas pela IA e armazenadas no cache</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* This would be populated with actual description data */}
                  <Alert>
                    <AlertDescription>As descrições em cache são exibidas aqui quando disponíveis.</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={fetchVideos} disabled={isLoading} className="ml-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardDescription>Produtos da Shopee armazenados no cache</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* This would be populated with actual product data */}
                  <Alert>
                    <AlertDescription>Os produtos em cache são exibidos aqui quando disponíveis.</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={fetchVideos} disabled={isLoading} className="ml-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
