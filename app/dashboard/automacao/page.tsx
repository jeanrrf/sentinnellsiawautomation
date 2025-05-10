import { ScheduleAutomation } from "@/components/schedule-automation"

export default function AutomacaoPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Automação de Geração de Vídeos</h1>
      <p className="text-muted-foreground mb-6">
        Configure a automação para gerar e publicar vídeos automaticamente, economizando seu tempo.
      </p>

      <ScheduleAutomation />
    </div>
  )
}
