import type { CSSProperties } from "react"

// Tipos para as propriedades do card
export interface ProductCardProps {
  product: {
    productName: string
    price: string
    priceDiscountRate?: string
    imageUrl: string
    shopName?: string
    ratingStar?: string
    sales?: string
    freeShipping?: boolean
  }
  description?: string
  theme?: "dark" | "light" | "vibrant" | "elegant"
  showBadges?: boolean
  showRating?: boolean
  showShopName?: boolean
}

// Temas de cores para diferentes estilos de cards
const themes = {
  dark: {
    background: "#000000",
    text: "#ffffff",
    primary: "#ff4d4f",
    secondary: "#999999",
    accent: "#ffcc00",
    badge: "#ff4d4f",
    freeBadge: "#00c853",
  },
  light: {
    background: "#ffffff",
    text: "#333333",
    primary: "#ff4d4f",
    secondary: "#666666",
    accent: "#ff9500",
    badge: "#ff4d4f",
    freeBadge: "#00c853",
  },
  vibrant: {
    background: "#6200ea",
    text: "#ffffff",
    primary: "#ff4081",
    secondary: "#e0e0e0",
    accent: "#00e5ff",
    badge: "#ff4081",
    freeBadge: "#00e5ff",
  },
  elegant: {
    background: "#1c1c1e",
    text: "#ffffff",
    primary: "#e5b80b",
    secondary: "#cccccc",
    accent: "#d4af37",
    badge: "#e5b80b",
    freeBadge: "#00bfa5",
  },
}

export function ProductCard({
  product,
  description = "",
  theme = "dark",
  showBadges = true,
  showRating = true,
  showShopName = true,
}: ProductCardProps) {
  // Obter o tema de cores selecionado
  const colors = themes[theme]

  // Calcular informações de desconto
  const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100
  const hasDiscount = discountRate > 0
  const originalPrice = hasDiscount ? (Number.parseFloat(product.price) / (1 - discountRate)).toFixed(2) : null

  // Estilos base
  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: "relative",
  }

  const imageContainerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "60%",
    overflow: "hidden",
    position: "relative",
  }

  const imageStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  }

  const discountBadgeStyle: CSSProperties = {
    position: "absolute",
    top: "20px",
    right: "20px",
    backgroundColor: colors.badge,
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "24px",
  }

  const contentStyle: CSSProperties = {
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
  }

  const titleStyle: CSSProperties = {
    fontSize: "32px",
    fontWeight: "bold",
    margin: 0,
    lineHeight: 1.2,
  }

  const priceContainerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  }

  const priceStyle: CSSProperties = {
    fontSize: "40px",
    fontWeight: "bold",
    color: colors.primary,
  }

  const originalPriceStyle: CSSProperties = {
    fontSize: "24px",
    textDecoration: "line-through",
    color: colors.secondary,
  }

  const infoStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "20px",
  }

  const footerStyle: CSSProperties = {
    marginTop: "auto",
    backgroundColor: colors.primary,
    padding: "16px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
  }

  // Renderizar o card
  return (
    <div style={containerStyle}>
      {/* Imagem do Produto */}
      <div style={imageContainerStyle}>
        <img src={product.imageUrl || "/placeholder.svg"} alt={product.productName} style={imageStyle} />
        {showBadges && hasDiscount && <div style={discountBadgeStyle}>{`-${Math.round(discountRate * 100)}%`}</div>}
      </div>

      {/* Informações do Produto */}
      <div style={contentStyle}>
        {/* Nome do Produto */}
        <h1 style={titleStyle}>{product.productName}</h1>

        {/* Preço */}
        <div style={priceContainerStyle}>
          <span style={priceStyle}>R$ {product.price}</span>
          {hasDiscount && <span style={originalPriceStyle}>R$ {originalPrice}</span>}
        </div>

        {/* Nome da Loja */}
        {showShopName && product.shopName && (
          <div style={infoStyle}>
            <span>Loja: {product.shopName}</span>
          </div>
        )}

        {/* Avaliação */}
        {showRating && (product.ratingStar || product.sales) && (
          <div style={infoStyle}>
            {product.ratingStar && (
              <>
                <span>⭐ {product.ratingStar}</span>
                {product.sales && <span>•</span>}
              </>
            )}
            {product.sales && <span>Vendas: {product.sales}</span>}
          </div>
        )}

        {/* Descrição curta (se fornecida) */}
        {description && (
          <div style={{ fontSize: "18px", color: colors.secondary, marginTop: "8px" }}>
            {description.length > 100 ? `${description.substring(0, 100)}...` : description}
          </div>
        )}

        {/* Rodapé */}
        <div style={footerStyle}>COMPRE AGORA • LINK NA BIO</div>
      </div>
    </div>
  )
}
