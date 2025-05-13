import type { CSSProperties } from "react"

// Tipos para as propriedades do card moderno
export interface ModernProductCardProps {
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
  colorScheme?: "red" | "blue" | "purple" | "green" | "gold"
  showBadges?: boolean
  showRating?: boolean
  showShopName?: boolean
  layout?: "standard" | "fullImage" | "split"
}

// Esquemas de cores para diferentes estilos
const colorSchemes = {
  red: {
    gradient: ["#1a1a1a", "#2a0a0a"],
    primary: "#ff4d4f",
    secondary: "#ff8a8b",
    text: "#ffffff",
    textSecondary: "#cccccc",
    accent: "#ffcc00",
  },
  blue: {
    gradient: ["#0a1a2a", "#1a2a3a"],
    primary: "#0070f3",
    secondary: "#3291ff",
    text: "#ffffff",
    textSecondary: "#cccccc",
    accent: "#00c8ff",
  },
  purple: {
    gradient: ["#1a0a2a", "#2a1a3a"],
    primary: "#7928ca",
    secondary: "#9c56e8",
    text: "#ffffff",
    textSecondary: "#cccccc",
    accent: "#f81ce5",
  },
  green: {
    gradient: ["#0a2a1a", "#1a3a2a"],
    primary: "#0bc56d",
    secondary: "#2ee88a",
    text: "#ffffff",
    textSecondary: "#cccccc",
    accent: "#00e5ff",
  },
  gold: {
    gradient: ["#2a1a0a", "#3a2a1a"],
    primary: "#e5b80b",
    secondary: "#f7d442",
    text: "#ffffff",
    textSecondary: "#cccccc",
    accent: "#d4af37",
  },
}

export function ModernProductCard({
  product,
  description = "",
  colorScheme = "red",
  showBadges = true,
  showRating = true,
  showShopName = true,
  layout = "standard",
}: ModernProductCardProps) {
  // Obter o esquema de cores selecionado
  const colors = colorSchemes[colorScheme]

  // Calcular informações de desconto
  const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100
  const hasDiscount = discountRate > 0
  const originalPrice = hasDiscount ? (Number.parseFloat(product.price) / (1 - discountRate)).toFixed(2) : null

  // Ajustar layout com base na opção selecionada
  const imageHeight = layout === "fullImage" ? "70%" : layout === "split" ? "100%" : "60%"
  const imageWidth = layout === "split" ? "50%" : "100%"
  const contentWidth = layout === "split" ? "50%" : "100%"

  // Estilos base
  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: layout === "split" ? "row" : "column",
    width: "100%",
    height: "100%",
    background: `linear-gradient(to bottom, ${colors.gradient[0]}, ${colors.gradient[1]})`,
    color: colors.text,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: "relative",
    overflow: "hidden",
  }

  const imageContainerStyle: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: imageWidth,
    height: imageHeight,
    overflow: "hidden",
    position: "relative",
  }

  const imageStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  }

  const overlayStyle: CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "150px",
    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
  }

  const discountBadgeStyle: CSSProperties = {
    position: "absolute",
    top: "20px",
    right: "20px",
    backgroundColor: colors.primary,
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "24px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  }

  const contentStyle: CSSProperties = {
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: contentWidth,
    flex: layout === "fullImage" ? "none" : 1,
    zIndex: 1,
  }

  const titleStyle: CSSProperties = {
    fontSize: "32px",
    fontWeight: "bold",
    margin: 0,
    lineHeight: 1.2,
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
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
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  }

  const originalPriceStyle: CSSProperties = {
    fontSize: "24px",
    textDecoration: "line-through",
    color: colors.textSecondary,
  }

  const infoStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "20px",
    color: colors.textSecondary,
  }

  const footerStyle: CSSProperties = {
    marginTop: "auto",
    backgroundColor: colors.primary,
    padding: "16px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  }

  // Renderizar o card
  return (
    <div style={containerStyle}>
      {/* Imagem do Produto */}
      <div style={imageContainerStyle}>
        <img src={product.imageUrl || "/placeholder.svg"} alt={product.productName} style={imageStyle} />
        {layout !== "split" && <div style={overlayStyle} />}
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
          <div style={{ fontSize: "18px", color: colors.textSecondary, marginTop: "8px" }}>
            {description.length > 100 ? `${description.substring(0, 100)}...` : description}
          </div>
        )}

        {/* Rodapé */}
        <div style={footerStyle}>COMPRE AGORA • LINK NA BIO</div>
      </div>
    </div>
  )
}
