import { type NextRequest, NextResponse } from "next/server"
import { ImageResponse } from "@vercel/og"
import { logger } from "@/lib/logger"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const template = (searchParams.get("template") as "modern" | "minimal") || "modern"
    const colorScheme = (searchParams.get("colorScheme") as "dark" | "light" | "gradient") || "dark"
    const accentColor = searchParams.get("accentColor") || "#FF4D4D"
    const showBadges = searchParams.get("showBadges") !== "false"
    const descriptionStyle = (searchParams.get("descriptionStyle") as "clean" | "highlighted") || "clean"
    const roundedCorners = searchParams.get("roundedCorners") !== "false"

    // Get product data from query params
    const productId = searchParams.get("productId") || "123456"
    const productName = searchParams.get("productName") || "Produto de exemplo"
    const productPrice = Number.parseFloat(searchParams.get("productPrice") || "0")
    const productOriginalPrice = searchParams.get("productOriginalPrice")
      ? Number.parseFloat(searchParams.get("productOriginalPrice") || "0")
      : undefined
    const productDiscount = searchParams.get("productDiscount")
      ? Number.parseInt(searchParams.get("productDiscount") || "0")
      : undefined
    const productImageUrl = searchParams.get("productImageUrl") || ""
    const productDescription = searchParams.get("productDescription") || ""
    const productRating = searchParams.get("productRating")
      ? Number.parseFloat(searchParams.get("productRating") || "0")
      : undefined
    const productSales = searchParams.get("productSales")
      ? Number.parseInt(searchParams.get("productSales") || "0")
      : undefined
    const productFreeShipping = searchParams.get("productFreeShipping") === "true"

    // If no product data is provided, use sample data
    if (!productName || productPrice === 0 || !productImageUrl) {
      // Sample product data
      const product = {
        id: "123456",
        name: "Boca Rosa Base Líquida Matte Perfect By Payot",
        price: 22.6,
        originalPrice: 70.63,
        discount: 68,
        imageUrl:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tiktok_Boca_Rosa_Base_L_quida_Matte_P_2025-05-11T09-07-10-055Z_1-WgA93RhK2LibYRIv30IjpynOtC8WeB.png",
        description:
          "💄 Boca Rosa por SÓ R$22! 😱 Matte perfeita, pele de milhões! ✨ 68% OFF + 9mil vendidas! 💝 Corre pra S&M Sambashop e garante a sua! #shopee #oferta #desconto",
        rating: 4.8,
        sales: 9225,
        freeShipping: true,
      }
    }

    // Format price
    const formatPrice = (price: number): string => {
      return `R$ ${price.toFixed(2).replace(".", ",")}`
    }

    // Background color based on color scheme
    let backgroundColor = "#1a1a2e"
    if (colorScheme === "light") {
      backgroundColor = "#f8f9fa"
    } else if (colorScheme === "gradient") {
      backgroundColor = "#f8f9fa" // Simplified for ImageResponse
    }

    // Text color based on color scheme
    const textColor = colorScheme === "dark" ? "#ffffff" : "#1a1a2e"
    const secondaryTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280"

    // Generate the card using @vercel/og
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "800px",
          height: "1200px",
          backgroundColor,
          padding: "40px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Product Image */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "500px",
            backgroundColor: "#ffffff",
            borderRadius: roundedCorners ? "20px" : "0px",
            marginBottom: "40px",
            overflow: "hidden",
          }}
        >
          <img
            src={productImageUrl || "/placeholder.svg"}
            alt={productName}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Badges */}
        {showBadges && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            {productDiscount && productDiscount > 0 && (
              <div
                style={{
                  backgroundColor: accentColor,
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: roundedCorners ? "20px" : "0px",
                  fontWeight: "bold",
                  fontSize: "24px",
                }}
              >
                -{productDiscount}%
              </div>
            )}
            {productFreeShipping && (
              <div
                style={{
                  backgroundColor: "#10B981",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: roundedCorners ? "20px" : "0px",
                  fontWeight: "bold",
                  fontSize: "24px",
                }}
              >
                FRETE GRÁTIS
              </div>
            )}
          </div>
        )}

        {/* Product Name */}
        <div
          style={{
            color: textColor,
            fontSize: "36px",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          {productName}
        </div>

        {/* Price Section */}
        <div style={{ marginBottom: "30px" }}>
          {productOriginalPrice && productOriginalPrice > productPrice && (
            <div
              style={{
                color: secondaryTextColor,
                fontSize: "28px",
                textDecoration: "line-through",
                marginBottom: "10px",
              }}
            >
              {formatPrice(productOriginalPrice)}
            </div>
          )}
          <div
            style={{
              color: accentColor,
              fontSize: "48px",
              fontWeight: "bold",
            }}
          >
            {formatPrice(productPrice)}
          </div>
        </div>

        {/* Rating and Sales */}
        {productRating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div style={{ color: "#FFD700", fontSize: "28px", marginRight: "10px" }}>★</div>
            <div style={{ color: textColor, fontSize: "28px", marginRight: "10px" }}>{productRating.toFixed(1)}</div>
            {productSales && (
              <div style={{ color: secondaryTextColor, fontSize: "28px" }}>
                • {productSales.toLocaleString()} vendas
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {productDescription && (
          <div
            style={{
              backgroundColor:
                descriptionStyle === "highlighted"
                  ? colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)"
                  : "transparent",
              padding: "20px",
              borderRadius: roundedCorners ? "20px" : "0px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                color: colorScheme === "dark" ? "#e5e7eb" : "#374151",
                fontSize: "24px",
              }}
            >
              {productDescription}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div
          style={{
            backgroundColor: accentColor,
            color: "#ffffff",
            padding: "20px",
            borderRadius: roundedCorners ? "35px" : "0px",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "28px",
            marginTop: "auto",
          }}
        >
          COMPRE AGORA • LINK NA BIO
        </div>
      </div>,
      {
        width: 800,
        height: 1200,
      },
    )
  } catch (error) {
    logger.error("Error generating modern card:", error)
    return NextResponse.json({ error: "Failed to generate card" }, { status: 500 })
  }
}
