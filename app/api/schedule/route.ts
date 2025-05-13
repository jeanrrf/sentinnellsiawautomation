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
    const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

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
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch schedules" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { date, time, frequency } = await req.json()

    if (!date || !time || !frequency) {
      return NextResponse.json({ success: false, message: "Date, time, and frequency are required" }, { status: 400 })
    }

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
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ success: false, message: "Failed to create schedule" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, message: "Schedule ID is required" }, { status: 400 })
    }

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
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json({ success: false, message: "Failed to delete schedule" }, { status: 500 })
  }
}
