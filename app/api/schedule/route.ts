import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import storageService from "@/lib/storage-service"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:Schedule")

export async function GET() {
  try {
    const schedules = await storageService.getSchedules()

    return NextResponse.json({
      success: true,
      schedules,
    })
  } catch (error: any) {
    logger.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao buscar agendamentos: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Validar dados do agendamento
    if (!data.date || !data.time || !data.frequency) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados de agendamento inválidos",
        },
        { status: 400 },
      )
    }

    // Criar ou atualizar agendamento
    const schedule = {
      id: data.id || uuidv4(),
      date: data.date,
      time: data.time,
      frequency: data.frequency,
      status: data.status || "pending",
      type: data.type || "standard",
      lastRun: data.lastRun,
      productCount: data.productCount,
      generatedCards: data.generatedCards || [],
      errors: data.errors || [],
    }

    await storageService.saveSchedule(schedule)

    return NextResponse.json({
      success: true,
      schedule,
      message: "Agendamento salvo com sucesso",
    })
  } catch (error: any) {
    logger.error("Erro ao salvar agendamento:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao salvar agendamento: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do agendamento não fornecido",
        },
        { status: 400 },
      )
    }

    await storageService.deleteSchedule(id)

    return NextResponse.json({
      success: true,
      message: "Agendamento excluído com sucesso",
    })
  } catch (error: any) {
    logger.error("Erro ao excluir agendamento:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao excluir agendamento: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
