import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getShopeeService } from "@/lib/shopee-product-service"

const logger = createLogger("search-products-api")

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Parâmetro de busca 'query' é obrigatório" }, { status: 400 })
  }

  try {
    logger.info(`Buscando produtos com a query: ${query}`)

    // Tentar usar o serviço real da Shopee
    const shopeeService = getShopeeService()

    if (shopeeService) {
      try {
        const products = await shopeeService.searchProducts({
          keyword: query,
          limit: 10,
          sortType: 2, // Ordenar por vendas
        })

        logger.info(`Encontrados ${products.length} produtos para a query: ${query}`)

        // Mapear os produtos para o formato esperado pela UI
        const formattedProducts = products.map((product) => ({
          id: product.itemId,
          name: product.productName,
          image: product.imageUrl,
          price: product.price,
          sales: product.sales || "0",
          rating: product.ratingStar || "0",
        }))

        return NextResponse.json({ products: formattedProducts })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
        logger.error(`Erro ao buscar produtos da API Shopee: ${errorMessage}`)
        // Continuar para usar dados de fallback
      }
    } else {
      logger.info("Serviço Shopee não disponível, usando dados de fallback")
    }

    // Fallback para dados de exemplo se a API da Shopee falhar
    logger.info(`Usando dados de fallback para a query: ${query}`)

    // Dados de exemplo mais completos
    const mockProducts = [
      {
        id: "123456789",
        name: "Smartphone Galaxy S23 Ultra 256GB",
        image: "https://cf.shopee.com.br/file/br-11134201-7qukw-lf6z6n7vyw6s11",
        price: "R$ 5.499,00",
        sales: "1245",
        rating: "4.8",
      },
      {
        id: "987654321",
        name: "Notebook Dell Inspiron 15 i7 16GB",
        image: "https://cf.shopee.com.br/file/sg-11134201-7qvf3-lf6z6n7z4hcw6e",
        price: "R$ 4.299,00",
        sales: "876",
        rating: "4.7",
      },
      {
        id: "456789123",
        name: "Fone de Ouvido Bluetooth JBL",
        image: "https://cf.shopee.com.br/file/sg-11134201-7qvct-lf6z6n83rlcw7c",
        price: "R$ 199,90",
        sales: "3421",
        rating: "4.5",
      },
      {
        id: "789123456",
        name: "Smart TV LG 55 polegadas 4K",
        image: "https://cf.shopee.com.br/file/sg-11134201-7qvf1-lf6z6n87oucw25",
        price: "R$ 2.799,00",
        sales: "532",
        rating: "4.6",
      },
      {
        id: "321654987",
        name: "Câmera DSLR Canon EOS Rebel T7",
        image: "https://cf.shopee.com.br/file/sg-11134201-7qvdz-lf6z6n8bm4cw87",
        price: "R$ 2.499,00",
        sales: "298",
        rating: "4.4",
      },
      {
        id: "654987321",
        name: "Smartwatch Apple Watch Series 8",
        image: "https://cf.shopee.com.br/file/sg-11134201-7qvex-lf6z6n8fmscw1e",
        price: "R$ 3.199,00",
        sales: "754",
        rating: "4.9",
      },
      {
        id: "147258369",
        name: "Tablet Samsung Galaxy Tab S8",
        image: "https://cf.shopee.com.br/file/sg-11134201-7qvdv-lf6z6n8jn0cw6f",
        price: "R$ 3.599,00",
        sales: "421",
        rating: "4.7",
      },
      {
        id: "258369147",
        name: "Console PlayStation 5 Digital Edition",
        image: "https://cf.shopee.com.br/file/sg-11134201-7qvdt-lf6z6n8nkgcw0c",
        price: "R$ 3.799,00",
        sales: "865",
        rating: "4.8",
      },
    ]

    // Implementar busca mais inteligente
    // Busca em nome, descrição e outras propriedades
    // Pontuação baseada em correspondência exata, início da palavra, etc.
    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0)

    const scoredProducts = mockProducts.map((product) => {
      const nameLower = product.name.toLowerCase()
      let score = 0

      // Verificar correspondência exata
      if (nameLower === query.toLowerCase()) {
        score += 100
      }

      // Verificar se o nome começa com a consulta
      if (nameLower.startsWith(query.toLowerCase())) {
        score += 50
      }

      // Verificar correspondência de termos individuais
      for (const term of searchTerms) {
        if (nameLower.includes(term)) {
          score += 10 + (term.length / query.length) * 10

          // Bônus para correspondência no início de uma palavra
          const wordBoundaryRegex = new RegExp(`\\b${term}`, "i")
          if (wordBoundaryRegex.test(product.name)) {
            score += 5
          }
        }
      }

      return { product, score }
    })

    // Filtrar produtos com pontuação > 0 e ordenar por pontuação
    const filteredProducts = scoredProducts
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product)

    logger.info(`Encontrados ${filteredProducts.length} produtos para a query: ${query}`)

    return NextResponse.json({ products: filteredProducts })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao buscar produtos: ${errorMessage}`)

    return NextResponse.json({ error: "Erro ao buscar produtos", details: errorMessage }, { status: 500 })
  }
}
