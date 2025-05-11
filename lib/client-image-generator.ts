// Função para gerar imagem no lado do cliente
export async function generateCardImage(
  product: any,
  description: string,
  format: "png" | "jpeg" = "png",
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Criar um elemento canvas temporário
      const canvas = document.createElement("canvas")
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Failed to get canvas context")
      }

      // Definir fundo
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Carregar a imagem do produto
      const img = new Image()
      img.crossOrigin = "anonymous" // Importante para evitar erros CORS

      img.onload = () => {
        // Desenhar a imagem do produto
        const imgHeight = canvas.height * 0.6
        const imgY = 0

        // Calcular dimensões para manter a proporção
        const imgRatio = img.width / img.height
        let imgWidth = imgHeight * imgRatio
        let imgX = (canvas.width - imgWidth) / 2

        // Se a imagem for muito larga, ajustar para a largura
        if (imgWidth > canvas.width) {
          imgWidth = canvas.width
          const newHeight = imgWidth / imgRatio
          imgX = 0
          // Centralizar verticalmente
          const newY = imgY + (imgHeight - newHeight) / 2
          ctx.drawImage(img, imgX, newY, imgWidth, newHeight)
        } else {
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)
        }

        // Desenhar informações do produto
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 48px Arial"

        // Nome do produto (com quebra de linha)
        const productName = product.productName
        const maxWidth = canvas.width - 64
        const lineHeight = 58
        const lines = getLines(ctx, productName, maxWidth)

        let y = imgHeight + 80
        lines.forEach((line) => {
          ctx.fillText(line, 32, y)
          y += lineHeight
        })

        // Preço
        ctx.fillStyle = "#FF4D4F"
        ctx.font = "bold 72px Arial"
        ctx.fillText(`R$ ${product.price}`, 32, y + 80)

        // Se houver desconto
        const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100
        if (discountRate > 0) {
          const originalPrice = (Number.parseFloat(product.price) / (1 - discountRate)).toFixed(2)
          ctx.fillStyle = "#999999"
          ctx.font = "36px Arial"
          ctx.fillText(`R$ ${originalPrice}`, 32 + ctx.measureText(`R$ ${product.price} `).width, y + 80)

          // Badge de desconto
          ctx.fillStyle = "#FF4D4F"
          ctx.font = "bold 36px Arial"
          const discountText = `-${Math.round(discountRate * 100)}%`
          const discountWidth = ctx.measureText(discountText).width + 32

          // Desenhar o círculo de desconto
          ctx.beginPath()
          ctx.roundRect(canvas.width - discountWidth - 32, imgHeight - 100, discountWidth, 60, 30)
          ctx.fill()

          // Texto do desconto
          ctx.fillStyle = "#FFFFFF"
          ctx.fillText(discountText, canvas.width - discountWidth - 16, imgHeight - 55)
        }

        // Informações da loja
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "36px Arial"
        ctx.fillText(`Loja: ${product.shopName}`, 32, y + 160)

        // Avaliação e vendas
        ctx.fillText(`⭐ ${product.ratingStar} • Vendas: ${product.sales}`, 32, y + 220)

        // Botão de call-to-action
        ctx.fillStyle = "#FF4D4F"
        const btnY = canvas.height - 120
        ctx.beginPath()
        ctx.roundRect(32, btnY, canvas.width - 64, 80, 10)
        ctx.fill()

        // Texto do botão
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 40px Arial"
        ctx.textAlign = "center"
        ctx.fillText("COMPRE AGORA • LINK NA BIO", canvas.width / 2, btnY + 50)

        // Converter canvas para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to convert canvas to blob"))
            }
          },
          format === "png" ? "image/png" : "image/jpeg",
          format === "png" ? undefined : 0.9,
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load product image"))
      }

      img.src = product.imageUrl
    } catch (error) {
      reject(error)
    }
  })
}

// Função auxiliar para quebrar texto em linhas
function getLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + " " + word).width

    if (width < maxWidth) {
      currentLine += " " + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }

  lines.push(currentLine)
  return lines
}
