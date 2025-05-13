import { AnimatedProductCard } from "@/components/animated-product-card"

export default function AnimatedCardsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Cards Animados</h1>
      <p className="text-muted-foreground mb-8">
        Crie cards com transição automática entre múltiplas imagens do produto
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Produto Mais Vendido</h2>
          <AnimatedProductCard autoFetch={true} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Transição Slide</h2>
          <AnimatedProductCard autoFetch={true} transitionType="slide" transitionSpeed={1500} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Transição Zoom</h2>
          <AnimatedProductCard autoFetch={true} transitionType="zoom" transitionSpeed={2000} />
        </div>
      </div>
    </div>
  )
}
