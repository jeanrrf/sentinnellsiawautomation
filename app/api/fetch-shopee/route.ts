import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { cacheProducts, isRedisAvailable, getCachedProducts, getExcludedProducts } from "@/lib/redis"
// Remova a importação do crypto no topo do arquivo, pois usaremos o módulo nativo do Node.js
// Remova ou comente: import crypto from "crypto"

const logger = createLogger("ShopeeAPI")

// Configurações da API
const SHOPEE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL || "https://open-api.affiliate.shopee.com.br"
const APP_ID = process.env.SHOPEE_APP_ID
const APP_SECRET = process.env.SHOPEE_APP_SECRET

// Limites e configurações
const MAX_RESULTS_PER_PAGE = 50
const MAX_TOTAL_RESULTS = 200
const CACHE_DURATION = 60 * 60 // 1 hora em segundos

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const keyword = url.searchParams.get("keyword") || ""
    const category = url.searchParams.get("category") || ""
    const minPrice = url.searchParams.get("minPrice") || ""
    const maxPrice = url.searchParams.get("maxPrice") || ""
    const minSales = Number.parseInt(url.searchParams.get("minSales") || "0")
    const sortBy = url.searchParams.get("sortBy") || "sales"
    const sortOrder = url.searchParams.get("sortOrder") || "desc"
    const forceRefresh = url.searchParams.get("forceRefresh") === "true"
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "20"), MAX_RESULTS_PER_PAGE)

    // Validação de parâmetros - Agora permitimos busca apenas por categoria sem palavra-chave
    // Removemos a validação que exigia keyword ou category

    // Verificar cache primeiro (se não for forçada a atualização)
    if (!forceRefresh && (await isRedisAvailable())) {
      logger.info("Verificando produtos em cache")
      const cachedProducts = await getCachedProducts()

      if (cachedProducts && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
        logger.info(`Encontrados ${cachedProducts.length} produtos em cache`)

        // Aplicar filtros aos produtos em cache
        const filteredProducts = filterProducts(cachedProducts, {
          keyword,
          category,
          minPrice,
          maxPrice,
          minSales,
        })

        // Aplicar ordenação
        const sortedProducts = sortProducts(filteredProducts, sortBy, sortOrder)

        // Aplicar paginação
        const paginatedProducts = paginateProducts(sortedProducts, page, limit)

        return NextResponse.json({
          success: true,
          products: paginatedProducts,
          total: filteredProducts.length,
          page,
          limit,
          totalPages: Math.ceil(filteredProducts.length / limit),
          source: "cache",
        })
      }
    }

    // Se não houver cache ou forceRefresh for true, buscar da API
    logger.info("Buscando produtos da API da Shopee", { keyword, category, sortBy, sortOrder })

    // Obter token de autenticação
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = await generateSignature(timestamp)

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Falha ao gerar assinatura para autenticação",
        },
        { status: 500 },
      )
    }

    // Buscar produtos com paginação para evitar sobrecarga
    const allProducts = []
    let currentPage = 1
    let hasMoreResults = true
    let totalApiCalls = 0
    const maxApiCalls = Math.ceil(MAX_TOTAL_RESULTS / MAX_RESULTS_PER_PAGE)

    while (hasMoreResults && totalApiCalls < maxApiCalls && allProducts.length < MAX_TOTAL_RESULTS) {
      const apiUrl = new URL(`${SHOPEE_API_URL}/api/v1/search/item`)

      // Parâmetros de busca
      if (keyword) apiUrl.searchParams.append("keyword", keyword)
      if (category) apiUrl.searchParams.append("category", category)
      if (minPrice) apiUrl.searchParams.append("min_price", minPrice)
      if (maxPrice) apiUrl.searchParams.append("max_price", maxPrice)
      apiUrl.searchParams.append("page", currentPage.toString())
      apiUrl.searchParams.append("page_size", MAX_RESULTS_PER_PAGE.toString())
      apiUrl.searchParams.append("sort_by", mapSortField(sortBy))
      apiUrl.searchParams.append("sort_direction", sortOrder === "desc" ? "DESC" : "ASC")

      const response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        logger.error("Erro na resposta da API da Shopee", {
          status: response.status,
          statusText: response.statusText,
        })

        // Se for o primeiro chamado e falhar, retornar erro
        if (currentPage === 1) {
          return NextResponse.json(
            {
              success: false,
              message: `Erro ao buscar produtos: ${response.status} ${response.statusText}`,
            },
            { status: response.status },
          )
        } else {
          // Se já temos alguns resultados, interromper e usar o que temos
          hasMoreResults = false
          break
        }
      }

      const data = await response.json()

      if (!data.items || !Array.isArray(data.items)) {
        logger.warning("Resposta da API não contém itens válidos", { data })
        hasMoreResults = false
        break
      }

      // Processar e formatar os produtos
      const formattedProducts = data.items.map(formatShopeeProduct).filter(Boolean)
      allProducts.push(...formattedProducts)

      // Verificar se há mais páginas
      hasMoreResults = formattedProducts.length === MAX_RESULTS_PER_PAGE
      currentPage++
      totalApiCalls++

      // Pequeno delay para evitar sobrecarga na API
      if (hasMoreResults) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    logger.info(`Busca concluída. Encontrados ${allProducts.length} produtos`)

    // Filtrar produtos excluídos
    const excludedProducts = await getExcludedProducts()
    const filteredProducts = allProducts.filter((product) => !excludedProducts.includes(product.itemId))

    // Salvar no cache se houver produtos e o Redis estiver disponível
    if (filteredProducts.length > 0 && (await isRedisAvailable())) {
      try {
        await cacheProducts(filteredProducts)
        logger.info(`${filteredProducts.length} produtos salvos no cache`)
      } catch (cacheError) {
        logger.error("Erro ao salvar produtos no cache", { error: cacheError })
      }
    }

    // Aplicar filtros adicionais (minSales)
    const finalFilteredProducts = filteredProducts.filter((product) => product.sales >= minSales)

    // Aplicar ordenação final
    const sortedProducts = sortProducts(finalFilteredProducts, sortBy, sortOrder)

    // Aplicar paginação para a resposta
    const startIndex = (page - 1) * limit
    const paginatedProducts = sortedProducts.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      total: finalFilteredProducts.length,
      page,
      limit,
      totalPages: Math.ceil(finalFilteredProducts.length / limit),
      source: "api",
    })
  } catch (error: any) {
    logger.error("Erro ao buscar produtos da Shopee", { error })
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao buscar produtos: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

// Substitua a função generateSignature com esta implementação corrigida:
async function generateSignature(timestamp: number): Promise<string | null> {
  try {
    if (!APP_ID || !APP_SECRET) {
      logger.error("Credenciais da API não configuradas")
      return null
    }

    const message = `${APP_ID}${timestamp}`

    // Usar o módulo crypto nativo do Node.js
    const crypto = require("crypto")
    const hmac = crypto.createHmac("sha256", APP_SECRET)
    hmac.update(message)
    return hmac.digest("hex")
  } catch (error) {
    logger.error("Erro ao gerar assinatura", { error })
    return null
  }
}

// Função para formatar produto da Shopee
function formatShopeeProduct(item: any) {
  try {
    if (!item || !item.item_id) return null

    return {
      itemId: item.item_id.toString(),
      productName: item.item_name || "Produto sem nome",
      price: Number.parseFloat(item.price || 0).toFixed(2),
      originalPrice: item.original_price ? Number.parseFloat(item.original_price).toFixed(2) : null,
      discount: item.discount || 0,
      sales: Number.parseInt(item.sales || "0"),
      ratingStar: Number.parseFloat(item.rating_star || "0").toFixed(1),
      imageUrl: item.image_url || null,
      offerLink: item.offer_link || `https://shopee.com.br/product/${item.item_id}`,
      shopId: item.shop_id?.toString() || null,
      shopName: item.shop_name || "Loja desconhecida",
      categoryId: item.category_id?.toString() || null,
      categoryName: item.category_name || null,
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    logger.error("Erro ao formatar produto", { error, item })
    return null
  }
}

// Função para filtrar produtos
function filterProducts(products: any[], filters: any) {
  return products.filter((product) => {
    // Filtro por palavra-chave
    if (filters.keyword && !product.productName.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false
    }

    // Filtro por categoria
    if (filters.category && product.categoryId !== filters.category) {
      return false
    }

    // Filtro por preço mínimo
    if (filters.minPrice && Number.parseFloat(product.price) < Number.parseFloat(filters.minPrice)) {
      return false
    }

    // Filtro por preço máximo
    if (filters.maxPrice && Number.parseFloat(product.price) > Number.parseFloat(filters.maxPrice)) {
      return false
    }

    // Filtro por vendas mínimas
    if (filters.minSales && product.sales < filters.minSales) {
      return false
    }

    return true
  })
}

// Função para ordenar produtos
function sortProducts(products: any[], sortBy: string, sortOrder: string) {
  return [...products].sort((a, b) => {
    let valueA, valueB

    switch (sortBy) {
      case "price":
        valueA = Number.parseFloat(a.price)
        valueB = Number.parseFloat(b.price)
        break
      case "sales":
        valueA = a.sales
        valueB = b.sales
        break
      case "rating":
        valueA = Number.parseFloat(a.ratingStar)
        valueB = Number.parseFloat(b.ratingStar)
        break
      case "discount":
        valueA = a.discount
        valueB = b.discount
        break
      default:
        valueA = a.sales
        valueB = b.sales
    }

    return sortOrder === "desc" ? valueB - valueA : valueA - valueB
  })
}

// Função para paginar produtos
function paginateProducts(products: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit
  return products.slice(startIndex, startIndex + limit)
}

// Mapear campos de ordenação para os valores aceitos pela API
function mapSortField(field: string): string {
  switch (field) {
    case "price":
      return "price"
    case "sales":
      return "sales"
    case "rating":
      return "rating"
    case "discount":
      return "discount"
    default:
      return "sales"
  }
}
