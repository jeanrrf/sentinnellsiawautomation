import { exec } from "child_process"
import { promisify } from "util"
import { createLogger } from "../lib/logger"

const execAsync = promisify(exec)
const logger = createLogger("Cron")

// Run the scheduler every 5 minutes
const INTERVAL_MS = 5 * 60 * 1000

async function runScheduler() {
  try {
    logger.info("Running scheduler...")
    const { stdout, stderr } = await execAsync("node scripts/scheduler.js")

    if (stdout) {
      logger.info(`Scheduler output: ${stdout}`)
    }

    if (stderr) {
      logger.warn(`Scheduler errors: ${stderr}`)
    }

    logger.info("Scheduler execution completed")
  } catch (error) {
    logger.error("Error running scheduler:", error)
  }
}

// Run immediately on startup
runScheduler()

// Then run on the defined interval
setInterval(runScheduler, INTERVAL_MS)

logger.info(`Cron job started. Will run scheduler every ${INTERVAL_MS / 1000 / 60} minutes`)
