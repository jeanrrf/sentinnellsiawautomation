export function monitorResourceUsage() {
  const startTime = Date.now()
  const startMemory = process.memoryUsage().heapUsed

  // Limites para funções serverless da Vercel
  const MAX_EXECUTION_TIME = 60000 // 60 segundos
  const MAX_MEMORY = 1024 * 1024 * 1024 // 1GB

  return {
    getStats: () => {
      const currentMemory = process.memoryUsage().heapUsed
      const memoryIncrease = currentMemory - startMemory
      const elapsedTime = Date.now() - startTime

      // Calcular percentuais em relação aos limites
      const memoryPercentage = Math.round((memoryIncrease / MAX_MEMORY) * 100)
      const timePercentage = Math.round((elapsedTime / MAX_EXECUTION_TIME) * 100)

      return {
        startTime,
        elapsedTime,
        startMemory: Math.round(startMemory / (1024 * 1024)),
        currentMemory: Math.round(currentMemory / (1024 * 1024)),
        memoryUsage: Math.round(memoryIncrease / (1024 * 1024)),
        memoryPercentage,
        timePercentage,
        isMemoryCritical: memoryPercentage > 80,
        isTimeCritical: timePercentage > 80,
      }
    },

    isApproachingLimits: () => {
      const stats = this.getStats()
      return stats.isMemoryCritical || stats.isTimeCritical
    },
  }
}
