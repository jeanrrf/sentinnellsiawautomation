import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TrendingProduct } from "@/lib/trending-products-service"
import { ExternalLink, Star, TrendingUp, ShoppingCart } from "lucide-react"
import Image from "next/image"

interface ProductDetailDialogProps {
  product: TrendingProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailDialog({ product, open, onOpenChange }: ProductDetailDialogProps) {
  // Se o produto for null, não renderize o conteúdo principal
  if (!product) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>Carregando detalhes...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  // Determinar a cor do indicador de tendência
  const getTrendColor = (indicator: string) => {
    switch (indicator) {
      case "muito-alta":
        return "bg-red-500"
      case "alta":
        return "bg-orange-500"
      case "média":
        return "bg-yellow-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.shopName && <span>Vendido por {product.shopName}</span>}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative aspect-square overflow-hidden rounded-md">
            <Image
              src={product.image || "/placeholder.svg?height=300&width=300&query=product"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
              onError={(e) => {
                // Fallback para imagem de erro
                e.currentTarget.src = "/error-message.png"
              }}
            />
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{product.price}</div>
                {product.originalPrice && (
                  <div className="text-sm text-gray-500 line-through">{product.originalPrice}</div>
                )}
              </div>

              {product.discountRate && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {product.discountRate} OFF
                </Badge>
              )}

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center">
                  <ShoppingCart className="h-4 w-4 text-gray-500 mr-1" />
                  <span>{product.sales.toLocaleString()} vendas</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Tendência:</span>
                <Badge
                  variant="outline"
                  className={`${getTrendColor(product.trendIndicator)} text-white border-transparent`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {product.trendIndicator.charAt(0).toUpperCase() + product.trendIndicator.slice(1)}
                </Badge>
              </div>
            </div>

            {product.offerLink && (
              <Button className="mt-4" asChild>
                <a href={product.offerLink} target="_blank" rel="noopener noreferrer">
                  Ver na Shopee
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
