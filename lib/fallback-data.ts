export const fallbackProducts = [
  {
    id: "1001",
    name: "Smartphone XYZ Pro Max",
    image: "/modern-smartphone.png",
    price: "R$ 1.999,00",
    sales: "1250",
    rating: "4.8",
  },
  {
    id: "1002",
    name: "Fone de Ouvido Bluetooth Premium",
    image: "/diverse-people-listening-headphones.png",
    price: "R$ 299,90",
    sales: "3420",
    rating: "4.7",
  },
  {
    id: "1003",
    name: 'Notebook Ultra Slim 15.6"',
    image: "/modern-laptop-workspace.png",
    price: "R$ 3.499,00",
    sales: "890",
    rating: "4.5",
  },
  {
    id: "1004",
    name: "Smartwatch Fitness Tracker",
    image: "/modern-smartwatch.png",
    price: "R$ 399,90",
    sales: "2150",
    rating: "4.6",
  },
  {
    id: "1005",
    name: "Câmera Digital 4K",
    image: "/digital-camera.png",
    price: "R$ 1.299,00",
    sales: "780",
    rating: "4.4",
  },
  {
    id: "1006",
    name: 'Tablet 10" Ultra HD',
    image: "/modern-tablet-display.png",
    price: "R$ 899,00",
    sales: "1560",
    rating: "4.3",
  },
  {
    id: "1007",
    name: "Caixa de Som Bluetooth à Prova D'água",
    image: "/bluetooth-speaker.png",
    price: "R$ 199,90",
    sales: "2890",
    rating: "4.6",
  },
  {
    id: "1008",
    name: "Mouse Gamer RGB 16000 DPI",
    image: "/gaming-mouse.png",
    price: "R$ 249,90",
    sales: "1970",
    rating: "4.7",
  },
]

export const generatePlaceholderMedia = (productId: string, productName: string) => {
  return {
    id: `media-${productId}`,
    productId: productId,
    name: productName,
    images: Array.from({ length: 3 }).map((_, index) => {
      const encodedName = encodeURIComponent(`${productName} - Imagem ${index + 1}`)
      return `/placeholder.svg?height=800&width=800&query=${encodedName}`
    }),
    videos: [],
    isPlaceholder: true,
  }
}
