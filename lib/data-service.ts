/**
 * Serviço de dados para o sistema
 * Este serviço fornece uma interface unificada para acessar dados
 */

import { createLogger } from "./logger"
import storageService from "./storage-service"

const logger = createLogger("data-service")

// Interface para opções de busca
export interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  filter?: Record<string, any>
}

// Classe de serviço de dados
class DataService {
  // Métodos para vídeos
  async getVideos(options?: SearchOptions) {
    try {
      const videos = await storageService.getVideos()

      // Aplicar filtros se fornecidos
      let filteredVideos = [...videos]
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          filteredVideos = filteredVideos.filter((video) => video[key] === value)
        })
      }

      // Aplicar ordenação se fornecida
      if (options?.sortBy) {
        filteredVideos.sort((a, b) => {
          const aValue = a[options.sortBy]
          const bValue = b[options.sortBy]

          if (aValue < bValue) return options.sortOrder === "desc" ? 1 : -1
          if (aValue > bValue) return options.sortOrder === "desc" ? -1 : 1
          return 0
        })
      }

      // Aplicar paginação se fornecida
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0
        const limit = options.limit || filteredVideos.length
        filteredVideos = filteredVideos.slice(offset, offset + limit)
      }

      return filteredVideos
    } catch (error) {
      logger.error("Erro ao buscar vídeos:", error)
      throw error
    }
  }

  async getVideoById(id: string) {
    try {
      const videos = await storageService.getVideos()
      return videos.find((video) => video.id === id)
    } catch (error) {
      logger.error(`Erro ao buscar vídeo ${id}:`, error)
      throw error
    }
  }

  async saveVideo(videoData: any) {
    try {
      await storageService.saveVideo(videoData)
      return videoData
    } catch (error) {
      logger.error("Erro ao salvar vídeo:", error)
      throw error
    }
  }

  async deleteVideo(id: string) {
    try {
      await storageService.deleteVideo(id)
      return true
    } catch (error) {
      logger.error(`Erro ao excluir vídeo ${id}:`, error)
      throw error
    }
  }

  // Métodos para produtos
  async getProducts(options?: SearchOptions) {
    try {
      const products = await storageService.getProducts()

      // Aplicar filtros se fornecidos
      let filteredProducts = [...products]
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          filteredProducts = filteredProducts.filter((product) => product[key] === value)
        })
      }

      // Aplicar ordenação se fornecida
      if (options?.sortBy) {
        filteredProducts.sort((a, b) => {
          const aValue = a[options.sortBy]
          const bValue = b[options.sortBy]

          if (aValue < bValue) return options.sortOrder === "desc" ? 1 : -1
          if (aValue > bValue) return options.sortOrder === "desc" ? -1 : 1
          return 0
        })
      }

      // Aplicar paginação se fornecida
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0
        const limit = options.limit || filteredProducts.length
        filteredProducts = filteredProducts.slice(offset, offset + limit)
      }

      return filteredProducts
    } catch (error) {
      logger.error("Erro ao buscar produtos:", error)
      throw error
    }
  }

  async getProductById(id: string) {
    try {
      const products = await storageService.getProducts()
      return products.find((product) => product.itemId === id)
    } catch (error) {
      logger.error(`Erro ao buscar produto ${id}:`, error)
      throw error
    }
  }

  // Métodos para agendamentos
  async getSchedules(options?: SearchOptions) {
    try {
      const schedules = await storageService.getSchedules()

      // Aplicar filtros se fornecidos
      let filteredSchedules = [...schedules]
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          filteredSchedules = filteredSchedules.filter((schedule) => schedule[key] === value)
        })
      }

      // Aplicar ordenação se fornecida
      if (options?.sortBy) {
        filteredSchedules.sort((a, b) => {
          const aValue = a[options.sortBy]
          const bValue = b[options.sortBy]

          if (aValue < bValue) return options.sortOrder === "desc" ? 1 : -1
          if (aValue > bValue) return options.sortOrder === "desc" ? -1 : 1
          return 0
        })
      }

      // Aplicar paginação se fornecida
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0
        const limit = options.limit || filteredSchedules.length
        filteredSchedules = filteredSchedules.slice(offset, offset + limit)
      }

      return filteredSchedules
    } catch (error) {
      logger.error("Erro ao buscar agendamentos:", error)
      throw error
    }
  }

  async getScheduleById(id: string) {
    try {
      const schedules = await storageService.getSchedules()
      return schedules.find((schedule) => schedule.id === id)
    } catch (error) {
      logger.error(`Erro ao buscar agendamento ${id}:`, error)
      throw error
    }
  }

  async saveSchedule(scheduleData: any) {
    try {
      await storageService.saveSchedule(scheduleData)
      return scheduleData
    } catch (error) {
      logger.error("Erro ao salvar agendamento:", error)
      throw error
    }
  }

  async deleteSchedule(id: string) {
    try {
      await storageService.deleteSchedule(id)
      return true
    } catch (error) {
      logger.error(`Erro ao excluir agendamento ${id}:`, error)
      throw error
    }
  }

  // Métodos para descrições
  async getDescription(productId: string) {
    try {
      return await storageService.getDescription(productId)
    } catch (error) {
      logger.error(`Erro ao buscar descrição para produto ${productId}:`, error)
      throw error
    }
  }

  async saveDescription(productId: string, description: string) {
    try {
      await storageService.saveDescription(productId, description)
      return description
    } catch (error) {
      logger.error(`Erro ao salvar descrição para produto ${productId}:`, error)
      throw error
    }
  }
}

// Instância única do serviço de dados
const dataService = new DataService()

export default dataService
