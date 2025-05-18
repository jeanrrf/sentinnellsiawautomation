import { NextResponse } from "next/server"

export async function GET() {
  // Informações básicas do plano
  const planInfo = {
    name: "Plano Básico",
    features: ["Geração de vídeos", "Busca de produtos", "Exportação de vídeos", "Armazenamento de 30 dias"],
    limits: {
      videosPerMonth: 50,
      maxDuration: 60, // segundos
      storage: "1GB",
    },
    status: "active",
  }

  return NextResponse.json(planInfo)
}
