import { AutoGenerationScheduler } from "@/components/auto-generation-scheduler"

export default function SchedulerPage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Agendamento de Geração Automática</h1>
      <AutoGenerationScheduler />
    </div>
  )
}
