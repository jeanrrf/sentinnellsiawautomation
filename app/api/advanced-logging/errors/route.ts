import { NextResponse } from "next/server"
import { getAdvancedLogger } from "@/lib/advanced-logging/advanced-logger"

export async function GET() {
  try {
    const advancedLogger = getAdvancedLogger()
    const errors = advancedLogger.getAggregatedErrors()

    return NextResponse.json({
      success: true,
      errors,
    })
  } catch (error) {
    console.error("Error fetching aggregated errors:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch errors",
      },
      { status: 500 },
    )
  }
}
