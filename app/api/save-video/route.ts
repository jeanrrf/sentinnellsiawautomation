import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const { productId, duration } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
    }

    // Generate a unique ID for the video
    const videoId = `video_${Date.now()}_${productId}`

    // In a real implementation, this would capture and save the actual video
    // For now, we'll just save metadata to Redis
    const videoData = {
      id: videoId,
      productId,
      duration: duration || 5,
      createdAt: new Date().toISOString(),
      status: "pending",
    }

    // Save to Redis
    await redis.set(`shopee:video:${videoId}`, JSON.stringify(videoData), {
      ex: 60 * 60 * 24 * 7, // 7 days expiration
    })

    // Add to videos list
    await redis.sadd("shopee:videos", videoId)

    return NextResponse.json({
      success: true,
      message: "Video saved successfully",
      videoId,
    })
  } catch (error: any) {
    console.error("Error saving video:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to save video: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
