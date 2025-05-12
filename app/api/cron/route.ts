import { NextResponse } from "next/server"
import storageService from "@/lib/storage-service"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:Cron")

export async function GET() {
  try {
    // Obter todos os agendamentos
    const schedules = await storageService.getSchedules()

    // Filtrar agendamentos pendentes
    const pendingSchedules = schedules.filter((schedule) => schedule.status === "pending")

    // Verificar se há agendamentos para executar
    if (pendingSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum agendamento pendente para executar",
        executed: 0,
      })
    }

    // Obter data e hora atual
    const now = new Date()

    // Verificar quais agendamentos devem ser executados
    const schedulesToExecute = pendingSchedules.filter((schedule) => {
      const scheduleDate = new Date(`${schedule.date}T${schedule.time}:00`)
      return scheduleDate <= now
    })

    if (schedulesToExecute.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum agendamento para executar neste momento",
        executed: 0,
      })
    }

    // Executar agendamentos
    for (const schedule of schedulesToExecute) {
      // Atualizar status e última execução
      schedule.lastRun = now.toISOString()

      // Lógica simplificada de execução
      schedule.generatedCards = schedule.generatedCards || []
      schedule.errors = schedule.errors || []

      // Atualizar status com base na frequência
      if (schedule.frequency === "once") {
        schedule.status = "completed"
      } else {
        // Calcular próxima data de execução
        const nextDate = new Date(`${schedule.date}T${schedule.time}:00`)

        if (schedule.frequency === "daily") {
          nextDate.setDate(nextDate.getDate() + 1)
        } else if (schedule.frequency === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7)
        }

        schedule.date = nextDate.toISOString().split("T")[0]
      }

      // Salvar agendamento atualizado
      await storageService.saveSchedule(schedule)
    }

    return NextResponse.json({
      success: true,
      message: `${schedulesToExecute.length} agendamentos executados`,
      executed: schedulesToExecute.length,
    })
  } catch (error: any) {
    logger.error("Erro ao executar agendamentos:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao executar agendamentos: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
