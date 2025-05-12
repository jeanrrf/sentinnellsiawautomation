import { createLogger } from "./logger"

const logger = createLogger("template-renderer")

/**
 * Creates a fallback description for a product
 */
export function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  // Create a short and direct description
  const urgency = sales > 1000 ? "🔥 UNMISSABLE OFFER!" : "⚡ PROMOTION!"
  const rating = "⭐".repeat(Math.min(Math.round(stars), 5))

  // Limit product name to 30 characters
  const shortName = product.productName.length > 30 ? product.productName.substring(0, 30) + "..." : product.productName

  return `${urgency}\n${shortName}\n${rating}\nOnly R$${price.toFixed(2)}\nAlready sold: ${sales}\n#offer #shopee`
}

/**
 * Renders a product card template
 */
export function renderProductCardTemplate(product: any, description: string, style = "portrait") {
  if (!product) {
    console.error("Product is undefined or null in renderProductCardTemplate")
    throw new Error("Product is required to render template")
  }

  logger.info(`Rendering template for product: ${product.itemId} with style: ${style}`)

  // Use calculated original price or current price if no discount
  const currentPrice = Number.parseFloat(product.price)
  const originalPrice = product.calculatedOriginalPrice ? Number.parseFloat(product.calculatedOriginalPrice) : null

  // Calculate discount percentage if we have the original price
  let discountPercentage = null
  if (originalPrice && originalPrice > currentPrice) {
    discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
  } else if (product.priceDiscountRate) {
    // Or use the discount rate directly from the API
    discountPercentage = Math.round(Number.parseFloat(product.priceDiscountRate))
  }

  // Extract additional product details
  const shopName = product.shopName || "Official Store"
  const ratingStar = Number.parseFloat(product.ratingStar || "4.5").toFixed(1)
  const sales = Number.parseInt(product.sales || "0")
  const commissionRate = product.commissionRate ? Number.parseFloat(product.commissionRate).toFixed(1) + "%" : null
  const offerLink = product.offerLink || "#"

  // Format the description with emojis and line breaks
  const formattedDescription = description.replace(/\n/g, "<br>")

  // Simplified template to avoid syntax errors
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Card</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      width: 100%;
      max-width: 400px;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: #4a6cf7;
      color: white;
      padding: 15px;
      text-align: center;
    }
    .content {
      padding: 20px;
    }
    .product-image {
      width: 100%;
      height: auto;
      display: block;
      margin-bottom: 15px;
    }
    .product-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .price {
      font-size: 24px;
      font-weight: bold;
      color: #e63946;
      margin-bottom: 10px;
    }
    .original-price {
      text-decoration: line-through;
      color: #888;
      margin-left: 10px;
    }
    .discount {
      background: #e63946;
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 14px;
      margin-left: 10px;
    }
    .description {
      margin: 15px 0;
      line-height: 1.5;
    }
    .stats {
      display: flex;
      justify-content: space-between;
      margin: 15px 0;
    }
    .stat {
      text-align: center;
      flex: 1;
    }
    .button {
      display: block;
      background: #4a6cf7;
      color: white;
      text-align: center;
      padding: 12px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Product Card</h1>
    </div>
    <div class="content">
      <img src="${product.imageUrl}" alt="${product.productName}" class="product-image">
      <div class="product-title">${product.productName}</div>
      <div class="price">
        R$ ${currentPrice.toFixed(2)}
        ${originalPrice ? `<span class="original-price">R$ ${originalPrice.toFixed(2)}</span>` : ""}
        ${discountPercentage ? `<span class="discount">-${discountPercentage}%</span>` : ""}
      </div>
      <div class="description">${formattedDescription}</div>
      <div class="stats">
        <div class="stat">
          <div>Rating</div>
          <div>${ratingStar} ⭐</div>
        </div>
        <div class="stat">
          <div>Sales</div>
          <div>${sales}+</div>
        </div>
      </div>
      <a href="${offerLink}" class="button">Buy Now</a>
    </div>
  </div>
</body>
</html>`
}

// Função para renderizar o template "ageminipara"
export function renderAgeminiParaTemplate(product: any, description: string) {
  if (!product) {
    throw new Error("Product is required to render ageminipara template")
  }

  // Extrair dados do produto
  const currentPrice = Number.parseFloat(product.price)
  const originalPrice = product.calculatedOriginalPrice ? Number.parseFloat(product.calculatedOriginalPrice) : null
  const discountPercentage = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : product.priceDiscountRate
      ? Math.round(Number.parseFloat(product.priceDiscountRate))
      : null

  const shopName = product.shopName || "Loja Oficial"
  const ratingStar = Number.parseFloat(product.ratingStar || "4.5").toFixed(1)
  const sales = Number.parseInt(product.sales || "0")
  const offerLink = product.offerLink || "#"

  // Formatar descrição
  const formattedDescription = description.replace(/\n/g, "<br>")

  // Simplified template to avoid syntax errors
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agemini Para Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f5f7fa;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      width: 100%;
      max-width: 400px;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: #118ab2;
      color: white;
      padding: 15px;
      text-align: center;
    }
    .content {
      padding: 20px;
    }
    .product-image {
      width: 100%;
      height: auto;
      display: block;
      margin-bottom: 15px;
    }
    .product-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .price {
      font-size: 24px;
      font-weight: bold;
      color: #e63946;
      margin-bottom: 10px;
    }
    .original-price {
      text-decoration: line-through;
      color: #888;
      margin-left: 10px;
    }
    .discount {
      background: #e63946;
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 14px;
      margin-left: 10px;
    }
    .description {
      margin: 15px 0;
      line-height: 1.5;
    }
    .stats {
      display: flex;
      justify-content: space-between;
      margin: 15px 0;
    }
    .stat {
      text-align: center;
      flex: 1;
    }
    .button {
      display: block;
      background: #118ab2;
      color: white;
      text-align: center;
      padding: 12px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Agemini Para</h1>
    </div>
    <div class="content">
      <img src="${product.imageUrl}" alt="${product.productName}" class="product-image">
      <div class="product-title">${product.productName}</div>
      <div class="price">
        R$ ${currentPrice.toFixed(2)}
        ${originalPrice ? `<span class="original-price">R$ ${originalPrice.toFixed(2)}</span>` : ""}
        ${discountPercentage ? `<span class="discount">-${discountPercentage}%</span>` : ""}
      </div>
      <div class="description">${formattedDescription}</div>
      <div class="stats">
        <div class="stat">
          <div>Rating</div>
          <div>${ratingStar} ⭐</div>
        </div>
        <div class="stat">
          <div>Sales</div>
          <div>${sales}+</div>
        </div>
      </div>
      <a href="${offerLink}" class="button">Buy Now</a>
    </div>
  </div>
</body>
</html>`
}

