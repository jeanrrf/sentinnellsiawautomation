import { createCanvas, loadImage, registerFont } from "canvas"
import path from "path"
import fs from "fs"
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

// Font registration
const registerFonts = () => {
  try {
    const fontPath = path.join(process.cwd(), "public", "fonts")

    // Register fonts if they exist
    if (fs.existsSync(path.join(fontPath, "Montserrat-Bold.ttf"))) {
      registerFont(path.join(fontPath, "Montserrat-Bold.ttf"), { family: "Montserrat", weight: "bold" })
      registerFont(path.join(fontPath, "Montserrat-Regular.ttf"), { family: "Montserrat", weight: "normal" })
      registerFont(path.join(fontPath, "Montserrat-Medium.ttf"), { family: "Montserrat", weight: "500" })
    } else {
      // Fallback to system fonts
      logger.warn("Custom fonts not found, using system fonts")
    }
  } catch (error) {
    logger.error("Error registering fonts:", error)
  }
}

// Helper function to draw rounded rectangle
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = true,
  stroke = false,
) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  if (fill) {
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }
}

// Helper function to draw text with wrapping
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 0,
): number => {
  const words = text.split(" ")
  let line = ""
  let lines = 0
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + " "
      currentY += lineHeight
      lines++

      if (maxLines > 0 && lines >= maxLines) {
        if (n < words.length - 1) {
          // Add ellipsis if there are more words
          line = line.trim() + "..."
          ctx.fillText(line, x, currentY)
        } else {
          ctx.fillText(line, x, currentY)
        }
        return currentY
      }
    } else {
      line = testLine
    }
  }

  ctx.fillText(line, x, currentY)
  return currentY + lineHeight
}

// Function to format price
const formatPrice = (price: number): string => {
  return `R$ ${price.toFixed(2).replace(".", ",")}`
}

