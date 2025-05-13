"use client"

import { useState, useEffect } from "react"
import type { Category, TrendingProduct } from "@/lib/trending-products-service"

// Dados de exemplo para categorias
const FALLBACK_CATEGORIES: Category[] = [
  { id: "11", name: "Eletrônicos", level: 1 },
  { id: "13", name: "Celulares & Acessórios", level: 1 },
  { id: "15", name: "Moda Feminina", level: 1 },
  { id: "16", name: "Moda Masculina", level: 1 },
  { id: "17", name: "Relógios", level: 1 },
  { id: "18", name: "Casa & Decoração", level: 1 },
  { id: "19", name: "Saúde & Beleza", level: 1 },
]

// Função para gerar um produto de exemplo
function generateFallbackProduct(id: string, categoryId: string): TrendingProduct {
  const categoryMap: Record<string, string> = {
    "11": "Eletrônicos",
    "13": "Celulares & Acessórios",
    "15": "Moda Feminina",
    "16": "Moda Masculina",
    "17": "Relógios",
    "18": "Casa & Decoração",
    "19": "Saúde & Beleza",
  }

  const categoryName = categoryMap[categoryId] || "Produto"
  const randomSales = Math.floor(Math.random() * 1000) + 100
  const randomRating = Math.random() * 2 + 3 // Rating entre 3 e 5
  const randomPrice = (Math.random() * 500 + 50).toFixed(2)
  const hasDiscount = Math.random() > 0.5
  const discountRate = hasDiscount ? (Math.random() * 30 + 5).toFixed(0) : undefined
  const originalPrice = hasDiscount ? (Number(randomPrice) / (1 - Number(discountRate) / 100)).toFixed(2) : undefined

  return {
    id,
    name: `${categoryName} Exemplo ${id}`,
    price: `R$ ${randomPrice}`,
    originalPrice: originalPrice ? `R$ ${originalPrice}` : undefined,
    discountRate: discountRate ? `${discountRate}%` : undefined,
    sales: randomSales,
    rating: randomRating,
    image: `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(categoryName)}`,
    shopName: "Loja Exemplo",
    offerLink: "#",
    trendScore: randomSales * 0.6 + randomRating * 20 * 0.3 + (discountRate ? Number(discountRate) * 0.1 : 0),
    trendIndicator: randomSales > 500 ? "alta" : randomSales > 200 ? "média" : "baixa",
  }
}

// Gerar produtos de exemplo para cada categoria
function generateFallbackCategoryProducts(): { category: Category; products: TrendingProduct[] }[] {
  return FALLBACK_CATEGORIES.map((category) => {
    const products = Array.from({ length: 5 }, (_, i) =>
      generateFallbackProduct(`${category.id}-${i + 1}`, category.id),
    )
    return { category, products }
  })
}

// Gerar uma lista de produtos de exemplo
function generateFallbackProducts(categoryId: string | null = null, count = 20): TrendingProduct[] {
  if (categoryId) {
    return Array.from({ length: count }, (_, i) => generateFallbackProduct(`${categoryId}-${i + 1}`, categoryId))
  } else {
    // Produtos misturados de todas as categorias
    return FALLBACK_CATEGORIES.flatMap((category, categoryIndex) =>
      Array.from({ length: Math.ceil(count / FALLBACK_CATEGORIES.length) }, (_, i) =>
        generateFallbackProduct(`${category.id}-${categoryIndex}-${i + 1}`, category.id),
      ),
    ).slice(0, count)
  }
}

export function useFallbackData() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [categoryProducts, setCategoryProducts] = useState<{ category: Category; products: TrendingProduct[] }[]>([])

  useEffect(() => {
    // Gerar dados de fallback apenas no cliente
    setCategoryProducts(generateFallbackCategoryProducts())
    setIsLoaded(true)
  }, [])

  return {
    isLoaded,
    categories: FALLBACK_CATEGORIES,
    categoryProducts,
    getProductsByCategory: (categoryId: string | null = null, count = 20) =>
      generateFallbackProducts(categoryId, count),
  }
}
