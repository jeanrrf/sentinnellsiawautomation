import { NextResponse } from "next/server"
import { publishVideo } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const { productId } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
    }

    // Publicar o vídeo
    await publishVideo(productId)

    return NextResponse.json({
      success: true,
      message: "Vídeo publicado com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao publicar vídeo:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao publicar vídeo: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
