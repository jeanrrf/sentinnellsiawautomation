"use client"

import type { Category, TrendingProduct } from "@/lib/trending-products-service"
import { TrendingGrid } from "./trending-grid"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface CategorySectionProps {
  category: Category
  products: TrendingProduct[]
  onSelectProduct?: (product: TrendingProduct) => void
  onViewMore?: (categoryId: string) => void
}

export function CategorySection({ category, products, onSelectProduct, onViewMore }: CategorySectionProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{category.name}</h2>
        <Button variant="ghost" size="sm" onClick={() => onViewMore?.(category.id)}>
          Ver mais <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <TrendingGrid products={products} onSelectProduct={onSelectProduct} />
    </div>
  )
}
