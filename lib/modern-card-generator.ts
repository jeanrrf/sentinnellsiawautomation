import { logger } from "./logger"

// Define product interface
interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  discount?: number
  imageUrl: string
  description?: string
  rating?: number
  sales?: number
  freeShipping?: boolean
  installments?: string
}

// Define card style options
interface CardStyleOptions {
  template: "modern" | "minimal"
  colorScheme: "dark" | "light" | "gradient"
  accentColor?: string
  showBadges: boolean
  descriptionStyle: "clean" | "highlighted"
  roundedCorners: boolean
}

// Default style options
const defaultStyleOptions: CardStyleOptions = {
  template: "modern",
  colorScheme: "dark",
  accentColor: "#FF4D4D",
  showBadges: true,
  descriptionStyle: "clean",
  roundedCorners: true,
}

// Function to format price
const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2).replace(".", ",")}`
}

// Serverless-compatible card generation function
export const generateCard = async (product: Product, styleOptions: Partial<CardStyleOptions> = {}): Promise<string> => {
  // Merge default options with provided options
  const options: CardStyleOptions = { ...defaultStyleOptions, ...styleOptions }

  try {
    // Instead of generating an actual image, we'll return a URL to a serverless function
    // that will generate the image on demand
    const params = new URLSearchParams({
      template: options.template,
      colorScheme: options.colorScheme,
      accentColor: options.accentColor || defaultStyleOptions.accentColor,
      showBadges: options.showBadges.toString(),
      descriptionStyle: options.descriptionStyle,
      roundedCorners: options.roundedCorners.toString(),
      productId: product.id,
      productName: product.name,
      productPrice: product.price.toString(),
      productImageUrl: product.imageUrl,
    })

    if (product.originalPrice) {
      params.append("productOriginalPrice", product.originalPrice.toString())
    }

    if (product.discount) {
      params.append("productDiscount", product.discount.toString())
    }

    if (product.description) {
      params.append("productDescription", product.description)
    }

    if (product.rating) {
      params.append("productRating", product.rating.toString())
    }

    if (product.sales) {
      params.append("productSales", product.sales.toString())
    }

    if (product.freeShipping) {
      params.append("productFreeShipping", product.freeShipping.toString())
    }

    // Return the URL to the API endpoint that will generate the card
    return `/api/modern-card-test?${params.toString()}`
  } catch (error) {
    logger.error("Error generating card URL:", error)
    throw error
  }
}

// Export the modern and minimal card generators as aliases to the main function
export const generateModernCard = generateCard
export const generateMinimalCard = (
  product: Product,
  styleOptions: Partial<CardStyleOptions> = {},
): Promise<string> => {
  return generateCard(product, { ...styleOptions, template: "minimal" })
}
