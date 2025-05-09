export function renderProductCardTemplate(product: any, description: string) {
  if (!product) {
    console.error("Product is undefined or null in renderProductCardTemplate")
    throw new Error("Product is required to render template")
  }

  console.log("Rendering template for product:", product.itemId)

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

  return `<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <title>Card Produto TikTok</title>
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap" rel="stylesheet" />
  <style>
    /* estilo da página */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Bruno Ace SC', sans-serif;
    }

    body {
      width: 1080px;
      height: 1920px;
      background: #0f0f0f;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 5% 0;
    }

    .logo-area {
      position: absolute;
      top: 40px;
      left: 40px;
      width: 320px;
      height: 80px;
      display: flex;
      justify-content: center;
      z-index: 2;
    }

    .logo-animada {
      width: 100%;
      height: 100%;
    }

    .logo-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, #6a00f4, #00e0ff, #6a00f4);
      background-size: 400% 400%;
      animation: pulseGradient 8s ease infinite;
      opacity: 0.15;
      z-index: 0;
    }

    @keyframes pulseGradient {
      0% {
        background-position: 0% 50%;
      }

      50% {
        background-position: 100% 50%;
      }

      100% {
        background-position: 0% 50%;
      }
    }

    .card {
      position: relative;
      width: 90%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px;
      z-index: 1;
      background: rgba(15, 15, 15, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 25px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      margin-top: 120px;
    }

    .product-img {
      width: 100%;
      max-height: 50vh;
      object-fit: cover;
      border-radius: 20px;
      margin: 20px auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .title {
      font-size: 48px;
      line-height: 1.2;
      text-align: center;
      margin-bottom: 20px;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      padding: 0 20px;
    }

    .price-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
      flex-wrap: wrap;
      gap: 15px;
    }

    .price {
      font-size: 64px;
      color: #ff0055;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .old-price {
      font-size: 36px;
      color: #cccccc;
      text-decoration: line-through;
      opacity: 0.7;
    }

    .discount {
      background: #ff0055;
      color: white;
      font-size: 32px;
      padding: 8px 15px;
      border-radius: 50%;
      margin-left: 15px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .desc {
      font-size: 36px;
      color: #cccccc;
      margin: 20px 0 40px;
      text-align: center;
      white-space: pre-line;
    }

    .rating {
      font-size: 36px;
      margin: 10px 0;
      color: #cccccc;
    }

    .rating span {
      color: #ffd700;
    }

    .offer-link {
      display: inline-block;
      margin-top: 40px;
      padding: 25px 50px;
      background: linear-gradient(80deg, #c21244, #15e4ffb1);
      color: #ffffff;
      border-radius: 30px;
      text-decoration: none;
      font-size: 36px;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .offer-link:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
    }

    .info-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
  </style>
  <style>
    @keyframes salesmartins-gradient {
      0% {
        background-position: 0% 50%;
      }

      50% {
        background-position: 100% 50%;
      }

      100% {
        background-position: 0% 50%;
      }
    }

    .salesmartins-logo-animated {
      font-family: 'Bruno Ace SC', sans-serif;
      font-size: 3.5rem;
      font-weight: 700;
      background: linear-gradient(-45deg, #ff007a, #b155ff, #01b4ff, #ff007a);
      background-size: 300% 300%;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      -webkit-text-fill-color: transparent;
      animation: salesmartins-gradient 5s ease infinite;
      text-align: center;
      filter: drop-shadow(0 2px 12px #b155ff88);
      border-radius: 18px;
      padding: 0 12px;
      display: inline-block;
      white-space: nowrap;
    }
  </style>
</head>

<body>
  <div class="logo-bg"></div>
  <div class="logo-area">
    <div class="logo-animada">
      <span class="salesmartins-logo-animated">Sales Martins</span>
    </div>
  </div>
  <div class="card">
    <h1 class="title">${product.productName}</h1>
    <img src="${product.imageUrl}" alt="${product.productName}" class="product-img" />
    <div class="info-container">
      <div class="price-container">
        <p class="price">R$ ${currentPrice.toFixed(2)}</p>
        ${originalPrice ? `<p class="old-price">R$ ${originalPrice.toFixed(2)}</p>` : ""}
        ${discountPercentage ? `<span class="discount">-${discountPercentage}%</span>` : ""}
      </div>
      <p class="desc">${description}</p>
      <p class="rating">Avaliação: <span>${product.ratingStar || "4.5"}</span> | Vendas: ${product.sales}+</p>
      <a class="offer-link" href="${product.offerLink}" target="_blank">COMPRAR AGORA</a>
    </div>
  </div>
</body>
</html>`
}
