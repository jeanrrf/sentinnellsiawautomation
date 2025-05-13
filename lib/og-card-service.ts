import { ImageResponse } from "@vercel/og"
import { ProductCard, type ProductCardProps } from "@/components/og-cards/product-card"
import { ModernProductCard, type ModernProductCardProps } from "@/components/og-cards/modern-product-card"
import { createLogger } from "@/lib/logger"

const logger = createLogger("og-card-service")

// Tipos de cards disponíveis
export type CardStyle = "standard" | "modern"

// Opções para geração de cards
export interface CardGenerationOptions {
  style?: CardStyle
  theme?: "dark" | "light" | "vibrant" | "elegant"
  colorScheme?: "red" | "blue" | "purple" | "green" | "gold"
  showBadges?: boolean
  showRating?: boolean
  showShopName?: boolean
  layout?: "standard" | "fullImage" | "split"
  width?: number
  height?: number
  format?: "png" | "jpeg"
  quality?: number
}

// Configurações padrão
const DEFAULT_OPTIONS: CardGenerationOptions = {
  style: "standard",
  theme: "dark",
  colorScheme: "red",
  showBadges: true,
  showRating: true,
  showShopName: true,
  layout: "standard",
  width: 1080,
  height: 1920,
  format: "png",
  quality: 90,
}

/**
 * Gera um card de produto usando o ImageResponse do @vercel/og
 */
export async function generateProductOgCard(
  product: any,
  description = "",
  options: CardGenerationOptions = {},
): Promise<ImageResponse> {
  try {
    // Mesclar opções com valores padrão
    const finalOptions = { ...DEFAULT_OPTIONS, ...options }

    // Configurar dimensões e formato
    const imageOptions = {
      width: finalOptions.width,
      height: finalOptions.height,
      ...(finalOptions.format === "png" ? { type: "png" } : { type: "jpeg", quality: finalOptions.quality }),
    }

    // Selecionar o componente de card com base no estilo
    let cardComponent

    if (finalOptions.style === "modern") {
      // Configurar props para o card moderno
      const cardProps: ModernProductCardProps = {
        product,
        description,
        colorScheme: finalOptions.colorScheme,
        showBadges: finalOptions.showBadges,
        showRating: finalOptions.showRating,
        showShopName: finalOptions.showShopName,
        layout: finalOptions.layout,
      }

      cardComponent = ModernProductCard(cardProps)
    } else {
      // Configurar props para o card padrão
      const cardProps: ProductCardProps = {
        product,
        description,
        theme: finalOptions.theme,
        showBadges: finalOptions.showBadges,
        showRating: finalOptions.showRating,
        showShopName: finalOptions.showShopName,
      }

      cardComponent = ProductCard(cardProps)
    }

    // Gerar a resposta de imagem
    return new ImageResponse(cardComponent, imageOptions)
  } catch (error: any) {
    logger.error(`Error generating OG card: ${error.message}`, error)
    throw error
  }
}

/**
 * Gera um card de produto com cache
 * Usa um hash baseado nos parâmetros para evitar regeneração desnecessária
 */
export async function generateCachedProductOgCard(
  product: any,
  description = "",
  options: CardGenerationOptions = {},
  cacheTime = 3600, // 1 hora em segundos
): Promise<ImageResponse> {
  try {
    // Implementação de cache pode ser adicionada aqui
    // Por enquanto, apenas gera o card
    return generateProductOgCard(product, description, options)
  } catch (error: any) {
    logger.error(`Error generating cached OG card: ${error.message}`, error)
    throw error
  }
}
