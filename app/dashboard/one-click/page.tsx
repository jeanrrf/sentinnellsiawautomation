import { SuperCardGenerator } from "@/components/super-card-generator"

export default function OneClickPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Geração Automática de Cards</h1>
      <p className="text-gray-600 mb-8">
        Use esta superferramenta para gerar e baixar cards de produtos com apenas um clique. Agora com o design elegante
        da aba Busca e opções avançadas de personalização.
      </p>

      <div className="grid grid-cols-1 gap-8">
        <SuperCardGenerator />
      </div>
    </div>
  )
}
