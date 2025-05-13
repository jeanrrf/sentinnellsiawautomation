import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
}

async function main() {
  try {
    console.log("Starting scheduler...")

    // Check for schedules
    const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

    if (!fs.existsSync(schedulesPath)) {
      console.log("No schedules found")
      return
    }

    const rawData = fs.readFileSync(schedulesPath, "utf-8")
    const data = JSON.parse(rawData)
    const schedules = data.schedules || []

    if (schedules.length === 0) {
      console.log("No schedules found")
      return
    }

    // Get current date and time
    const now = new Date()
    const currentDate = now.toISOString().split("T")[0]
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5)

    // Check for schedules that need to be executed
    const schedulesToExecute = schedules.filter((schedule: Schedule) => {
      if (schedule.status !== "pending") {
        return false
      }

      const scheduleDate = new Date(`${schedule.date}T${schedule.time}:00`)
      const scheduleTimestamp = scheduleDate.getTime()
      const nowTimestamp = now.getTime()

      // Execute if the schedule time is in the past
      return scheduleTimestamp <= nowTimestamp
    })

    if (schedulesToExecute.length === 0) {
      console.log("No schedules to execute at this time")
      return
    }

    console.log(`Found ${schedulesToExecute.length} schedules to execute`)

    // Execute each schedule
    for (const schedule of schedulesToExecute) {
      console.log(`Executing schedule: ${schedule.id}`)

      // Run the video generation process
      await execAsync("node scripts/generate-videos.js")

      // Update schedule status
      if (schedule.frequency === "once") {
        schedule.status = "completed"
      } else {
        // For recurring schedules, calculate the next execution date
        const scheduleDate = new Date(`${schedule.date}T${schedule.time}:00`)

        if (schedule.frequency === "daily") {
          scheduleDate.setDate(scheduleDate.getDate() + 1)
        } else if (schedule.frequency === "weekly") {
          scheduleDate.setDate(scheduleDate.getDate() + 7)
        }

        schedule.date = scheduleDate.toISOString().split("T")[0]
      }
    }

    // Update schedules file
    fs.writeFileSync(schedulesPath, JSON.stringify({ schedules }, null, 2))

    console.log("Scheduler execution completed successfully!")
  } catch (error) {
    console.error("Error in scheduler execution:", error)
  }
}

main()
