import { NextResponse } from "next/server"
import { cleanupCache } from "@/lib/redis"

export async function POST() {
  try {
    await cleanupCache()

    return NextResponse.json({
      success: true,
      message: "Cache cleanup completed",
    })
  } catch (error) {
    console.error("Error cleaning up cache:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clean up cache",
      },
      { status: 500 },
    )
  }
}
