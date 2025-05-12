import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SuperCardGenerator } from "@/components/super-card-generator"
import { AutoGenerationScheduler } from "@/components/auto-generation-scheduler"

export default function AutomacaoPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Automação de Geração de Cards</h1>
      <p className="text-muted-foreground mb-6">
        Configure a automação para gerar e publicar cards automaticamente, economizando seu tempo.
      </p>

      <Tabs defaultValue="quick" className="w-full mb-8">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="quick">Geração Rápida</TabsTrigger>
          <TabsTrigger value="scheduler">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Use esta ferramenta para gerar e baixar cards de produtos com apenas um clique. Agora com design elegante
              e opções avançadas de personalização.
            </p>
          </div>
          <SuperCardGenerator />
        </TabsContent>

        <TabsContent value="scheduler">
          <AutoGenerationScheduler />
        </TabsContent>
      </Tabs>
    </div>
  )
}
