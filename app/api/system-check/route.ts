import { NextResponse } from "next/server"
import { checkRequiredEnvVars } from "@/lib/environment"

export async function GET() {
  const envStatus = checkRequiredEnvVars()

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      envVarsComplete: envStatus,
    },
    message: envStatus
      ? "Sistema operacional com todas as variáveis de ambiente necessárias"
      : "Sistema operacional com variáveis de ambiente ausentes",
  })
}
