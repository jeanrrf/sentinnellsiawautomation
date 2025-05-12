import { NextResponse } from "next/server"
import os from "os"

export async function GET() {
  try {
    // Get system information
    const platform = os.platform()
    const nodeVersion = process.version
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()

    // Get uptime in seconds
    const uptime = process.uptime()

    // Mock data for services
    const apiStatus = "healthy"
    const storageStatus = "healthy"

    // Create response object
    const systemStatus = {
      healthy: true,
      services: {
        api: {
          status: apiStatus,
          uptime: Math.floor(uptime),
        },
        storage: {
          status: storageStatus,
          type: "local",
          note: "Usando armazenamento local (não persistente)",
        },
      },
      system: {
        platform,
        nodeVersion,
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: totalMemory - freeMemory,
          percentage: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
        },
      },
      lastScheduledRun: new Date(Date.now() - 86400000).toISOString(),
      pendingJobs: 0,
      completedJobs: 0,
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error("Error getting system status:", error)
    return NextResponse.json({ error: "Failed to get system status" }, { status: 500 })
  }
}
