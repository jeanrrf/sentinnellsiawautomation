import { NextResponse } from "next/server"
import { uploadVideo } from "@/lib/blob-storage"

export async function POST(req: Request) {
  try {
    // Verificar se a requisição é multipart/form-data
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file") as File
      const productId = formData.get("productId") as string

      if (!file) {
        return NextResponse.json({ success: false, message: "Nenhum arquivo enviado" }, { status: 400 })
      }

      if (!productId) {
        return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
      }

      // Converter o arquivo para buffer
      const buffer = Buffer.from(await file.arrayBuffer())

      // Fazer upload para o Blob Storage
      const blobUrl = await uploadVideo(buffer, `produto_${productId}_${Date.now()}.mp4`)

      return NextResponse.json({
        success: true,
        message: "Vídeo enviado com sucesso",
        url: blobUrl,
      })
    } else {
      // Se for JSON, esperar um buffer ou base64
      const data = await req.json()
      const { videoBuffer, productId, filename } = data

      if (!videoBuffer) {
        return NextResponse.json({ success: false, message: "Nenhum buffer de vídeo enviado" }, { status: 400 })
      }

      if (!productId) {
        return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
      }

      // Converter string base64 para Buffer se necessário
      const buffer =
        typeof videoBuffer === "string"
          ? Buffer.from(videoBuffer.replace(/^data:video\/\w+;base64,/, ""), "base64")
          : videoBuffer

      // Fazer upload para o Blob Storage
      const blobUrl = await uploadVideo(buffer, filename || `produto_${productId}_${Date.now()}.mp4`)

      return NextResponse.json({
        success: true,
        message: "Vídeo enviado com sucesso",
        url: blobUrl,
      })
    }
  } catch (error: any) {
    console.error("Erro ao fazer upload do vídeo:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao fazer upload do vídeo: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
