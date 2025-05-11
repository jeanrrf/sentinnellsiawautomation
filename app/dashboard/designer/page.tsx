import { Suspense } from "react"
import { ImageGeneratorPro } from "@/components/image-generator-pro"
import { getCachedProducts } from "@/lib/redis"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getProducts() {
  try {
    const products = await getCachedProducts()
    return products || []
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return []
  }
}

async function getProduct(productId: string) {
  try {
    const products = await getProducts()
    return products.find((p: any) => p.itemId === productId) || null
  } catch (error) {
    console.error("Erro ao buscar produto específico:", error)
    return null
  }
}

export default async function DesignerPage({ searchParams }: { searchParams: { productId?: string } }) {
  const products = await getProducts()
  const productId = searchParams.productId

  // Se temos um ID de produto na URL, verificamos se ele existe
  let selectedProduct = null
  if (productId) {
    selectedProduct = await getProduct(productId)

    // Se o produto não for encontrado, redirecionamos para a busca
    if (!selectedProduct) {
      console.warn(`Produto com ID ${productId} não encontrado. Redirecionando para busca.`)
      redirect("/dashboard/busca")
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-full px-4">
      <h1 className="text-3xl font-bold mb-6">Gerador de Imagens Profissional</h1>
      <p className="text-muted-foreground mb-6">
        Crie imagens de alta qualidade para TikTok e outras plataformas a partir dos seus produtos da Shopee.
      </p>

      <Suspense fallback={<div>Carregando produtos...</div>}>
        <ImageGeneratorPro products={products} initialProductId={productId} />
      </Suspense>
    </div>
  )
}
