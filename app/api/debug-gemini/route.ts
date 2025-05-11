import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const logger = createLogger("debug-gemini-api")

export async function GET(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "GEMINI_API_KEY não configurada",
      },
      { status: 500 },
    )
  }

  // Testar diferentes endpoints e versões da API
  const endpoints = [
    {
      version: "v1beta",
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    },
    {
      version: "v1",
      url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
    },
    {
      version: "v1beta (list models)",
      url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    },
  ]

  const results = []

  for (const endpoint of endpoints) {
    try {
      logger.info(`Testing Gemini API endpoint: ${endpoint.version}`)

      let response

      if (endpoint.version.includes("list models")) {
        // Para listar modelos, usamos GET
        response = await fetch(endpoint.url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      } else {
        // Para generateContent, usamos POST com um prompt simples
        response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Hello, write a short greeting in 10 words or less.",
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 50,
            },
          }),
        })
      }

      const statusText = response.statusText
      const status = response.status

      let data
      try {
        data = await response.json()
      } catch (e) {
        data = { error: "Não foi possível analisar a resposta como JSON" }
      }

      results.push({
        endpoint: endpoint.version,
        status,
        statusText,
        success: response.ok,
        data: data,
      })
    } catch (error: any) {
      results.push({
        endpoint: endpoint.version,
        success: false,
        error: error.message,
      })
    }
  }

  // Verificar qual API key está sendo usada (mascarada para segurança)
  const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4)

  return NextResponse.json({
    success: true,
    apiKeyPrefix: maskedKey,
    results,
  })
}
