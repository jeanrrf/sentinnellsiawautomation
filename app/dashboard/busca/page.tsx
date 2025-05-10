import { Suspense } from "react"
import { AutoSearch } from "@/components/auto-search"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function BuscaPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Busca de Produtos da Shopee</h1>
      <p className="text-muted-foreground mb-6">
        Use esta página para buscar e visualizar produtos da Shopee. Para gerar vídeos, use a aba "Designer".
      </p>

      <Suspense fallback={<div>Carregando interface de busca...</div>}>
        <AutoSearch />
      </Suspense>
    </div>
  )
}
