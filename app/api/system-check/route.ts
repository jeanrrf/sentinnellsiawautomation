import { NextResponse } from "next/server"

export async function GET() {
  try {
    // System check response
    const systemCheck = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        storage: true,
        redis: false, // Redis is not available
        blob: false, // Blob storage is not available
      },
      message: "Sistema funcionando sem cache ou armazenamento persistente",
    }

    return NextResponse.json(systemCheck)
  } catch (error) {
    console.error("Error checking system:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check system",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