// Main function to generate modern card
export const generateModernCard = async (
  product: Product,
  styleOptions: Partial<CardStyleOptions> = {},
): Promise<Buffer> => {
  // Register fonts
  registerFonts()

  // Merge default options with provided options
  const options: CardStyleOptions = { ...defaultStyleOptions, ...styleOptions }

  // Canvas dimensions
  const width = 800
  const height = 1200

  // Create canvas
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Background based on color scheme
  if (options.colorScheme === "dark") {
    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "#1a1a2e")
    gradient.addColorStop(1, "#16213e")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  } else if (options.colorScheme === "light") {
    // Light background
    ctx.fillStyle = "#f8f9fa"
    ctx.fillRect(0, 0, width, height)
  } else if (options.colorScheme === "gradient") {
    // Custom gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "#f8f9fa")
    gradient.addColorStop(1, "#e9ecef")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  try {
    // Load product image
    const image = await loadImage(product.imageUrl)

    // Image container
    const imageContainerWidth = width - 80
    const imageContainerHeight = height * 0.5
    const imageContainerX = 40
    const imageContainerY = 80

    // Draw image container with rounded corners if enabled
    if (options.roundedCorners) {
      ctx.fillStyle = "#ffffff"
      drawRoundedRect(ctx, imageContainerX, imageContainerY, imageContainerWidth, imageContainerHeight, 20)

      // Create clipping region for the image
      ctx.save()
      drawRoundedRect(
        ctx,
        imageContainerX,
        imageContainerY,
        imageContainerWidth,
        imageContainerHeight,
        20,
        false,
        false,
      )
      ctx.clip()
    } else {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(imageContainerX, imageContainerY, imageContainerWidth, imageContainerHeight)
    }

    // Calculate image dimensions to maintain aspect ratio
    const imageAspect = image.width / image.height
    let drawWidth = imageContainerWidth
    let drawHeight = drawWidth / imageAspect

    if (drawHeight > imageContainerHeight) {
      drawHeight = imageContainerHeight
      drawWidth = drawHeight * imageAspect
    }

    // Center the image in the container
    const imageX = imageContainerX + (imageContainerWidth - drawWidth) / 2
    const imageY = imageContainerY + (imageContainerHeight - drawHeight) / 2

    // Draw the image
    ctx.drawImage(image, imageX, imageY, drawWidth, drawHeight)

    // Restore context if we used clipping
    if (options.roundedCorners) {
      ctx.restore()
    }

    // Draw badges if enabled
    if (options.showBadges) {
      // Discount badge
      if (product.discount && product.discount > 0) {
        const discountText = `-${product.discount}%`
        ctx.font = "bold 28px Montserrat"
        const discountMetrics = ctx.measureText(discountText)
        const discountWidth = discountMetrics.width + 30
        const discountHeight = 40
        const discountX = width - 60
        const discountY = 60

        // Draw discount badge background
        ctx.fillStyle = options.accentColor || "#FF4D4D"
        if (options.roundedCorners) {
          drawRoundedRect(ctx, discountX - discountWidth, discountY, discountWidth, discountHeight, 20)
        } else {
          ctx.fillRect(discountX - discountWidth, discountY, discountWidth, discountHeight)
        }

        // Draw discount text
        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(discountText, discountX - discountWidth / 2, discountY + discountHeight / 2)
        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"
      }

      // Free shipping badge
      if (product.freeShipping) {
        const shippingText = "FRETE GRÁTIS"
        ctx.font = "bold 24px Montserrat"
        const shippingMetrics = ctx.measureText(shippingText)
        const shippingWidth = shippingMetrics.width + 30
        const shippingHeight = 40
        const shippingX = 60
        const shippingY = 60

        // Draw shipping badge background
        ctx.fillStyle = "#10B981" // Green color for shipping
        if (options.roundedCorners) {
          drawRoundedRect(ctx, shippingX, shippingY, shippingWidth, shippingHeight, 20)
        } else {
          ctx.fillRect(shippingX, shippingY, shippingWidth, shippingHeight)
        }

        // Draw shipping text
        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(shippingText, shippingX + shippingWidth / 2, shippingY + shippingHeight / 2)
        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"
      }
    }

    // Product information section
    const infoStartY = imageContainerY + imageContainerHeight + 40

    // Product title
    ctx.font = "bold 36px Montserrat"
    ctx.fillStyle = options.colorScheme === "dark" ? "#ffffff" : "#1a1a2e"
    const titleMaxWidth = width - 80
    const titleY = wrapText(ctx, product.name, 40, infoStartY, titleMaxWidth, 46, 2)

    // Price section
    const priceY = titleY + 30

    // Current price
    ctx.font = "bold 64px Montserrat"
    ctx.fillStyle = options.accentColor || "#FF4D4D"
    ctx.fillText(formatPrice(product.price), 40, priceY)

    // Original price if there's a discount
    if (product.originalPrice && product.originalPrice > product.price) {
      ctx.font = "32px Montserrat"
      ctx.fillStyle = options.colorScheme === "dark" ? "#9ca3af" : "#6b7280"
      const originalPriceText = formatPrice(product.originalPrice)
      const originalPriceMetrics = ctx.measureText(originalPriceText)

      // Draw strikethrough line
      const strikeY = priceY - 15
      ctx.beginPath()
      ctx.moveTo(40, strikeY)
      ctx.lineTo(40 + originalPriceMetrics.width, strikeY)
      ctx.strokeStyle = options.colorScheme === "dark" ? "#9ca3af" : "#6b7280"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw original price text
      ctx.fillText(originalPriceText, 40, priceY - 40)
    }

    // Rating and sales
    if (product.rating) {
      const ratingY = priceY + 50

      // Star icon
      ctx.fillStyle = "#FFD700"
      ctx.font = "28px Montserrat"
      ctx.fillText("★", 40, ratingY)

      // Rating text
      ctx.fillStyle = options.colorScheme === "dark" ? "#ffffff" : "#1a1a2e"
      ctx.font = "28px Montserrat"
      const ratingText = `${product.rating.toFixed(1)}`
      const ratingMetrics = ctx.measureText(ratingText)
      ctx.fillText(ratingText, 70, ratingY)

      // Sales count
      if (product.sales) {
        ctx.fillStyle = options.colorScheme === "dark" ? "#9ca3af" : "#6b7280"
        ctx.font = "28px Montserrat"
        const salesText = `• ${product.sales.toLocaleString()} vendas`
        ctx.fillText(salesText, 70 + ratingMetrics.width + 10, ratingY)
      }
    }

    // Description section
    if (product.description) {
      const descriptionY = product.rating ? priceY + 100 : priceY + 60

      // Description container
      const descContainerWidth = width - 80
      const descMaxHeight = height - descriptionY - 100

      // Draw description background if highlighted style
      if (options.descriptionStyle === "highlighted") {
        ctx.fillStyle = options.colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
        if (options.roundedCorners) {
          drawRoundedRect(ctx, 40, descriptionY, descContainerWidth, descMaxHeight, 20)
        } else {
          ctx.fillRect(40, descriptionY, descContainerWidth, descMaxHeight)
        }
      }

      // Description text
      ctx.font = "28px Montserrat"
      ctx.fillStyle = options.colorScheme === "dark" ? "#e5e7eb" : "#374151"
      wrapText(ctx, product.description, 60, descriptionY + 40, descContainerWidth - 40, 36, 6)
    }

    // Call to action button
    const ctaY = height - 100
    const ctaWidth = width - 80
    const ctaHeight = 70
    const ctaX = 40

    // Button background
    ctx.fillStyle = options.accentColor || "#FF4D4D"
    if (options.roundedCorners) {
      drawRoundedRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, 35)
    } else {
      ctx.fillRect(ctaX, ctaY, ctaWidth, ctaHeight)
    }

    // Button text
    ctx.font = "bold 32px Montserrat"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("COMPRE AGORA • LINK NA BIO", ctaX + ctaWidth / 2, ctaY + ctaHeight / 2)

    // Reset text alignment
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"

    // Return the buffer
    return canvas.toBuffer("image/png")
  } catch (error) {
    logger.error("Error generating modern card:", error)
    throw error
  }
}

