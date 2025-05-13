import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import {
  getTrendingProductsByCategory,
  getTrendingProductsAllCategories,
  getMainCategories,
} from "@/lib/trending-products-service"

const logger = createLogger("api-trending-products")

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const all = searchParams.get("all") === "true"

    logger.info(
      `Buscando produtos em alta: ${all ? "todas categorias" : categoryId ? `categoria ${categoryId}` : "geral"}`,
    )

    // Buscar dados reais da API
    if (all) {
      // Buscar produtos em alta para todas as categorias
      const results = await getTrendingProductsAllCategories(limit > 20 ? 20 : limit)
      return NextResponse.json({
        success: true,
        data: results,
      })
    } else {
      // Buscar produtos em alta para uma categoria específica ou geral
      const products = await getTrendingProductsByCategory(categoryId, limit)
      return NextResponse.json({
        success: true,
        data: products,
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao buscar produtos em alta: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar produtos em alta",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// Endpoint para obter categorias
export async function POST(request: NextRequest) {
  try {
    logger.info("Obtendo lista de categorias")
    const categories = getMainCategories()

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao obter categorias: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao obter categorias",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
