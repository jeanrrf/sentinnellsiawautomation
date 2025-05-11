import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return a simple text response
    return new NextResponse("Auto download test endpoint is working", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Error in test endpoint:", error)

    // Return a simple error response
    return new NextResponse("Error: " + (error.message || "Unknown error"), {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
