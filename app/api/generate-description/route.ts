import { NextResponse } from "next/server"
import { getCachedDescription, cacheDescription } from "@/lib/redis"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

export async function POST(req: Request) {
  try {
    const { product } = await req.json()

    if (!product) {
      return NextResponse.json({ success: false, message: "Product data is required" }, { status: 400 })
    }

    // Check if description is already cached
    const cachedDescription = await getCachedDescription(product.itemId)
    if (cachedDescription) {
      console.log(`Using cached description for product ${product.itemId}`)
      return NextResponse.json({
        success: true,
        description: cachedDescription,
        source: "cache",
      })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ success: false, message: "Gemini API key is not configured" }, { status: 500 })
    }

    const prompt = `
      You are an elite copywriter, specialized in viral digital marketing and persuasion, focused on creating desire and urgency for products on platforms like TikTok and Instagram Reels.
      Your mission is to transform the information about this product into a short (maximum 200 characters), irresistible, highly creative copy that maximizes clicks and conversions. Think like a sales champion.

      PRODUCT PROVIDED:
      - Name: ${product.productName}
      - Price: R$ ${product.price}
      - Rating (Stars): ${product.ratingStar || "N/A"} ⭐
      - Units Sold: ${product.sales}
      - Shop Name: ${product.shopName}

      CRITICAL GUIDELINES FOR A PERFECT COPY:
      1. Immediate Impact (Headline): Start with an ultra-catchy phrase that instantly grabs attention.
      2. Desire and Central Benefit: Describe the product in a vibrant way, focusing on the main benefit.
      3. Integrated Social Proof: Mention popularity (sales, rating).
      4. Irresistible Offer (Price): Present the price as a unique opportunity.
      5. Magnetic Call to Action (CTA): Use a clear, direct CTA with a sense of urgency.
      6. Strategic Emojis: Use 4-5 emojis that reinforce the message.
      7. Relevant Hashtags: Include 3-4 short, popular, and niche-specific hashtags.
      8. Tone of Voice: Young, authentic, energetic, confident, fun, and slightly informal.
      9. Strict Limit: MAXIMUM of 200 characters.
      10. Originality: Avoid worn-out clichés.

      Respond ONLY with the product description, without any additional comments before or after.
    `

    // Direct API call to Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Gemini API error:", errorData)

      // Create a fallback description if the API fails
      const fallbackDescription = createFallbackDescription(product)

      // Cache the fallback description
      await cacheDescription(product.itemId, fallbackDescription)

      return NextResponse.json({
        success: true,
        description: fallbackDescription,
        note: "Used fallback description due to API error",
        source: "fallback",
      })
    }

    const data = await response.json()

    // Extract the generated text from the response
    let generatedText = ""
    if (data.candidates && data.candidates.length > 0) {
      const content = data.candidates[0].content
      if (content && content.parts && content.parts.length > 0) {
        generatedText = content.parts[0].text
      }
    }

    if (!generatedText) {
      // If no text was generated, use fallback
      const fallbackDescription = createFallbackDescription(product)

      // Cache the fallback description
      await cacheDescription(product.itemId, fallbackDescription)

      return NextResponse.json({
        success: true,
        description: fallbackDescription,
        note: "Used fallback description due to empty API response",
        source: "fallback",
      })
    }

    // Cache the generated description
    await cacheDescription(product.itemId, generatedText.trim())

    return NextResponse.json({
      success: true,
      description: generatedText.trim(),
      source: "api",
    })
  } catch (error) {
    console.error("Error generating description:", error)

    // If there's an error, create a fallback description
    try {
      const { product } = await req.json()
      const fallbackDescription = createFallbackDescription(product)

      // Cache the fallback description
      await cacheDescription(product.itemId, fallbackDescription)

      return NextResponse.json({
        success: true,
        description: fallbackDescription,
        note: "Used fallback description due to error",
        source: "fallback",
      })
    } catch (e) {
      return NextResponse.json({ success: false, message: "Failed to generate description" }, { status: 500 })
    }
  }
}

// Fallback description generator
function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  const urgency = sales > 1000 ? "🔥 MEGA OFERTA!" : "⚡ OFERTA ESPECIAL!"
  const rating = "⭐".repeat(Math.round(stars))
  const popularity = sales > 5000 ? "PRODUTO VIRAL! 🚀" : sales > 1000 ? "SUPER POPULAR! 📈" : "QUERIDINHO! 💎"

  return `${urgency} ${popularity}\n${rating}\n${product.productName.substring(0, 50)}${product.productName.length > 50 ? "..." : ""}\n💰 Apenas R$${price.toFixed(2)}\n🛍️ Já vendidos: ${sales}\n#oferta #shopee #desconto`
}
