import { NextResponse } from "next/server"
import { saveVideo } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { productId, duration, htmlTemplate } = data

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
    }

    // Buscar informações do produto
    const productResponse = await fetch(new URL("/api/products", req.url).toString())
    if (!productResponse.ok) {
      throw new Error(`Falha ao buscar produtos: ${productResponse.status}`)
    }

    const productsData = await productResponse.json()
    const product = productsData.products.find((p: any) => p.itemId === productId)

    if (!product) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 })
    }

    // Não precisamos buscar o HTML template do preview se já o temos
    let templateHtml = htmlTemplate

    // Se não temos o HTML template, tentamos buscá-lo, mas com tratamento de erro
    if (!templateHtml) {
      try {
        const previewResponse = await fetch(new URL(`/api/preview/${productId}?style=portrait`, req.url).toString())
        if (previewResponse.ok) {
          templateHtml = await previewResponse.text()
        } else {
          console.warn(`Não foi possível obter o preview para o produto ${productId}. Usando template padrão.`)
          // Criar um template HTML básico como fallback
          templateHtml = createBasicTemplate(product)
        }
      } catch (error) {
        console.error("Erro ao buscar preview:", error)
        // Criar um template HTML básico como fallback
        templateHtml = createBasicTemplate(product)
      }
    }

    // Gerar timestamp único para o vídeo
    const timestamp = Date.now()

    // Criar dados do vídeo
    const videoData = {
      id: `video_${timestamp}`,
      productId,
      productName: product.productName,
      imageUrl: product.imageUrl,
      price: product.price,
      duration: duration || 5,
      createdAt: new Date().toISOString(),
      status: "generated", // generated, published, failed
      videoUrl: `/api/preview/${productId}?style=portrait&t=${timestamp}`, // URL para visualização do vídeo
      htmlTemplate: templateHtml, // Salvar o HTML do template para exibição posterior
    }

    // Salvar vídeo no Redis
    await saveVideo(videoData)

    return NextResponse.json({
      success: true,
      message: "Vídeo salvo com sucesso",
      video: videoData,
    })
  } catch (error: any) {
    console.error("Erro ao salvar vídeo:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao salvar vídeo: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

// Função para criar um template HTML básico como fallback
function createBasicTemplate(product: any) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Card Produto TikTok</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
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
