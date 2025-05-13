"use client"

import type { TrendingProduct } from "@/lib/trending-products-service"
import { ProductCard } from "./product-card"

interface TrendingGridProps {
  products: TrendingProduct[]
  onSelectProduct?: (product: TrendingProduct) => void
}

export function TrendingGrid({ products, onSelectProduct }: TrendingGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum produto em alta encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
      ))}
    </div>
  )
}
