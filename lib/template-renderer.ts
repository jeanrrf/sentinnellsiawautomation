/**
 * Cria uma descrição de fallback para um produto
 */
export function createFallbackDescription(product: any) {
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

/**
 * Renderiza um template básico para produtos não encontrados
 */
export function renderBasicTemplate(product: any) {
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
      min-height: 100%;
      height: auto;
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

export function renderProductCardTemplate(product: any, description: string, style = "portrait") {
  if (!product) {
    console.error("Product is undefined or null in renderProductCardTemplate")
    throw new Error("Product is required to render template")
  }

  console.log(`Rendering template for product: ${product.itemId} with style: ${style}`)

  // Usar o preço original calculado ou o preço atual se não houver desconto
  const currentPrice = Number.parseFloat(product.price)
  const originalPrice = product.calculatedOriginalPrice ? Number.parseFloat(product.calculatedOriginalPrice) : null

  // Calcular a porcentagem de desconto se tivermos o preço original
  let discountPercentage = null
  if (originalPrice && originalPrice > currentPrice) {
    discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
  } else if (product.priceDiscountRate) {
    // Ou usar diretamente a taxa de desconto da API
    discountPercentage = Math.round(Number.parseFloat(product.priceDiscountRate))
  }

  // Extract additional product details
  const shopName = product.shopName || "Loja Oficial"
  const ratingStar = Number.parseFloat(product.ratingStar || "4.5").toFixed(1)
  const sales = Number.parseInt(product.sales || "0")
  const commissionRate = product.commissionRate ? Number.parseFloat(product.commissionRate).toFixed(1) + "%" : null
  const offerLink = product.offerLink || "#"

  // Format the description with emojis and line breaks
  const formattedDescription = description.replace(/\n/g, "<br>")

  // Selecionar o template com base no estilo
  if (style === "ageminipara") {
    return renderAgeminiParaTemplate(product, description)
  }

  // Adicionar prefixo a todas as classes CSS para evitar conflitos
  const renderedTemplate = `<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Card Produto TikTok</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Reset e configurações básicas */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: auto;
    }

    body {
      font-family: 'Montserrat', sans-serif;
      background: #000;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sm-card-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
    }

    .sm-card-container {
      width: 100%;
      height: auto;
      min-height: 100%;
      aspect-ratio: 9/16;
      background: #000;
      overflow: auto;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    /* Background animado */
    .sm-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, #6a00f4, #00e0ff, #6a00f4);
      background-size: 400% 400%;
      animation: sm-gradientBG 8s ease infinite;
      opacity: 0.15;
      z-index: 0;
    }

    @keyframes sm-gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Logo */
    .sm-logo {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 10px 0;
      z-index: 10;
      font-size: 1.8rem;
      font-weight: 700;
      font-family: 'Bruno Ace SC', sans-serif;
      background: linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a);
      background-size: 300% 300%;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      -webkit-text-fill-color: transparent;
      animation: sm-logoGradient 5s ease infinite;
      filter: drop-shadow(0 2px 12px #b155ff88);
      text-align: center;
    }

    @keyframes sm-logoGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Shop badge */
    .sm-shop-badge {
      position: absolute;
      top: 50px;
      right: 15px;
      z-index: 10;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(5px);
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .sm-shop-badge-icon {
      color: #ff007a;
    }

    /* Card principal */
    .sm-card {
      position: relative;
      width: 100%;
      height: auto;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 15px 20px;
      z-index: 1;
      background: rgba(15, 15, 15, 0.7);
      backdrop-filter: blur(10px);
    }

    /* Imagem do produto */
    .sm-product-image-container {
      width: 100%;
      height: auto;
      max-height: 45%;
      margin: 10px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border-radius: 15px;
      position: relative;
    }

    .sm-product-image {
      width: 100%;
      height: auto;
      max-height: 100%;
      object-fit: contain;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    /* Discount badge */
    .sm-discount-badge-corner {
      position: absolute;
      top: 0;
      right: 0;
      background: #ff0055;
      color: white;
      font-size: 0.9rem;
      font-weight: bold;
      padding: 10px 15px;
      border-radius: 0 15px 0 15px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      z-index: 2;
    }

    /* Título do produto */
    .sm-product-title {
      font-size: 1.4rem;
      line-height: 1.2;
      text-align: center;
      margin: 5px 0;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      padding: 0 10px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Preço */
    .sm-price-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px 0;
      flex-wrap: wrap;
      gap: 10px;
    }

    .sm-current-price {
      font-size: 2rem;
      color: #ff0055;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .sm-original-price {
      font-size: 1.2rem;
      color: #cccccc;
      text-decoration: line-through;
      opacity: 0.7;
    }

    .sm-discount-badge {
      background: #ff0055;
      color: white;
      font-size: 1rem;
      padding: 8px 15px;
      border-radius: 50%;
      margin-left: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    /* Descrição */
    .sm-product-description {
      font-size: 1rem;
      color: #cccccc;
      margin: 10px 0;
      text-align: center;
      white-space: pre-line;
      max-height: 20%;
      overflow-y: auto;
      padding: 0 10px;
    }

    /* Informações adicionais */
    .sm-product-info {
      font-size: 0.9rem;
      margin: 5px 0;
      color: #cccccc;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
    }

    .sm-info-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .sm-star-rating {
      color: #ffd700;
    }

    /* Botão de compra */
    .sm-buy-button {
      display: inline-block;
      margin-top: 10px;
      padding: 12px 35px;
      background: linear-gradient(80deg, #c21244, #15e4ffb1);
      color: #ffffff;
      border-radius: 30px;
      text-decoration: none;
      font-size: 1.2rem;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .sm-buy-button:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
    }

    /* Badges de destaque */
    .sm-highlight-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin: 5px 0;
    }

    .sm-highlight-badge {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .sm-badge-bestseller {
      background: linear-gradient(45deg, #ffd700, #ff9500);
      color: #000;
    }

    .sm-badge-hot {
      background: linear-gradient(45deg, #ff416c, #ff4b2b);
    }

    .sm-badge-limited {
      background: linear-gradient(45deg, #8e2de2, #4a00e0);
    }
  </style>
</head>

<body>
  <div class="sm-card-container">
    <div class="sm-background"></div>
    <div class="sm-logo">Sales Martins</div>
    <div class="sm-shop-badge">
      <span class="sm-shop-badge-icon">🏪</span>
      <span>${shopName}</span>
    </div>
    
    <div class="sm-card">
      <h1 class="sm-product-title">${product.productName}</h1>
      
      <div class="sm-product-image-container">
        <img src="${product.imageUrl}" alt="${product.productName}" class="sm-product-image" />
        ${discountPercentage ? `<div class="sm-discount-badge-corner">-${discountPercentage}%</div>` : ""}
      </div>
      
      <div class="sm-highlight-badges">
        ${sales > 1000 ? `<div class="sm-highlight-badge sm-badge-bestseller">🔥 Mais Vendido</div>` : ""}
        ${discountPercentage > 20 ? `<div class="sm-highlight-badge sm-badge-hot">💰 Super Oferta</div>` : ""}
        ${sales > 500 && discountPercentage > 10 ? `<div class="sm-highlight-badge sm-badge-limited">⏱️ Oferta Limitada</div>` : ""}
      </div>
      
      <div class="sm-price-container">
        <p class="sm-current-price">R$ ${currentPrice.toFixed(2)}</p>
        ${originalPrice ? `<p class="sm-original-price">R$ ${originalPrice.toFixed(2)}</p>` : ""}
        ${discountPercentage ? `<span class="sm-discount-badge">-${discountPercentage}%</span>` : ""}
      </div>
      
      <p class="sm-product-description">${formattedDescription}</p>
      
      <div class="sm-product-info">
        <div class="sm-info-item">
          <span class="sm-star-rating">★</span> ${ratingStar}
        </div>
        <div class="sm-info-item">
          <span>👥</span> ${sales.toLocaleString("pt-BR")}+ vendidos
        </div>
        ${
          commissionRate
            ? `
        <div class="sm-info-item">
          <span>💎</span> ${commissionRate} cashback
        </div>
        `
            : ""
        }
      </div>
      
      <a href="${offerLink}" target="_blank" class="sm-buy-button">COMPRAR AGORA</a>
    </div>
  </div>
</body>
</html>`

  if (!renderedTemplate || renderedTemplate.trim() === "") {
    console.error("Template renderizado está vazio")
    throw new Error("O template renderizado está vazio. Verifique os dados fornecidos.")
  }

  return renderedTemplate
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

  // Template Agemini Para
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Card Produto - Agemini Para</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Poppins', sans-serif;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: auto;
    }
    
    body {
      background: #f0f2f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .ap-container {
      width: 100%;
      height: auto;
      min-height: 100%;
      aspect-ratio: 9/16;
      position: relative;
      overflow: auto;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    
    .ap-header {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    
    .ap-logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #3a3a3a;
      text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
    }
    
    .ap-shop-badge {
      background: rgba(255,255,255,0.8);
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #555;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .ap-content {
      position: relative;
      width: 100%;
      height: auto;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      padding: 70px 20px 20px;
    }
    
    .ap-product-image {
      width: 100%;
      height: auto;
      max-height: 40%;
      object-fit: contain;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      background: white;
      padding: 10px;
      margin-bottom: 15px;
    }
    
    .ap-product-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .ap-price-container {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .ap-current-price {
      font-size: 1.8rem;
      font-weight: 700;
      color: #e63946;
    }
    
    .ap-original-price {
      font-size: 1.1rem;
      color: #888;
      text-decoration: line-through;
    }
    
    .ap-discount {
      background: #e63946;
      color: white;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .ap-description {
      font-size: 0.95rem;
      color: #555;
      margin-bottom: 15px;
      line-height: 1.4;
      max-height: 20%;
      overflow-y: auto;
      background: rgba(255,255,255,0.7);
      padding: 10px;
      border-radius: 8px;
    }
    
    .ap-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    
    .ap-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255,255,255,0.7);
      padding: 8px;
      border-radius: 8px;
      width: 30%;
    }
    
    .ap-stat-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }
    
    .ap-stat-label {
      font-size: 0.8rem;
      color: #666;
    }
    
    .ap-cta {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .ap-buy-button {
      background: #e63946;
      color: white;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      font-size: 1.1rem;
      text-decoration: none;
      box-shadow: 0 4px 10px rgba(230,57,70,0.3);
      transition: all 0.3s ease;
    }
    
    .ap-buy-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(230,57,70,0.4);
    }
    
    .ap-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    
    .ap-tag {
      background: rgba(255,255,255,0.7);
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #555;
    }
    
    .ap-bestseller {
      background: #ffd166;
      color: #333;
    }
    
    .ap-limited {
      background: #118ab2;
      color: white;
    }
    
    .ap-hot-deal {
      background: #ef476f;
      color: white;
    }
  </style>
</head>
<body>
  <div class="ap-container">
    <div class="ap-header">
      <div class="ap-logo">AgeminiPara</div>
      <div class="ap-shop-badge">
        <span>🏪</span>
        <span>${shopName}</span>
      </div>
    </div>
    
    <div class="ap-content">
      <img src="${product.imageUrl}" alt="${product.productName}" class="ap-product-image">
      
      <h1 class="ap-product-title">${product.productName}</h1>
      
      <div class="ap-price-container">
        <span class="ap-current-price">R$ ${currentPrice.toFixed(2)}</span>
        ${originalPrice ? `<span class="ap-original-price">R$ ${originalPrice.toFixed(2)}</span>` : ""}
        ${discountPercentage ? `<span class="ap-discount">-${discountPercentage}%</span>` : ""}
      </div>
      
      <div class="ap-description">
        ${formattedDescription}
      </div>
      
      <div class="ap-stats">
        <div class="ap-stat-item">
          <span class="ap-stat-value">${ratingStar}</span>
          <span class="ap-stat-label">Avaliação</span>
        </div>
        
        <div class="ap-stat-item">
          <span class="ap-stat-value">${sales > 1000 ? (sales / 1000).toFixed(1) + "k" : sales}</span>
          <span class="ap-stat-label">Vendidos</span>
        </div>
        
        <div class="ap-stat-item">
          <span class="ap-stat-value">${discountPercentage || 0}%</span>
          <span class="ap-stat-label">Desconto</span>
        </div>
      </div>
      
      <div class="ap-cta">
        <a href="${offerLink}" class="ap-buy-button">COMPRAR AGORA</a>
        
        <div class="ap-tags">
          ${sales > 1000 ? `<span class="ap-tag ap-bestseller">🔥 Mais Vendido</span>` : ""}
          ${discountPercentage > 20 ? `<span class="ap-tag ap-hot-deal">💰 Super Oferta</span>` : ""}
          ${sales > 500 && discountPercentage > 10 ? `<span class="ap-tag ap-limited">⏱️ Tempo Limitado</span>` : ""}
          <span class="ap-tag">#shopee</span>
          <span class="ap-tag">#oferta</span>
        </div>
      </div>
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
