import { NextResponse } from "next/server"
import { cacheProducts } from "@/lib/redis"

export async function GET() {
  try {
    console.log("Buscando produtos da API Shopee Affiliate...")

    // Verificar se as variáveis de ambiente necessárias estão configuradas
    if (!process.env.SHOPEE_APP_ID || !process.env.SHOPEE_APP_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciais da API Shopee não configuradas",
        },
        { status: 500 },
      )
    }

    // Construir a URL da API com os parâmetros necessários
    const apiUrl = process.env.SHOPEE_AFFILIATE_API_URL || "https://open-api.affiliate.shopee.com.br"
    const endpoint = "/api/v1/product/get_list"

    const params = new URLSearchParams({
      offset: "0",
      limit: "5", // Limitado a 5 produtos
      sort_by: "sales", // Ordenar por vendas (best sellers)
      sort_type: "desc", // Ordem decrescente
      time_range: "2", // Últimas 48 horas
    })

    const url = `${apiUrl}${endpoint}?${params.toString()}`

    // Configurar headers da requisição
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SHOPEE_APP_ID}:${process.env.SHOPEE_APP_SECRET}`,
    }

    // Fazer a requisição para a API
    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na resposta da API Shopee:", errorText)
      return NextResponse.json(
        {
          success: false,
          message: `Erro na API Shopee: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Verificar se a resposta contém produtos
    if (!data.products || !Array.isArray(data.products)) {
      console.error("Resposta da API Shopee não contém produtos:", data)
      return NextResponse.json(
        {
          success: false,
          message: "Resposta da API Shopee não contém produtos",
          data,
        },
        { status: 500 },
      )
    }

    // Filtrar apenas os 5 melhores produtos
    const bestSellers = data.products.slice(0, 5)

    console.log(`Encontrados ${bestSellers.length} produtos best sellers`)

    // Salvar produtos no cache
    await cacheProducts(bestSellers)

    return NextResponse.json({
      success: true,
      products: bestSellers,
      source: "api",
    })
  } catch (error) {
    console.error("Erro ao buscar produtos da API Shopee:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao buscar produtos: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
