export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    // Create a simple text content
    const content = "This is a test file content.\nLine 2\nLine 3"

    // Return as downloadable file
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="test-file.txt"',
      },
    })
  } catch (error) {
    console.error("Error in auto-download-zip:", error)

    return new Response(`Error: ${error.message || "Unknown error"}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
