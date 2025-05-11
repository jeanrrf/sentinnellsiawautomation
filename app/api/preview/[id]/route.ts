import { NextResponse } from "next/server"
import { getCachedDescription, getCachedProduct } from "@/lib/redis"
import { renderProductCardTemplate } from "@/lib/template-renderer"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:Preview")

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    const url = new URL(request.url)
    const style = url.searchParams.get("style") || "portrait"
    const timestamp = url.searchParams.get("t") || Date.now().toString()

    logger.info("Requisição de preview recebida", {
      context: {
        productId,
        style,
        timestamp: url.searchParams.get("t"),
      },
    })

    // Primeiro, tente obter o produto do cache
    let product = await getCachedProduct(productId)

    // Se não encontrar no cache, busque da API
    if (!product) {
      try {
        const productsResponse = await fetch(new URL("/api/products", request.url).toString())

        if (!productsResponse.ok) {
          throw new Error(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`)
        }

        const productsData = await productsResponse.json()
        product = productsData.products.find((p: any) => p.itemId === productId)
      } catch (error) {
        logger.error("Error fetching product", { context: { error: error.message, productId } })
        return new NextResponse(`Error fetching product: ${error.message}`, {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
          },
        })
      }
    }

    if (!product) {
      logger.warn(`Product not found: ${productId}`)

      // Criar um produto fictício para evitar erros
      product = {
        itemId: productId,
        productName: "Produto não encontrado",
        price: "0.00",
        imageUrl: "https://via.placeholder.com/300x300?text=Produto+Não+Encontrado",
        sales: "0",
        ratingStar: "0",
        offerLink: "#",
      }

      // Retornar um template básico em vez de um erro
      const htmlTemplate = renderBasicTemplate(product)

      return new NextResponse(htmlTemplate, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    // Try to get cached description
    let description = null
    try {
      description = await getCachedDescription(productId)
      logger.debug(`Description for product ${productId}:`, {
        context: { found: description ? true : false },
      })
    } catch (error) {
      logger.error(`Error getting cached description for product ${productId}:`, { context: { error } })
    }

    // If no cached description, generate a simple one
    if (!description) {
      description = createFallbackDescription(product)
      logger.debug(`Generated fallback description for product ${productId}`)
    }

    // Generate HTML template
    const htmlTemplate = renderProductCardTemplate(product, description, style)

    const html = htmlTemplate

    // Verificar se o HTML foi gerado corretamente
    if (!html || html.trim() === "") {
      logger.error("HTML do preview vazio ou inválido")
      return new NextResponse("Erro: Não foi possível gerar o preview. HTML vazio ou inválido.", { status: 500 })
    }

    logger.debug("Preview HTML gerado com sucesso", { context: { size: html.length } })

    // Return the HTML directly with cache control headers
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error: any) {
    logger.error("Erro detalhado na geração do preview", {
      context: { error: error.message, stack: error.stack },
    })

    return new NextResponse(`Erro ao gerar preview: ${error.message}`, { status: 500 })
  }
}

// Função para renderizar um template básico quando o produto não é encontrado
function renderBasicTemplate(product: any) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Card Produto TikTok</title>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap" rel="stylesheet" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Bruno Ace SC', sans-serif;
      background: #0f0f0f;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      width: 90%;
      max-width: 500px;
      background: rgba(30, 30, 30, 0.8);
      border-radius: 15px;
      padding: 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #ff007a, #b155ff);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .product-image {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      margin: 15px 0;
      border-radius: 10px;
    }
    .product-title {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .price {
      font-size: 24px;
      color: #ff0055;
      margin-bottom: 15px;
    }
    .buy-button {
      display: inline-block;
      padding: 10px 30px;
      background: linear-gradient(45deg, #c21244, #15e4ff);
      color: white;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Sales Martins</div>
    <h1 class="product-title">${product.productName}</h1>
    <img src="${product.imageUrl}" alt="${product.productName}" class="product-image">
    <p class="price">R$ ${Number(product.price).toFixed(2)}</p>
    <p>Vendas: ${product.sales}+</p>
    <a href="${product.offerLink || "#"}" class="buy-button">COMPRAR AGORA</a>
  </div>
</body>
</html>`
}

// Fallback description generator
function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  // Criar uma descrição curta e direta
  const urgency = sales > 1000 ? "🔥 OFERTA IMPERDÍVEL!" : "⚡ PROMOÇÃO!"
  const rating = "⭐".repeat(Math.min(Math.round(stars), 5))

  // Limitar o nome do produto a 30 caracteres
  const shortName = product.productName.length > 30 ? product.productName.substring(0, 30) + "..." : product.productName

  return `${urgency}\n${shortName}\n${rating}\nApenas R$${price.toFixed(2)}\nJá vendidos: ${sales}\n#oferta #shopee`
}