// Função para obter configurações de estilo baseadas no formato escolhido
function getStyleConfig(style: string) {
  // Configurações padrão (retrato)
  const config = {
    width: "100%",
    height: "100%",
    cardWidth: "90%",
    cardPadding: "20px",
    imageHeight: "40%",
    descriptionHeight: "25%",
    fontSize: {
      title: "1.5rem",
      price: "2rem",
      oldPrice: "1.2rem",
      discount: "1rem",
      desc: "1rem",
      info: "0.9rem",
      button: "1.2rem",
      badge: "0.8rem",
    },
  }

  // Ajustar configurações com base no estilo
  if (style === "square") {
    config.imageHeight = "35%"
    config.descriptionHeight = "20%"
    config.fontSize = {
      title: "1.3rem",
      price: "1.8rem",
      oldPrice: "1rem",
      discount: "0.9rem",
      desc: "0.9rem",
      info: "0.8rem",
      button: "1.1rem",
      badge: "0.7rem",
    }
  } else if (style === "landscape") {
    config.cardWidth = "80%"
    config.cardPadding = "15px"
    config.imageHeight = "30%"
    config.descriptionHeight = "20%"
    config.fontSize = {
      title: "1.4rem",
      price: "1.9rem",
      oldPrice: "1.1rem",
      discount: "0.95rem",
      desc: "0.95rem",
      info: "0.85rem",
      button: "1.15rem",
      badge: "0.75rem",
    }
  }

  return config
}
