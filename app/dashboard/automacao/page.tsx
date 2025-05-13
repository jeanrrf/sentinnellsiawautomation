import { SuperCardGenerator } from "@/components/super-card-generator"
import { ScheduleAutomation } from "@/components/schedule-automation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AutomacaoPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Automação de Geração de Cards</h1>
      <p className="text-muted-foreground mb-6">
        Configure a automação para gerar e publicar cards automaticamente, economizando seu tempo.
      </p>

      <Tabs defaultValue="super" className="w-full mb-8">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="super">Super Gerador</TabsTrigger>
          <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="super">
          <SuperCardGenerator />
        </TabsContent>

        <TabsContent value="schedules">
          <ScheduleAutomation />
        </TabsContent>
      </Tabs>
    </div>
  )
}
