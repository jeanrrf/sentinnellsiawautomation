import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === "1"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    // In Vercel, we can't serve files from the filesystem
    if (isVercel) {
      // Return a mock response or redirect to a placeholder video
      return NextResponse.json({
        success: false,
        message: "Video serving is not available in the deployed environment",
        note: "This feature requires a server with file system access and is only available in local development.",
      })
    }

    const videoPath = path.join(process.cwd(), "output", `video_${productId}.mp4`)

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ success: false, message: "Video not found" }, { status: 404 })
    }

    const videoBuffer = fs.readFileSync(videoPath)

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `inline; filename="shopee_product_${productId}.mp4"`,
      },
    })
  } catch (error) {
    console.error("Error serving video:", error)
    return NextResponse.json({ success: false, message: "Failed to serve video" }, { status: 500 })
  }
}
