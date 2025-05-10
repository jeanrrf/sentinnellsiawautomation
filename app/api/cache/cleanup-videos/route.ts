import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { tmpdir } from "os"
import { kv } from "@vercel/kv"

export async function POST(req: Request) {
  try {
    const { olderThan = 24, dryRun = false } = await req.json()

    // Converter horas em milissegundos
    const olderThanMs = olderThan * 60 * 60 * 1000
    const now = Date.now()

    // Diretório temporário onde os vídeos são armazenados
    const tmpDir = path.join(tmpdir(), "shopee-tiktok-generator")

    // Verificar se o diretório existe
    if (!fs.existsSync(tmpDir)) {
      return NextResponse.json({
        success: true,
        message: "Diretório de cache não encontrado, nada para limpar",
        filesRemoved: 0,
        keysRemoved: 0,
      })
    }

    // Listar todos os arquivos no diretório
    const files = fs.readdirSync(tmpDir)

    // Filtrar apenas arquivos de vídeo
    const videoFiles = files.filter((file) => file.endsWith(".mp4") || file.endsWith(".webm") || file.endsWith(".png"))

    console.log(`Encontrados ${videoFiles.length} arquivos de vídeo/imagem no cache`)

    // Arquivos que serão removidos
    const filesToRemove = []

    // Verificar cada arquivo
    for (const file of videoFiles) {
      const filePath = path.join(tmpDir, file)
      const stats = fs.statSync(filePath)

      // Verificar se o arquivo é mais antigo que o limite
      if (now - stats.mtimeMs > olderThanMs) {
        filesToRemove.push(filePath)
      }
    }

    console.log(`${filesToRemove.length} arquivos serão removidos`)

    // Remover arquivos se não for um dry run
    if (!dryRun) {
      for (const filePath of filesToRemove) {
        try {
          fs.unlinkSync(filePath)
          console.log(`Removido: ${filePath}`)
        } catch (error) {
          console.error(`Erro ao remover ${filePath}:`, error)
        }
      }
    }

    // Buscar e remover chaves de cache relacionadas a vídeos
    const keys = await kv.keys("video:*")
    const keysToRemove = []

    for (const key of keys) {
      const cacheEntry = await kv.get(key)

      // Verificar se a entrada de cache tem um caminho de vídeo
      if (cacheEntry && cacheEntry.videoPath) {
        // Verificar se o arquivo ainda existe
        if (!fs.existsSync(cacheEntry.videoPath) || filesToRemove.includes(cacheEntry.videoPath)) {
          keysToRemove.push(key)
        }
      }
    }

    console.log(`${keysToRemove.length} chaves de cache serão removidas`)

    // Remover chaves se não for um dry run
    if (!dryRun && keysToRemove.length > 0) {
      await kv.del(...keysToRemove)
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Simulação: ${filesToRemove.length} arquivos e ${keysToRemove.length} chaves seriam removidos`
        : `Limpeza concluída: ${filesToRemove.length} arquivos e ${keysToRemove.length} chaves removidos`,
      filesRemoved: dryRun ? 0 : filesToRemove.length,
      keysRemoved: dryRun ? 0 : keysToRemove.length,
      dryRun,
    })
  } catch (error) {
    console.error("Erro ao limpar cache de vídeos:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao limpar cache: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
