import { NextResponse } from "next/server"
import fs from "fs"
import { renderHtmlToImage } from "@/lib/puppeteer-renderer"
import { convertImageToVideo, optimizeVideoForSocialMedia } from "@/lib/ffmpeg-converter"
import { getCachedProduct, createCacheEntry, getCacheEntry } from "@/lib/redis"
import path from "path"

// Fallback description generator
function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  // Criar uma descrição curta e direta
  const urgency = sales > 1000 ? "🔥 OFERTA IMPERDÍVEL!" : "⚡ PROMOÇÃO!"
  const rating = "⭐".repeat(Math.min(Math.round(stars), 5))

  // Limitar o nome do produto a 30 caracteres
  const shortName = product.productName.length > 30 ? product.productName.substring(0, 30) + "..." : product.productName

  return `${urgency}\n${shortName}\n${rating}\nApenas R$${price.toFixed(2)}\nJá vendidos: ${sales}\n#oferta #shopee`
}

// Definir o timeout máximo para 60 segundos (máximo da Vercel)
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Extrair parâmetros do corpo da requisição
    const {
      productId,
      duration = 10,
      style = "portrait",
      quality = "medium",
      withAudio = false,
      optimize = true,
      fps = 30,
    } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
    }

    console.log(`Gerando vídeo para o produto ${productId}:`)
    console.log(`- Duração: ${duration}s`)
    console.log(`- Estilo: ${style}`)
    console.log(`- Qualidade: ${quality}`)
    console.log(`- Com áudio: ${withAudio}`)
    console.log(`- Otimizar: ${optimize}`)
    console.log(`- FPS: ${fps}`)

    // Criar chave de cache única baseada em todos os parâmetros
    const cacheKey = `video:${productId}:${style}:${duration}:${quality}:${withAudio}:${optimize}:${fps}`

    // Verificar se já temos um vídeo gerado para estes parâmetros
    const cachedVideo = await getCacheEntry(cacheKey)

    if (cachedVideo && cachedVideo.videoPath && fs.existsSync(cachedVideo.videoPath)) {
      console.log(`Vídeo encontrado em cache: ${cachedVideo.videoPath}`)

      // Ler o arquivo de vídeo
      const videoBuffer = fs.readFileSync(cachedVideo.videoPath)

      // Retornar o vídeo como resposta
      return new NextResponse(videoBuffer, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="product-${productId}.mp4"`,
        },
      })
    }

    // Buscar dados do produto no Redis
    const productData = await getCachedProduct(productId)

    if (!productData) {
      return NextResponse.json({ success: false, message: "Produto não encontrado no cache" }, { status: 404 })
    }

    // Verificar se já temos o HTML do template
    let htmlTemplate = productData.htmlTemplate

    if (!htmlTemplate) {
      console.log("Template HTML not found, generating one...")
      try {
        // Get description from cache or generate a fallback
        let description = null
        try {
          const { getCachedDescription } = await import("@/lib/redis")
          description = await getCachedDescription(productId)
        } catch (error) {
          console.error("Error getting cached description:", error)
        }

        // If no description, create a fallback
        if (!description) {
          const { createFallbackDescription } = await import("@/lib/utils")
          description = createFallbackDescription(productData)
          console.log("Using fallback description for product:", productId)
        }

        // Import the template renderer
        const { renderProductCardTemplate } = await import("@/lib/template-renderer")

        // Generate the HTML template
        htmlTemplate = renderProductCardTemplate(productData, description, style)

        // Update the product data with the template
        productData.htmlTemplate = htmlTemplate

        // Save the updated product data back to Redis
        await createCacheEntry(`product:${productId}`, productData, 60 * 60 * 24) // 24 hours TTL

        console.log("Generated and cached HTML template for product:", productId)
      } catch (templateError) {
        console.error("Error generating HTML template:", templateError)
        return NextResponse.json(
          { success: false, message: `Error generating HTML template: ${templateError.message}` },
          { status: 500 },
        )
      }
    }

    console.log("Template HTML encontrado, iniciando renderização...")

    // Configurar dimensões com base no estilo
    let width = 1080
    let height = 1920

    if (style === "square") {
      width = 1080
      height = 1080
    } else if (style === "landscape") {
      width = 1920
      height = 1080
    }

    // Renderizar o HTML como imagem usando Puppeteer
    const { imagePath, htmlPath } = await renderHtmlToImage(htmlTemplate, { width, height })

    console.log("Imagem renderizada, iniciando conversão para vídeo...")

    // Converter a imagem em vídeo usando FFmpeg
    let videoPath = await convertImageToVideo(imagePath, {
      duration: Number(duration),
      fadeIn: 0.5,
      fadeOut: 0.5,
      audioPath: withAudio ? path.join(process.cwd(), "public", "audio", "background.mp3") : null,
      resolution: style as any,
      quality: quality as any,
      fps,
    })

    // Se solicitado, otimizar o vídeo para redes sociais
    if (optimize) {
      console.log("Otimizando vídeo para redes sociais...")
      videoPath = await optimizeVideoForSocialMedia(videoPath)
    }

    console.log("Vídeo gerado com sucesso, preparando resposta...")

    // Salvar o caminho do vídeo no cache
    await createCacheEntry(cacheKey, { videoPath }, 60 * 60 * 24) // 24 horas de TTL

    // Ler o arquivo de vídeo
    const videoBuffer = fs.readFileSync(videoPath)

    // Não vamos limpar os arquivos temporários agora para permitir o cache
    // Mas podemos implementar uma função de limpeza periódica em outro endpoint

    // Retornar o vídeo como resposta
    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="product-${productId}.mp4"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar vídeo:", error)
    return NextResponse.json({ success: false, message: `Erro ao gerar vídeo: ${error.message}` }, { status: 500 })
  }
}
