export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    // Import JSZip dynamically
    const JSZip = (await import("jszip")).default

    // Create a new ZIP file
    const zip = new JSZip()

    // Determine if we're in Vercel environment
    const isVercel = process.env.VERCEL === "1"
    let schedules = []

    // Get schedules data
    if (isVercel) {
      try {
        // In production, try to use Redis
        const { Redis } = await import("@upstash/redis")
        const redis = Redis.fromEnv()

        const schedulesData = await redis.get("schedules")
        if (schedulesData) {
          if (typeof schedulesData === "string") {
            schedules = JSON.parse(schedulesData)
          } else {
            schedules = Array.isArray(schedulesData) ? schedulesData : [schedulesData]
          }
        }
      } catch (redisError) {
        // If Redis fails, return the error
        return new Response(`Redis error: ${redisError.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        })
      }
    } else {
      // In development, try to use file system
      try {
        const fs = await import("fs")
        const path = await import("path")

        const schedulesPath = path.default.join(process.cwd(), "database", "schedules.json")

        if (fs.default.existsSync(schedulesPath)) {
          const rawData = fs.default.readFileSync(schedulesPath, "utf-8")
          const data = JSON.parse(rawData)
          schedules = data.schedules || []
        }
      } catch (fsError) {
        // If file system fails, return the error
        return new Response(`File system error: ${fsError.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        })
      }
    }

    // Add schedules info to ZIP
    zip.file(
      "schedules-info.json",
      JSON.stringify(
        {
          count: schedules.length,
          timestamp: new Date().toISOString(),
          schedules: schedules.map((s) => ({
            id: s.id,
            name: s.name,
            status: s.status,
            cardsCount: s.generatedCards?.length || 0,
          })),
        },
        null,
        2,
      ),
    )

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Return the ZIP file
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="schedules-info.zip"`,
      },
    })
  } catch (error) {
    console.error("Error in auto-download-schedules:", error)

    return new Response(`Error: ${error.message || "Unknown error"}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
