import { type NextRequest, NextResponse } from "next/server"
import { uploadVideoToBlob } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    if (!productId) {
      return NextResponse.json({ success: false, message: "No productId provided" }, { status: 400 })
    }

    // Converter o arquivo para buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Fazer upload para o Blob Storage
    const result = await uploadVideoToBlob(buffer, productId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || "Failed to upload to Blob Storage" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
    })
  } catch (error) {
    console.error("Error in upload-to-blob route:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
