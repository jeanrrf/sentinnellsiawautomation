import { ScheduleAutomation } from "@/components/schedule-automation"
import { RedisStatusIndicator } from "@/components/redis-status-indicator"

export default function AutomacaoPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Automação de Publicações</h1>
          <RedisStatusIndicator />
        </div>
        <p className="text-muted-foreground">Configure agendamentos para publicação automática de vídeos no TikTok.</p>

        <ScheduleAutomation />
      </div>
    </div>
  )
}
