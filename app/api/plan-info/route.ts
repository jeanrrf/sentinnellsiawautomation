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

  // Adicionando cabeçalhos de segurança e cache
  return NextResponse.json(planInfo, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
