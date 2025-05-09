import { NextResponse } from "next/server"

export async function GET() {
  // Esta API não é mais necessária, pois não queremos dados mock
  return NextResponse.json(
    {
      success: false,
      message: "Sample data is disabled in production mode",
    },
    { status: 403 },
  )
}
