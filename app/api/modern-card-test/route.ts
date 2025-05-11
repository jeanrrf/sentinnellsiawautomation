import { type NextRequest, NextResponse } from "next/server"
import { generateCard } from "@/lib/modern-card-generator"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const template = (searchParams.get("template") as "modern" | "minimal") || "modern"
    const colorScheme = (searchParams.get("colorScheme") as "dark" | "light" | "gradient") || "dark"
    const accentColor = searchParams.get("accentColor") || "#FF4D4D"
    const showBadges = searchParams.get("showBadges") !== "false"
    const descriptionStyle = (searchParams.get("descriptionStyle") as "clean" | "highlighted") || "clean"
    const roundedCorners = searchParams.get("roundedCorners") !== "false"

    // Sample product data based on the image provided
    const product = {
      id: "123456",
      name: "Boca Rosa Base Líquida Matte Perfect By Payot",
      price: 22.6,
      originalPrice: 70.63,
      discount: 68,
      imageUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tiktok_Boca_Rosa_Base_L_quida_Matte_P_2025-05-11T09-07-10-055Z_1-WgA93RhK2LibYRIv30IjpynOtC8WeB.png", // Using the provided image URL
      description:
        "💄 Boca Rosa por SÓ R$22! 😱 Matte perfeita, pele de milhões! ✨ 68% OFF + 9mil vendidas! 💝 Corre pra S&M Sambashop e garante a sua! #shopee #oferta #desconto",
      rating: 4.8,
      sales: 9225,
      freeShipping: true,
    }

    // Generate the card with the specified options
    const cardBuffer = await generateCard(product, {
      template,
      colorScheme,
      accentColor,
      showBadges,
      descriptionStyle,
      roundedCorners,
    })

    // Return the image
    return new NextResponse(cardBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    logger.error("Error generating modern card:", error)
    return NextResponse.json({ error: "Failed to generate card" }, { status: 500 })
  }
}
