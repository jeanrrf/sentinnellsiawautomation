import { Suspense } from "react"
import { VideoGeneratorPro } from "@/components/video-generator-pro"
import { getCachedProducts } from "@/lib/redis"

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

export default async function BuscaPage() {
  const products = await getProducts()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gerador de Vídeos para TikTok</h1>

      <Suspense fallback={<div>Carregando produtos...</div>}>
        <VideoGeneratorPro products={products} />
      </Suspense>
    </div>
  )
}
