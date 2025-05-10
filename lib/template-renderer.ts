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

  // Configurações de estilo baseadas no formato escolhido
  const styleConfig = getStyleConfig(style)

  // Adicionar prefixo a todas as classes CSS para evitar conflitos
  const renderedTemplate = `<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Card Produto TikTok</title>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap" rel="stylesheet" />
  <style>
    /* Reset e configurações básicas */
    .sm-card-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Bruno Ace SC', sans-serif;
    }

    .sm-card-container {
      width: ${styleConfig.width};
      height: ${styleConfig.height};
      background: #0f0f0f;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
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
      top: 20px;
      left: 20px;
      z-index: 10;
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a);
      background-size: 300% 300%;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      -webkit-text-fill-color: transparent;
      animation: sm-logoGradient 5s ease infinite;
      filter: drop-shadow(0 2px 12px #b155ff88);
    }

    @keyframes sm-logoGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Card principal */
    .sm-card {
      position: relative;
      width: ${styleConfig.cardWidth};
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: ${styleConfig.cardPadding};
      z-index: 1;
      background: rgba(15, 15, 15, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 25px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    /* Imagem do produto */
    .sm-product-image-container {
      width: 100%;
      height: ${styleConfig.imageHeight};
      margin: 15px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border-radius: 15px;
    }

    .sm-product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    /* Título do produto */
    .sm-product-title {
      font-size: ${styleConfig.fontSize.title};
      line-height: 1.2;
      text-align: center;
      margin-bottom: 15px;
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
      margin: 15px 0;
      flex-wrap: wrap;
      gap: 10px;
    }

    .sm-current-price {
      font-size: ${styleConfig.fontSize.price};
      color: #ff0055;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .sm-original-price {
      font-size: ${styleConfig.fontSize.oldPrice};
      color: #cccccc;
      text-decoration: line-through;
      opacity: 0.7;
    }

    .sm-discount-badge {
      background: #ff0055;
      color: white;
      font-size: ${styleConfig.fontSize.discount};
      padding: 8px 15px;
      border-radius: 50%;
      margin-left: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    /* Descrição */
    .sm-product-description {
      font-size: ${styleConfig.fontSize.desc};
      color: #cccccc;
      margin: 15px 0;
      text-align: center;
      white-space: pre-line;
      max-height: ${styleConfig.descriptionHeight};
      overflow-y: auto;
      padding: 0 10px;
    }

    /* Informações adicionais */
    .sm-product-info {
      font-size: ${styleConfig.fontSize.info};
      margin: 10px 0;
      color: #cccccc;
    }

    .sm-star-rating {
      color: #ffd700;
    }

    /* Botão de compra */
    .sm-buy-button {
      display: inline-block;
      margin-top: 20px;
      padding: 15px 40px;
      background: linear-gradient(80deg, #c21244, #15e4ffb1);
      color: #ffffff;
      border-radius: 30px;
      text-decoration: none;
      font-size: ${styleConfig.fontSize.button};
      text-align: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .sm-buy-button:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
    }
  </style>
</head>

<body>
  <div class="sm-card-container">
    <div class="sm-background"></div>
    <div class="sm-logo">Sales Martins</div>
    
    <div class="sm-card">
      <h1 class="sm-product-title">${product.productName}</h1>
      
      <div class="sm-product-image-container">
        <img src="${product.imageUrl}" alt="${product.productName}" class="sm-product-image" />
      </div>
      
      <div class="sm-price-container">
        <p class="sm-current-price">R$ ${currentPrice.toFixed(2)}</p>
        ${originalPrice ? `<p class="sm-original-price">R$ ${originalPrice.toFixed(2)}</p>` : ""}
        ${discountPercentage ? `<span class="sm-discount-badge">-${discountPercentage}%</span>` : ""}
      </div>
      
      <p class="sm-product-description">${description}</p>
      
      <p class="sm-product-info">
        <span class="sm-star-rating">★★★★★</span> ${product.ratingStar || "4.5"} | Vendas: ${product.sales}+
      </p>
      
      <a href="${product.offerLink}" target="_blank" class="sm-buy-button">COMPRAR AGORA</a>
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

// Função para obter configurações de estilo baseadas no formato escolhido
function getStyleConfig(style: string) {
  // Configurações padrão (retrato)
  const config = {
    width: "1080px",
    height: "1920px",
    cardWidth: "90%",
    cardPadding: "30px",
    imageHeight: "500px",
    descriptionHeight: "200px",
    fontSize: {
      title: "42px",
      price: "56px",
      oldPrice: "32px",
      discount: "28px",
      desc: "32px",
      info: "28px",
      button: "32px",
    },
  }

  // Ajustar configurações com base no estilo
  if (style === "square") {
    config.width = "1080px"
    config.height = "1080px"
    config.imageHeight = "400px"
    config.descriptionHeight = "150px"
    config.fontSize = {
      title: "36px",
      price: "48px",
      oldPrice: "28px",
      discount: "24px",
      desc: "28px",
      info: "24px",
      button: "28px",
    }
  } else if (style === "landscape") {
    config.width = "1920px"
    config.height = "1080px"
    config.cardWidth = "80%"
    config.cardPadding = "25px"
    config.imageHeight = "450px"
    config.descriptionHeight = "120px"
    config.fontSize = {
      title: "40px",
      price: "52px",
      oldPrice: "30px",
      discount: "26px",
      desc: "30px",
      info: "26px",
      button: "30px",
    }
  }

  return config
}
