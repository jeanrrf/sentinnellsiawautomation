import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Collect environment information
    const envInfo = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === "1",
      memoryUsage: process.memoryUsage(),
    }

    // Test basic functionality
    const testResults = {
      json: { test: "JSON works" },
      string: "String works",
      number: 12345,
      boolean: true,
      date: new Date().toISOString(),
    }

    // Return debug information
    return NextResponse.json({
      success: true,
      message: "Debug endpoint is working",
      environment: envInfo,
      tests: testResults,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error in debug endpoint",
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      { status: 500 },
    )
  }
}
