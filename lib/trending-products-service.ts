import { getShopeeAffiliateAPI } from "./shopee-affiliate-api"
import { createLogger } from "./logger"

const logger = createLogger("trending-products-service")

// Estrutura para categoria
export interface Category {
  id: string
  name: string
  parentId?: string
  level: number
  children?: Category[]
}

// Estrutura para produto em alta
export interface TrendingProduct {
  id: string
  name: string
  price: string
  originalPrice?: string
  discountRate?: string
  sales: number
  rating: number
  image: string
  shopName?: string
  offerLink?: string
  trendScore: number
  trendIndicator: "baixa" | "média" | "alta" | "muito-alta"
}

// Lista de categorias principais da Shopee
// Estas são categorias reais da Shopee Brasil
const MAIN_CATEGORIES: Category[] = [
  { id: "11", name: "Eletrônicos", level: 1 },
  { id: "13", name: "Celulares & Acessórios", level: 1 },
  { id: "15", name: "Moda Feminina", level: 1 },
  { id: "16", name: "Moda Masculina", level: 1 },
  { id: "17", name: "Relógios", level: 1 },
  { id: "18", name: "Casa & Decoração", level: 1 },
  { id: "19", name: "Saúde & Beleza", level: 1 },
  { id: "21", name: "Bebês & Crianças", level: 1 },
  { id: "22", name: "Esportes & Lazer", level: 1 },
  { id: "23", name: "Automotivo", level: 1 },
  { id: "24", name: "Ferramentas & Jardim", level: 1 },
  { id: "26", name: "Brinquedos & Hobbies", level: 1 },
  { id: "27", name: "Alimentos & Bebidas", level: 1 },
  { id: "28", name: "Pets", level: 1 },
]

/**
 * Calcula o score de tendência de um produto
 * Produtos com mais vendas, melhor avaliação e maiores descontos recebem pontuação mais alta
 */
function calculateTrendScore(product: any): number {
  const sales = Number.parseInt(product.sales) || 0
  const rating = (Number.parseFloat(product.ratingStar) || 0) * 20 // Converte para escala 0-100
  const discount = Number.parseFloat(product.priceDiscountRate || "0")

  // Fórmula ponderada: 60% vendas + 30% avaliação + 10% desconto
  return sales * 0.6 + rating * 0.3 + discount * 0.1
}

/**
 * Determina o indicador de tendência com base no score
 */
function getTrendIndicator(score: number): "baixa" | "média" | "alta" | "muito-alta" {
  if (score > 1000) return "muito-alta"
  if (score > 500) return "alta"
  if (score > 100) return "média"
  return "baixa"
}

/**
 * Converte um produto da API para o formato TrendingProduct
 */
function mapToTrendingProduct(product: any): TrendingProduct {
  const trendScore = calculateTrendScore(product)
  const price = Number.parseFloat(product.price)
  const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100

  // Calcular preço original se houver desconto
  let originalPrice: string | undefined
  if (discountRate > 0) {
    originalPrice = (price / (1 - discountRate)).toFixed(2)
  }

  return {
    id: product.itemId,
    name: product.productName,
    price: `R$ ${Number.parseFloat(product.price).toFixed(2)}`,
    originalPrice: originalPrice ? `R$ ${originalPrice}` : undefined,
    discountRate: product.priceDiscountRate ? `${product.priceDiscountRate}%` : undefined,
    sales: Number.parseInt(product.sales) || 0,
    rating: Number.parseFloat(product.ratingStar) || 0,
    image: product.imageUrl,
    shopName: product.shopName,
    offerLink: product.offerLink,
    trendScore,
    trendIndicator: getTrendIndicator(trendScore),
  }
}

/**
 * Busca produtos em alta por categoria
 */
export async function getTrendingProductsByCategory(
  categoryId: string | null = null,
  limit = 20,
): Promise<TrendingProduct[]> {
  try {
    const shopeeAPI = getShopeeAffiliateAPI()
    if (!shopeeAPI) {
      logger.error("API Shopee não inicializada")
      throw new Error("API Shopee não inicializada")
    }

    // Parâmetros para a consulta
    const params: any = {
      limit,
      sortType: 2, // Ordenar por vendas
    }

    // Adicionar categoria se especificada
    if (categoryId) {
      params.category = categoryId
    }

    // Buscar produtos usando a API
    const products = await shopeeAPI.searchProducts(params)
    logger.info(`Encontrados ${products.length} produtos em alta${categoryId ? ` na categoria ${categoryId}` : ""}`)

    // Mapear para o formato TrendingProduct e ordenar por score de tendência
    return products.map(mapToTrendingProduct).sort((a, b) => b.trendScore - a.trendScore)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao buscar produtos em alta: ${errorMessage}`)
    throw error
  }
}

/**
 * Busca produtos em alta para todas as categorias principais
 */
export async function getTrendingProductsAllCategories(
  productsPerCategory = 5,
): Promise<{ category: Category; products: TrendingProduct[] }[]> {
  try {
    const results = []

    // Para cada categoria principal, buscar produtos em alta
    for (const category of MAIN_CATEGORIES) {
      logger.info(`Buscando produtos em alta para categoria: ${category.name}`)
      try {
        const products = await getTrendingProductsByCategory(category.id, productsPerCategory)
        results.push({ category, products })
      } catch (error) {
        logger.error(`Erro ao buscar produtos para categoria ${category.name}: ${error}`)
        // Continuar para a próxima categoria em caso de erro
      }
    }

    if (results.length === 0) {
      throw new Error("Não foi possível obter produtos para nenhuma categoria")
    }

    return results
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao buscar produtos em alta por categorias: ${errorMessage}`)
    throw error
  }
}

/**
 * Obtém a lista de categorias principais
 */
export function getMainCategories(): Category[] {
  return [...MAIN_CATEGORIES]
}

/**
 * Busca uma categoria pelo ID
 */
export function getCategoryById(categoryId: string): Category | undefined {
  return MAIN_CATEGORIES.find((category) => category.id === categoryId)
}
