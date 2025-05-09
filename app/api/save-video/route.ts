import { NextResponse } from "next/server"
import { saveVideo } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { productId, duration } = data

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
    }

    // Buscar informações do produto
    const productResponse = await fetch(new URL("/api/products", req.url).toString())
    if (!productResponse.ok) {
      throw new Error(`Falha ao buscar produtos: ${productResponse.status}`)
    }

    const productsData = await productResponse.json()
    const product = productsData.products.find((p: any) => p.itemId === productId)

    if (!product) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 })
    }

    // Gerar timestamp único para o vídeo
    const timestamp = Date.now()

    // Criar dados do vídeo
    const videoData = {
      id: `video_${timestamp}`,
      productId,
      productName: product.productName,
      imageUrl: product.imageUrl,
      price: product.price,
      duration: duration || 5,
      createdAt: new Date().toISOString(),
      status: "generated", // generated, published, failed
      videoUrl: `/api/preview/${productId}?style=portrait&t=${timestamp}`, // URL para visualização do vídeo
    }

    // Salvar vídeo no Redis
    await saveVideo(videoData)

    return NextResponse.json({
      success: true,
      message: "Vídeo salvo com sucesso",
      video: videoData,
    })
  } catch (error: any) {
    console.error("Erro ao salvar vídeo:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao salvar vídeo: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
