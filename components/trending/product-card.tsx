"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import type { TrendingProduct } from "@/lib/trending-products-service"
import { TrendIndicator } from "./trend-indicator"

interface ProductCardProps {
  product: TrendingProduct
  onSelect?: (product: TrendingProduct) => void
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={() => onSelect?.(product)}>
      <div className="relative aspect-square">
        <Image
          src={imageError ? "/error-message.png" : product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          onError={handleImageError}
        />
        <div className="absolute top-2 right-2">
          <TrendIndicator indicator={product.trendIndicator} />
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium line-clamp-2 text-sm h-10">{product.name}</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-bold">{product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.originalPrice}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <Badge variant="outline" className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {product.rating.toFixed(1)}
        </Badge>
        <span className="text-xs text-muted-foreground">{product.sales.toLocaleString()} vendas</span>
      </CardFooter>
    </Card>
  )
}
