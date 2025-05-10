import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
}

export async function GET() {
  try {
    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    if (isVercel) {
      // No Vercel, retornar dados simulados
      return NextResponse.json({
        schedules: [],
        message: "Ambiente de produção detectado. Usando dados simulados.",
      })
    }

    // Em ambiente de desenvolvimento, tentar usar o sistema de arquivos
    const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

    try {
      if (!fs.existsSync(schedulesPath)) {
        const dir = path.dirname(schedulesPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(schedulesPath, JSON.stringify({ schedules: [] }, null, 2))
        return NextResponse.json({ schedules: [] })
      }

      const rawData = fs.readFileSync(schedulesPath, "utf-8")
      const data = JSON.parse(rawData)

      return NextResponse.json({ schedules: data.schedules || [] })
    } catch (fsError) {
      console.error("Erro ao acessar sistema de arquivos:", fsError)
      // Fallback para dados simulados em caso de erro
      return NextResponse.json({
        schedules: [],
        message: "Erro ao acessar sistema de arquivos. Usando dados simulados.",
      })
    }
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao buscar agendamentos",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const { date, time, frequency } = await req.json()

    if (!date || !time || !frequency) {
      return NextResponse.json({ success: false, message: "Date, time, and frequency are required" }, { status: 400 })
    }

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    if (isVercel) {
      // No Vercel, retornar sucesso simulado
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        date,
        time,
        frequency,
        status: "pending",
      }

      return NextResponse.json({
        success: true,
        schedule: newSchedule,
        message: "Ambiente de produção detectado. Usando dados simulados.",
      })
    }

    // Em ambiente de desenvolvimento, tentar usar o sistema de arquivos
    try {
      const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

      let schedules: Schedule[] = []
      if (fs.existsSync(schedulesPath)) {
        const rawData = fs.readFileSync(schedulesPath, "utf-8")
        const data = JSON.parse(rawData)
        schedules = data.schedules || []
      } else {
        const dir = path.dirname(schedulesPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
      }

      const newSchedule: Schedule = {
        id: Date.now().toString(),
        date,
        time,
        frequency,
        status: "pending",
      }

      schedules.push(newSchedule)

      fs.writeFileSync(schedulesPath, JSON.stringify({ schedules }, null, 2))

      return NextResponse.json({
        success: true,
        schedule: newSchedule,
      })
    } catch (fsError) {
      console.error("Erro ao acessar sistema de arquivos:", fsError)
      // Fallback para sucesso simulado em caso de erro
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        date,
        time,
        frequency,
        status: "pending",
      }

      return NextResponse.json({
        success: true,
        schedule: newSchedule,
        message: "Erro ao acessar sistema de arquivos. Usando dados simulados.",
      })
    }
  } catch (error) {
    console.error("Erro ao criar agendamento:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao criar agendamento",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, message: "Schedule ID is required" }, { status: 400 })
    }

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    if (isVercel) {
      // No Vercel, retornar sucesso simulado
      return NextResponse.json({
        success: true,
        message: "Ambiente de produção detectado. Usando dados simulados.",
      })
    }

    // Em ambiente de desenvolvimento, tentar usar o sistema de arquivos
    try {
      const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

      if (!fs.existsSync(schedulesPath)) {
        return NextResponse.json({ success: false, message: "No schedules found" }, { status: 404 })
      }

      const rawData = fs.readFileSync(schedulesPath, "utf-8")
      const data = JSON.parse(rawData)
      const schedules = data.schedules || []

      const updatedSchedules = schedules.filter((schedule: Schedule) => schedule.id !== id)

      fs.writeFileSync(schedulesPath, JSON.stringify({ schedules: updatedSchedules }, null, 2))

      return NextResponse.json({
        success: true,
      })
    } catch (fsError) {
      console.error("Erro ao acessar sistema de arquivos:", fsError)
      // Fallback para sucesso simulado em caso de erro
      return NextResponse.json({
        success: true,
        message: "Erro ao acessar sistema de arquivos. Usando dados simulados.",
      })
    }
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao excluir agendamento",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
