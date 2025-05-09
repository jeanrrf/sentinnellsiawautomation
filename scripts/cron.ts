import { CronJob } from "cron"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Run the scheduler every minute
const job = new CronJob("* * * * *", async () => {
  try {
    console.log(`Running scheduler at ${new Date().toISOString()}`)
    await execAsync("node scripts/scheduler.js")
  } catch (error) {
    console.error("Error running scheduler:", error)
  }
})

console.log("Starting cron job for scheduler...")
job.start()
