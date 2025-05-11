export const dynamic = "force-dynamic"

export async function GET() {
  // Create a simple text file content
  const content = "This is a test file content.\nLine 2\nLine 3"

  // Convert to buffer
  const buffer = Buffer.from(content, "utf-8")

  // Return as downloadable file
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": 'attachment; filename="test-file.txt"',
    },
  })
}
