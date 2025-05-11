import { createLogger } from "./logger"

const logger = createLogger("TrendingProductsService")

// Configurações da API
const SHOPEE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL || "https://open-api.affiliate.shopee.com.br"
const APP_ID = process.env.SHOPEE_APP_ID
const APP_SECRET = process.env.SHOPEE_APP_SECRET

// Critérios para produtos em alta
const MIN_SALES = 500
const MIN_RATING = 4.5
const MIN_DISCOUNT = 10

/**
 * Serviço especializado para buscar produtos em alta diretamente da API da Shopee
 * Não utiliza cache e sempre busca dados atualizados
 */
export class TrendingProductsService {
  /**
   * Busca produtos em alta da API da Shopee
   * @param limit Número de produtos a serem retornados (padrão: 1)
   * @returns Lista de produtos em alta ou array vazio se não encontrar
   */
  static async getTrendingProducts(limit = 1) {
    try {
      logger.info(`Buscando ${limit} produtos em alta diretamente da API da Shopee`)

      // Obter token de autenticação
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await this.generateSignature(timestamp)

      if (!signature) {
        logger.error("Falha ao gerar assinatura para autenticação")
        return []
      }

      // Categorias populares para buscar produtos em alta
      const popularCategories = [
        "", // Todas as categorias
        "100630", // Eletrônicos
        "100632", // Moda Feminina
        "100633", // Saúde & Beleza
        "100634", // Casa & Decoração
      ]

      // Selecionar uma categoria aleatória para diversificar os resultados
      const randomCategory = popularCategories[Math.floor(Math.random() * popularCategories.length)]

      // Parâmetros de busca otimizados para encontrar produtos em alta
      const apiUrl = new URL(`${SHOPEE_API_URL}/api/v1/search/item`)
      if (randomCategory) {
        apiUrl.searchParams.append("category", randomCategory)
      }
      apiUrl.searchParams.append("page", "1")
      apiUrl.searchParams.append("page_size", "50") // Buscar mais produtos para ter uma boa amostra
      apiUrl.searchParams.append("sort_by", "sales") // Ordenar por vendas
      apiUrl.searchParams.append("sort_direction", "DESC") // Ordem decrescente

      logger.info(`Buscando produtos na categoria: ${randomCategory || "Todas"}`)

      const response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
        },
        cache: "no-store", // Garantir que não use cache
      })

      if (!response.ok) {
        logger.error("Erro na resposta da API da Shopee", {
          status: response.status,
          statusText: response.statusText,
        })
        return []
      }

      const data = await response.json()

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        logger.warning("Resposta da API não contém itens válidos", { data })
        return []
      }

      // Processar e formatar os produtos
      const formattedProducts = data.items
        .map(this.formatShopeeProduct)
        .filter(Boolean)
        .filter(this.isHighQualityProduct)

      if (formattedProducts.length === 0) {
        logger.warning("Nenhum produto de alta qualidade encontrado")
        return []
      }

      // Aplicar algoritmo de seleção inteligente
      const selectedProducts = this.selectBestProducts(formattedProducts, limit)

      logger.info(`${selectedProducts.length} produtos em alta selecionados`)
      return selectedProducts
    } catch (error) {
      logger.error("Erro ao buscar produtos em alta", { error })
      return []
    }
  }

  /**
   * Seleciona os melhores produtos com base em um algoritmo de pontuação
   * @param products Lista de produtos para selecionar
   * @param limit Número máximo de produtos a retornar
   */
  private static selectBestProducts(products: any[], limit: number): any[] {
    // Calcular pontuação para cada produto
    const scoredProducts = products.map((product) => {
      // Iniciar com pontuação base
      let score = 0

      // Pontos por vendas (0-50 pontos)
      score += Math.min(product.sales / 100, 50)

      // Pontos por avaliação (0-25 pontos)
      score += Number.parseFloat(product.ratingStar) * 5

      // Pontos por desconto (0-15 pontos)
      score += Math.min(product.discount / 2, 15)

      // Pontos por nome do produto (0-10 pontos)
      score += Math.min(product.productName.length / 10, 10)

      // Adicionar aleatoriedade (0-10 pontos) para diversificar resultados
      score += Math.random() * 10

      return {
        ...product,
        score,
      }
    })

    // Ordenar por pontuação e selecionar os melhores
    scoredProducts.sort((a, b) => b.score - a.score)

    // Log dos top produtos para depuração
    const topProducts = scoredProducts.slice(0, Math.min(3, limit))
    logger.info(
      "Top produtos em alta:",
      topProducts.map((p) => ({
        id: p.itemId,
        name: p.productName,
        sales: p.sales,
        rating: p.ratingStar,
        score: p.score,
      })),
    )

    // Retornar a quantidade solicitada (ou menos, se não houver produtos suficientes)
    return scoredProducts.slice(0, limit)
  }

  // Manter o método original para compatibilidade
  static async getTrendingProduct() {
    const products = await this.getTrendingProducts(1)
    return products.length > 0 ? products[0] : null
  }

  /**
   * Gera assinatura para autenticação com a API da Shopee
   * Usando Web Crypto API para compatibilidade com ambientes Edge
   */
  private static async generateSignature(timestamp: number): Promise<string | null> {
    try {
      if (!APP_ID || !APP_SECRET) {
        logger.error("Credenciais da API não configuradas")
        return null
      }

      const message = `${APP_ID}${timestamp}`

      // Converter a mensagem e a chave para ArrayBuffer
      const encoder = new TextEncoder()
      const messageBuffer = encoder.encode(message)
      const keyBuffer = encoder.encode(APP_SECRET)

      // Importar a chave para o formato adequado para HMAC
      const key = await crypto.subtle.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])

      // Gerar a assinatura
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageBuffer)

      // Converter o resultado para hexadecimal
      return Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    } catch (error) {
      logger.error("Erro ao gerar assinatura", { error })
      return null
    }
  }

  /**
   * Formata produto da Shopee para o formato usado pela aplicação
   */
  private static formatShopeeProduct(item: any) {
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
        images: item.image_url ? [item.image_url] : [],
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

  /**
   * Verifica se um produto atende aos critérios de qualidade
   */
  private static isHighQualityProduct(product: any): boolean {
    // Verificar se tem vendas suficientes
    if (product.sales < MIN_SALES) {
      return false
    }

    // Verificar se tem avaliação mínima
    if (Number.parseFloat(product.ratingStar) < MIN_RATING) {
      return false
    }

    // Verificar se tem imagem
    if (!product.imageUrl) {
      return false
    }

    // Verificar se o nome do produto é adequado (não muito curto)
    if (!product.productName || product.productName.length < 10) {
      return false
    }

    // Preferir produtos com desconto
    if (product.discount < MIN_DISCOUNT) {
      // Não eliminar, mas dar menor prioridade
      product.qualityScore = (product.qualityScore || 0) - 10
    }

    return true
  }
}
