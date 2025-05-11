import { OneClickGenerator } from "@/components/one-click-generator"

export default function OneClickPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Geração Automática de Cards</h1>
      <p className="text-gray-600 mb-8">
        Use esta ferramenta para gerar e baixar cards de produtos em alta diretamente da API da Shopee com apenas um
        clique.
      </p>

      <div className="grid grid-cols-1 gap-8">
        <OneClickGenerator />
      </div>
    </div>
  )
}
