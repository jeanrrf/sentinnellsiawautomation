export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request) {
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

    // Filter schedules with cards
    const schedulesWithCards = schedules.filter(
      (schedule) =>
        schedule &&
        schedule.generatedCards &&
        Array.isArray(schedule.generatedCards) &&
        schedule.generatedCards.length > 0,
    )

    if (schedulesWithCards.length === 0) {
      return new Response("No cards found to download", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    }

    // Get URL parameters
    const url = new URL(request.url)
    const mode = url.searchParams.get("mode") || "latest"

    // Determine which cards to download
    let cardsToDownload = []
    if (mode === "all") {
      cardsToDownload = schedulesWithCards.flatMap((schedule) => schedule.generatedCards)
    } else {
      cardsToDownload = schedulesWithCards.map((schedule) => schedule.generatedCards[0])
    }

    // Filter valid cards
    cardsToDownload = cardsToDownload.filter((card) => card && typeof card === "string")

    if (cardsToDownload.length === 0) {
      return new Response("No valid card paths found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    }

    // If only one card, redirect to it
    if (cardsToDownload.length === 1) {
      const cardPath = cardsToDownload[0]

      if (cardPath.startsWith("http")) {
        return Response.redirect(cardPath)
      } else {
        return Response.redirect(`/api/download-card?path=${encodeURIComponent(cardPath)}`)
      }
    }

    // Add a text file with card information
    zip.file(
      "cards-info.txt",
      `Cards export\n` +
        `Generated: ${new Date().toISOString()}\n` +
        `Total cards: ${cardsToDownload.length}\n\n` +
        cardsToDownload.map((card, i) => `${i + 1}. ${card}`).join("\n"),
    )

    // Try to add actual card files to the ZIP
    for (let i = 0; i < cardsToDownload.length; i++) {
      try {
        const cardPath = cardsToDownload[i]
        let cardData

        if (cardPath.startsWith("http")) {
          // Download from URL
          const response = await fetch(cardPath)
          if (!response.ok) continue

          const arrayBuffer = await response.arrayBuffer()
          cardData = Buffer.from(arrayBuffer)
        } else {
          // Read from file system (only in development)
          if (!isVercel) {
            const fs = await import("fs")
            const path = await import("path")

            const fullPath = cardPath.startsWith("/") ? cardPath : path.default.join(process.cwd(), cardPath)

            if (!fs.default.existsSync(fullPath)) continue

            cardData = fs.default.readFileSync(fullPath)
          } else {
            // Skip file system reads in production
            continue
          }
        }

        // Extract filename from path
        const fileName = cardPath.split("/").pop() || `card-${i + 1}.png`

        // Add to ZIP
        zip.file(fileName, cardData)
      } catch (cardError) {
        // Skip this card if there's an error
        console.error(`Error processing card ${i}:`, cardError)
      }
    }

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Return the ZIP file
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="cards-export.zip"`,
      },
    })
  } catch (error) {
    console.error("Error in auto-download-final:", error)

    return new Response(`Error: ${error.message || "Unknown error"}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
