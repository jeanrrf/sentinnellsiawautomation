import { NextResponse } from "next/server"
import { getAdvancedLogger } from "@/lib/advanced-logging/advanced-logger"

export async function POST() {
  try {
    const advancedLogger = getAdvancedLogger()
    advancedLogger.clearAggregatedErrors()

    return NextResponse.json({
      success: true,
      message: "Errors cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing aggregated errors:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear errors",
      },
      { status: 500 },
    )
  }
}
