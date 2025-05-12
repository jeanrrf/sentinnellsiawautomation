import { promisify } from "util"
import { exec } from "child_process"
import { createLogger } from "../lib/logger"

const execAsync = promisify(exec)
const logger = createLogger("Cron")

/**
 * Main function
 */
async function main() {
  try {
    logger.info("Starting cron job...")

    // Chamar a API de cron para executar agendamentos
    try {
      const { stdout, stderr } = await execAsync("curl -X GET http://localhost:3000/api/cron")

      if (stderr) {
        logger.error("Error executing cron API:", stderr)
      } else {
        logger.info("Cron API response:", stdout)
      }
    } catch (error) {
      logger.error("Failed to execute cron API:", error)
    }

    logger.info("Cron job completed")
  } catch (error) {
    logger.error("Error in cron execution:", error)
  }
}

// Execute main function
main()
