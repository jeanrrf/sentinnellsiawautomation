export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({
    message: "This is a test JSON response",
    timestamp: Date.now(),
  })
}
