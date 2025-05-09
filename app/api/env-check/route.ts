import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables without exposing their values
    const envStatus = {
      SHOPEE_APP_ID: !!process.env.SHOPEE_APP_ID,
      SHOPEE_APP_SECRET: !!process.env.SHOPEE_APP_SECRET,
      SHOPEE_AFFILIATE_API_URL: !!process.env.SHOPEE_AFFILIATE_API_URL,
      SHOPEE_REDIRECT_URL: !!process.env.SHOPEE_REDIRECT_URL,
      TOKEN_ENCRYPTION_KEY: !!process.env.TOKEN_ENCRYPTION_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    }

    return NextResponse.json(envStatus)
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check environment variables",
      },
      { status: 500 },
    )
  }
}
