import ModernCardDesigner from "@/components/modern-card-designer"

export default function ModernCardsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4">Designer de Cards Modernos</h1>
      <p className="text-muted-foreground mb-8">
        Crie cards modernos e visualmente atraentes para seus produtos com nosso designer avançado.
      </p>

      <ModernCardDesigner />
    </div>
  )
}
