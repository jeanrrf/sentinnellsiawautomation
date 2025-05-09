import { NextResponse } from "next/server"
import { isIdProcessed, addProcessedId } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const { productId } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
    }

    // Check if the ID has already been processed
    const processed = await isIdProcessed(productId)

    if (processed) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: "This product has already been processed",
      })
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: "Product ID is valid for processing",
    })
  } catch (error) {
    console.error("Error validating product ID:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to validate product ID",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { productId } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
    }

    // Mark the ID as processed
    await addProcessedId(productId)

    return NextResponse.json({
      success: true,
      message: "Product ID marked as processed",
    })
  } catch (error) {
    console.error("Error marking product ID as processed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark product ID as processed",
      },
      { status: 500 },
    )
  }
}
