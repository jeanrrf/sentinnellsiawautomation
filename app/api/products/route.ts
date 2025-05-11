import { NextResponse } from "next/server"
import { getCachedProducts } from "@/lib/redis"
import { createLogger } from "@/lib/logger"

const logger = createLogger("ProductsAPI")

// Produto de exemplo para fallback
const SAMPLE_PRODUCTS = [
  {
    itemId: "sample-1",
    productName: "Produto de Exemplo 1",
    price: "99.90",
    originalPrice: "129.90",
    discount: 23,
    sales: 1250,
    ratingStar: "4.8",
    imageUrl: "/generic-product-display.png",
    offerLink: "https://shopee.com.br",
    shopId: "sample-shop-1",
    shopName: "Loja de Exemplo",
    categoryId: "11",
    categoryName: "Moda Feminina",
    updatedAt: new Date().toISOString(),
  },
  {
    itemId: "sample-2",
    productName: "Produto de Exemplo 2",
    price: "49.90",
    originalPrice: "69.90",
    discount: 29,
    sales: 980,
    ratingStar: "4.5",
    imageUrl: "/assortment-of-gadgets.png",
    offerLink: "https://shopee.com.br",
    shopId: "sample-shop-2",
    shopName: "Loja de Exemplo",
    categoryId: "24",
    categoryName: "Celulares & Acessórios",
    updatedAt: new Date().toISOString(),
  },
]

export async function GET(request: Request) {
  try {
    logger.info("API: Buscando produtos do cache")

    // Parâmetros da URL
    const url = new URL(request.url)
    const useSample = url.searchParams.get("useSample") === "true"

    // Se o parâmetro useSample for true, retornar produtos de exemplo
    if (useSample) {
      logger.info("API: Retornando produtos de exemplo")
      return NextResponse.json({
        success: true,
        products: SAMPLE_PRODUCTS,
        source: "sample",
      })
    }

    // Tentar obter produtos do cache
    try {
      const cachedProducts = await getCachedProducts()

      if (cachedProducts && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
        logger.info(`API: Retornando ${cachedProducts.length} produtos do cache`)
        return NextResponse.json({
          success: true,
          products: cachedProducts,
          source: "cache",
        })
      } else {
        logger.info("API: Nenhum produto válido encontrado no cache")
      }
    } catch (cacheError) {
      logger.error("API: Erro ao acessar o cache Redis:", cacheError)
    }

    // Se não houver produtos no cache, retornar produtos de exemplo
    logger.info("API: Retornando produtos de exemplo como fallback")
    return NextResponse.json({
      success: true,
      products: SAMPLE_PRODUCTS,
      source: "fallback",
    })
  } catch (error) {
    logger.error("API: Erro ao buscar produtos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao buscar produtos",
        products: [],
      },
      { status: 500 },
    )
  }
}
