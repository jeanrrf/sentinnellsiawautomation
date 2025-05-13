"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { ErrorDisplayStandard } from "@/components/error-display-standard"

interface Product {
  id: string
  name: string
  image: string
  price: string
}

export function QuickMediaAccess() {
  const router = useRouter()
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar produtos populares ao montar o componente
  useEffect(() => {
    fetchPopularProducts()
  }, [])

  const fetchPopularProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/best-sellers")
      if (!response.ok) {
        throw new Error(`Erro ao buscar produtos: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Falha ao buscar produtos")
      }

      setPopularProducts(
        data.products.slice(0, 3).map((product: any) => ({
          id: product.itemId || product.id,
          name: product.productName || product.name,
          image: product.imageUrl || product.image,
          price: product.price,
        })),
      )
    } catch (error) {
      console.error("Erro ao buscar produtos populares:", error)
      setError(error instanceof Error ? error.message : "Erro ao buscar produtos")
    } finally {
      setIsLoading(false)
    }
  }

  const goToProductMedia = (productId: string) => {
    // Armazenar o ID do produto para ser usado na página de mídia
    localStorage.setItem("selectedProductId", productId)
    router.push("/dashboard/midia-produto")
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Mídia de Produtos</CardTitle>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Novo
            </Badge>
          </div>
          <CardDescription>Acesse rapidamente imagens e vídeos dos produtos mais populares</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorDisplayStandard onRetry={fetchPopularProducts} message={error} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Mídia de Produtos</CardTitle>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Novo
          </Badge>
        </div>
        <CardDescription>Acesse rapidamente imagens e vídeos dos produtos mais populares</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {popularProducts.length > 0 ? (
              popularProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => goToProductMedia(product.id)}
                >
                  <div className="relative w-12 h-12 rounded-md overflow-hidden border">
                    <Image
                      src={product.image || "/error-message.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/midia-produto")}>
          Ver todos os produtos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