// Function to generate minimal card (alternative design)
export const generateMinimalCard = async (
  product: Product,
  styleOptions: Partial<CardStyleOptions> = {},
): Promise<Buffer> => {
  // Register fonts
  registerFonts()

  // Merge default options with provided options
  const options: CardStyleOptions = {
    ...defaultStyleOptions,
    ...styleOptions,
    template: "minimal",
  }

  // Canvas dimensions
  const width = 800
  const height = 1200

  // Create canvas
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Background
  ctx.fillStyle = options.colorScheme === "dark" ? "#121212" : "#ffffff"
  ctx.fillRect(0, 0, width, height)

  try {
    // Load product image
    const image = await loadImage(product.imageUrl)

    // Image container
    const imageContainerWidth = width
    const imageContainerHeight = height * 0.6

    // Draw image with aspect ratio preservation
    const imageAspect = image.width / image.height
    let drawWidth = imageContainerWidth
    let drawHeight = drawWidth / imageAspect

    if (drawHeight > imageContainerHeight) {
      drawHeight = imageContainerHeight
      drawWidth = drawHeight * imageAspect
    }

    // Center the image
    const imageX = (width - drawWidth) / 2
    const imageY = 0

    // Draw the image
    ctx.drawImage(image, imageX, imageY, drawWidth, drawHeight)

    // Add a subtle gradient overlay at the bottom of the image for text readability
    const gradientHeight = 150
    const gradient = ctx.createLinearGradient(0, imageContainerHeight - gradientHeight, 0, imageContainerHeight)
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, imageContainerHeight - gradientHeight, width, gradientHeight)

    // Product information section
    const infoStartY = imageContainerHeight + 40

    // Product title
    ctx.font = "bold 36px Montserrat"
    ctx.fillStyle = options.colorScheme === "dark" ? "#ffffff" : "#1a1a2e"
    const titleMaxWidth = width - 80
    const titleY = wrapText(ctx, product.name, 40, infoStartY, titleMaxWidth, 46, 2)

    // Price section with clean layout
    const priceY = titleY + 40

    // Current price
    ctx.font = "bold 56px Montserrat"
    ctx.fillStyle = options.accentColor || "#FF4D4D"
    ctx.fillText(formatPrice(product.price), 40, priceY)

    // Original price if there's a discount
    if (product.originalPrice && product.originalPrice > product.price) {
      ctx.font = "28px Montserrat"
      ctx.fillStyle = options.colorScheme === "dark" ? "#9ca3af" : "#6b7280"
      const originalPriceText = formatPrice(product.originalPrice)
      ctx.fillText(originalPriceText, 40, priceY - 36)

      // Draw strikethrough line
      const strikeY = priceY - 50
      const originalPriceMetrics = ctx.measureText(originalPriceText)
      ctx.beginPath()
      ctx.moveTo(40, strikeY)
      ctx.lineTo(40 + originalPriceMetrics.width, strikeY)
      ctx.strokeStyle = options.colorScheme === "dark" ? "#9ca3af" : "#6b7280"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Discount badge
    if (product.discount && product.discount > 0 && options.showBadges) {
      const discountText = `-${product.discount}%`
      ctx.font = "bold 28px Montserrat"
      const discountWidth = 100
      const discountHeight = 40
      const discountX = width - 60 - discountWidth
      const discountY = priceY - 20

      // Draw discount badge
      ctx.fillStyle = options.accentColor || "#FF4D4D"
      if (options.roundedCorners) {
        drawRoundedRect(ctx, discountX, discountY, discountWidth, discountHeight, 20)
      } else {
        ctx.fillRect(discountX, discountY, discountWidth, discountHeight)
      }

      // Draw discount text
      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(discountText, discountX + discountWidth / 2, discountY + discountHeight / 2)
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
    }

    // Free shipping badge
    if (product.freeShipping && options.showBadges) {
      const shippingY = priceY + 40
      ctx.font = "bold 24px Montserrat"
      ctx.fillStyle = "#10B981" // Green color
      ctx.fillText("✓ FRETE GRÁTIS", 40, shippingY)
    }

    // Rating and sales in a clean layout
    if (product.rating) {
      const ratingY = product.freeShipping ? priceY + 90 : priceY + 50

      // Star icon and rating
      ctx.fillStyle = "#FFD700"
      ctx.font = "28px Montserrat"
      ctx.fillText("★", 40, ratingY)

      ctx.fillStyle = options.colorScheme === "dark" ? "#ffffff" : "#1a1a2e"
      ctx.font = "28px Montserrat"
      const ratingText = `${product.rating.toFixed(1)}`
      const ratingMetrics = ctx.measureText(ratingText)
      ctx.fillText(ratingText, 70, ratingY)

      // Sales count
      if (product.sales) {
        ctx.fillStyle = options.colorScheme === "dark" ? "#9ca3af" : "#6b7280"
        ctx.font = "28px Montserrat"
        const salesText = `• ${product.sales.toLocaleString()} vendas`
        ctx.fillText(salesText, 70 + ratingMetrics.width + 10, ratingY)
      }
    }

    // Description with clean styling
    if (product.description) {
      const descriptionY = product.rating
        ? product.freeShipping
          ? priceY + 150
          : priceY + 110
        : product.freeShipping
          ? priceY + 100
          : priceY + 60

      // Description container
      const descContainerWidth = width - 80
      const descContainerHeight = 200

      // Draw description container
      if (options.descriptionStyle === "highlighted") {
        ctx.fillStyle = options.colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
        if (options.roundedCorners) {
          drawRoundedRect(ctx, 40, descriptionY, descContainerWidth, descContainerHeight, 16)
        } else {
          ctx.fillRect(40, descriptionY, descContainerWidth, descContainerHeight)
        }
      }

      // Description text
      ctx.font = "26px Montserrat"
      ctx.fillStyle = options.colorScheme === "dark" ? "#e5e7eb" : "#374151"
      wrapText(ctx, product.description, 60, descriptionY + 30, descContainerWidth - 40, 34, 5)
    }

    // Call to action button with modern styling
    const ctaY = height - 100
    const ctaWidth = width - 80
    const ctaHeight = 70
    const ctaX = 40

    // Button background
    ctx.fillStyle = options.accentColor || "#FF4D4D"
    if (options.roundedCorners) {
      drawRoundedRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, 35)
    } else {
      ctx.fillRect(ctaX, ctaY, ctaWidth, ctaHeight)
    }

    // Button text
    ctx.font = "bold 32px Montserrat"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("COMPRE AGORA • LINK NA BIO", ctaX + ctaWidth / 2, ctaY + ctaHeight / 2)

    // Reset text alignment
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"

    // Return the buffer
    return canvas.toBuffer("image/png")
  } catch (error) {
    logger.error("Error generating minimal card:", error)
    throw error
  }
}

// Export a unified function that selects the appropriate generator
export const generateCard = async (product: Product, styleOptions: Partial<CardStyleOptions> = {}): Promise<Buffer> => {
  const options = { ...defaultStyleOptions, ...styleOptions }

  if (options.template === "minimal") {
    return generateMinimalCard(product, options)
  } else {
    return generateModernCard(product, options)
  }
}
