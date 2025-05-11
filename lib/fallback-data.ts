/**
 * Este arquivo contém dados de fallback para quando o Redis não estiver disponível
 * Usado apenas em situações de emergência para manter a aplicação funcionando
 */

// Produtos de fallback (usados apenas quando o Redis não está disponível)
export const fallbackProducts = [
  {
    itemId: "fallback-1",
    productName: "Produto de Fallback 1",
    price: 99.9,
    discountPrice: 79.9,
    imageUrl: "https://cf.shopee.com.br/file/br-11134201-7qukw-lf6zz3flmxhv6f",
    shopName: "Loja Exemplo",
    sales: 1250,
    rating: 4.8,
    commissionRate: 5.0,
    offerUrl: "https://shopee.com.br",
    fallback: true,
  },
  {
    itemId: "fallback-2",
    productName: "Produto de Fallback 2",
    price: 149.9,
    discountPrice: 129.9,
    imageUrl: "https://cf.shopee.com.br/file/br-11134201-7qukw-lf6zz3flmxhv6f",
    shopName: "Loja Exemplo",
    sales: 850,
    rating: 4.5,
    commissionRate: 4.5,
    offerUrl: "https://shopee.com.br",
    fallback: true,
  },
  {
    itemId: "fallback-3",
    productName: "Produto de Fallback 3",
    price: 199.9,
    discountPrice: 159.9,
    imageUrl: "https://cf.shopee.com.br/file/br-11134201-7qukw-lf6zz3flmxhv6f",
    shopName: "Loja Exemplo",
    sales: 2100,
    rating: 4.9,
    commissionRate: 6.0,
    offerUrl: "https://shopee.com.br",
    fallback: true,
  },
]

// Descrições de fallback
export const fallbackDescriptions = {
  "fallback-1":
    "Este é um produto de fallback usado quando o Redis não está disponível. Oferece excelente qualidade e durabilidade.",
  "fallback-2": "Produto de fallback com ótimo custo-benefício. Ideal para uso diário e com garantia de satisfação.",
  "fallback-3": "O melhor produto de fallback da categoria. Recomendado por especialistas e com entrega rápida.",
}
