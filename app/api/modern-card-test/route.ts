import { type NextRequest, NextResponse } from "next/server"
import { ImageResponse } from "@vercel/og"
import { createLogger } from "@/lib/logger"

const logger = createLogger("modern-card-test-api")

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract product data from query parameters
    const productName = searchParams.get("productName") || "Product Name"
    const productPrice = Number.parseFloat(searchParams.get("productPrice") || "99.99")
    const productOriginalPrice = searchParams.get("productOriginalPrice")
      ? Number.parseFloat(searchParams.get("productOriginalPrice") || "0")
      : null
    const productDiscount = searchParams.get("productDiscount")
      ? Number.parseInt(searchParams.get("productDiscount") || "0")
      : null
    const productImageUrl = searchParams.get("productImageUrl") || "https://via.placeholder.com/500"
    const productDescription = searchParams.get("productDescription") || "Product description goes here."
    const productRating = searchParams.get("productRating")
      ? Number.parseFloat(searchParams.get("productRating") || "0")
      : 4.5
    const productSales = searchParams.get("productSales")
      ? Number.parseInt(searchParams.get("productSales") || "0")
      : 1000

    // Extract style options from query parameters
    const template = searchParams.get("template") || "modern"
    const colorScheme = searchParams.get("colorScheme") || "dark"
    const accentColor = searchParams.get("accentColor") || "#FF4D4D"
    const showBadges = searchParams.get("showBadges") !== "false"
    const descriptionStyle = searchParams.get("descriptionStyle") || "clean"
    const roundedCorners = searchParams.get("roundedCorners") !== "false"

    // Generate HTML for the card
    const cardHtml = generateCardHtml(
      {
        name: productName,
        price: productPrice,
        originalPrice: productOriginalPrice,
        discount: productDiscount,
        imageUrl: productImageUrl,
        description: productDescription,
        rating: productRating,
        sales: productSales,
      },
      {
        template,
        colorScheme,
        accentColor,
        showBadges,
        descriptionStyle,
        roundedCorners,
      },
    )

    // Generate image response
    const imageResponse = new ImageResponse(cardHtml, {
      width: 800,
      height: 1200,
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    })

    return imageResponse
  } catch (error: any) {
    logger.error("Error generating modern card:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Function to generate card HTML
function generateCardHtml(product: any, style: any) {
  const { name, price, originalPrice, discount, imageUrl, description, rating, sales } = product

  const { template, colorScheme, accentColor, showBadges, descriptionStyle, roundedCorners } = style

  const hasDiscount = originalPrice && originalPrice > price

  // Use string template instead of JSX to avoid syntax errors
  return `
    <div style="display:flex;flex-direction:column;width:100%;height:100%;background-color:${colorScheme === "dark" ? "#1a1a2e" : "#f8f9fa"};color:${colorScheme === "dark" ? "#ffffff" : "#1a1a2e"};font-family:sans-serif;position:relative;">
      <div style="display:flex;justify-content:center;align-items:center;width:100%;height:50%;overflow:hidden;position:relative;background-color:#ffffff;${roundedCorners ? "border-radius:20px;" : ""}margin:40px 40px 0 40px;width:calc(100% - 80px);">
        <img src="${imageUrl}" alt="${name}" style="width:100%;height:100%;object-fit:contain;" />
        ${hasDiscount && showBadges ? `<div style="position:absolute;top:20px;right:20px;background-color:${accentColor};color:white;padding:8px 16px;border-radius:20px;font-weight:bold;font-size:18px;">-${Math.round(((originalPrice - price) / originalPrice) * 100)}%</div>` : ""}
      </div>
      <div style="padding:20px 40px;display:flex;flex-direction:column;gap:16px;flex:1;">
        <h1 style="font-size:24px;font-weight:bold;margin:0;line-height:1.2;">${name}</h1>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:32px;font-weight:bold;color:${accentColor};">R$ ${price.toFixed(2).replace(".", ",")}</span>
          ${hasDiscount ? `<span style="font-size:18px;text-decoration:line-through;color:${colorScheme === "dark" ? "#9ca3af" : "#6b7280"};">R$ ${originalPrice.toFixed(2).replace(".", ",")}</span>` : ""}
        </div>
        ${
          rating
            ? `
        <div style="display:flex;align-items:center;gap:8px;font-size:16px;">
          <span style="color:#FFD700;">★</span>
          <span>${rating.toFixed(1)}</span>
          ${sales ? `<span>•</span><span>${sales.toLocaleString()} vendas</span>` : ""}
        </div>
        `
            : ""
        }
        ${
          description
            ? `
        <div style="margin:10px 0;font-size:16px;line-height:1.5;color:${colorScheme === "dark" ? "#e5e7eb" : "#374151"};${descriptionStyle === "highlighted" ? `background-color:${colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"};padding:15px;${roundedCorners ? "border-radius:10px;" : ""}` : ""}">
          ${description}
        </div>
        `
            : ""
        }
        <div style="margin-top:auto;background-color:${accentColor};padding:16px;${roundedCorners ? "border-radius:35px;" : ""}text-align:center;font-size:18px;font-weight:bold;color:white;">
          COMPRE AGORA • LINK NA BIO
        </div>
      </div>
    </div>
  `
}

// Interface for product data
interface Product {
  name: string
  price: number
  originalPrice?: number | null
  discount?: number | null
  imageUrl: string
  description?: string
  rating?: number
  sales?: number
}

// Interface for style options
interface StyleOptions {
  template: string
  colorScheme: string
  accentColor: string
  showBadges: boolean
  descriptionStyle: string
  roundedCorners: boolean
}
