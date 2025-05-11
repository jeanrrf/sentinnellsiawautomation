import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutoSearch } from "@/components/auto-search"
import { AISearchCards } from "@/components/ai-search-cards"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function BuscaPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Busca de Produtos da Shopee</h1>
      <p className="text-muted-foreground mb-6">
        Use esta página para buscar e visualizar produtos da Shopee. Escolha entre a busca manual com filtros
        personalizados ou a busca inteligente com IA.
      </p>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">Busca Inteligente com IA</TabsTrigger>
          <TabsTrigger value="manual">Busca Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Busca Inteligente com IA</h2>
            <p className="text-sm text-muted-foreground">
              Selecione uma das categorias pré-definidas para encontrar os melhores produtos. Cada categoria usa
              algoritmos de IA para selecionar até 5 produtos otimizados. Gere automaticamente cards e descrições para
              suas redes sociais.
            </p>
          </div>

          <Suspense fallback={<div>Carregando busca inteligente...</div>}>
            <AISearchCards />
          </Suspense>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Busca Manual</h2>
            <p className="text-sm text-muted-foreground">
              Configure manualmente os parâmetros de busca para encontrar produtos específicos. Defina limites,
              ordenação e categorias para personalizar sua busca.
            </p>
          </div>

          <Suspense fallback={<div>Carregando interface de busca...</div>}>
            <AutoSearch />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
