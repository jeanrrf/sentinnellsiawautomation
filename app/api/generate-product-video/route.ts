import { NextResponse } from "next/server"
import fs from "fs"
import { renderHtmlToImage } from "@/lib/puppeteer-renderer"
import { convertImageToVideo } from "@/lib/ffmpeg-converter"
import { getCachedProduct, createCacheEntry, getCacheEntry } from "@/lib/redis"

// Definir o timeout máximo para 60 segundos (máximo da Vercel)
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Extrair o ID do produto do corpo da requisição
    const { productId, duration = 10, style = "portrait" } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
    }

    console.log(`Gerando vídeo para o produto ${productId} com duração de ${duration}s e estilo ${style}`)

    // Verificar se já temos um vídeo gerado para este produto
    const cacheKey = `video:${productId}:${style}:${duration}`
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
    const htmlTemplate = productData.htmlTemplate

    if (!htmlTemplate) {
      return NextResponse.json(
        { success: false, message: "Template HTML não encontrado para este produto" },
        { status: 404 },
      )
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
    const videoPath = await convertImageToVideo(imagePath, {
      duration: Number(duration),
      fadeIn: 0.5,
      fadeOut: 0.5,
      audioPath: null, // Sem áudio por enquanto
    })

    console.log("Vídeo gerado com sucesso, preparando resposta...")

    // Salvar o caminho do vídeo no cache
    await createCacheEntry(cacheKey, { videoPath })

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
