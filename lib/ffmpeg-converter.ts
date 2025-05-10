import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import { tmpdir } from "os"
import { ensureBinaries } from "./serverless-binaries"

// Configurar o caminho do FFmpeg
export async function configureFfmpeg() {
  try {
    const { ffmpegPath, ffprobePath } = await ensureBinaries()

    console.log(`Configurando FFmpeg: ${ffmpegPath}`)
    console.log(`Configurando FFprobe: ${ffprobePath}`)

    ffmpeg.setFfmpegPath(ffmpegPath)
    ffmpeg.setFfprobePath(ffprobePath)

    return true
  } catch (error) {
    console.error("Erro ao configurar FFmpeg:", error)
    throw error
  }
}

// Função para converter imagem em vídeo
export async function convertImageToVideo(
  imagePath: string,
  options = {
    duration: 10,
    fadeIn: 0.5,
    fadeOut: 0.5,
    audioPath: null as string | null,
  },
): Promise<string> {
  // Configurar FFmpeg antes de iniciar a conversão
  await configureFfmpeg()

  return new Promise((resolve, reject) => {
    // Criar diretório temporário se não existir
    const tmpDir = path.join(tmpdir(), "shopee-tiktok-generator")
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    // Gerar nome de arquivo único para o vídeo
    const timestamp = Date.now()
    const videoPath = path.join(tmpDir, `video-${timestamp}.mp4`)

    console.log(`Convertendo imagem ${imagePath} para vídeo ${videoPath}...`)

    // Criar comando FFmpeg
    let command = ffmpeg(imagePath)
      .loop(options.duration)
      .inputOptions("-framerate", "30")
      .videoFilters([
        `fade=t=in:st=0:d=${options.fadeIn}`,
        `fade=t=out:st=${options.duration - options.fadeOut}:d=${options.fadeOut}`,
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
      ])
      .outputOptions([
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        "30",
        "-movflags",
        "+faststart",
        "-profile:v",
        "main",
        "-level",
        "4.0",
        "-crf",
        "23",
      ])
      .duration(options.duration)

    // Adicionar áudio se fornecido
    if (options.audioPath && fs.existsSync(options.audioPath)) {
      command = command
        .input(options.audioPath)
        .audioFilters([
          `afade=t=in:st=0:d=${options.fadeIn}`,
          `afade=t=out:st=${options.duration - options.fadeOut}:d=${options.fadeOut}`,
        ])
        .outputOptions(["-c:a", "aac", "-b:a", "128k", "-shortest"])
    }

    // Executar a conversão
    command
      .output(videoPath)
      .on("start", (commandLine) => {
        console.log("Comando FFmpeg:", commandLine)
      })
      .on("progress", (progress) => {
        console.log(`Progresso: ${Math.floor(progress.percent || 0)}%`)
      })
      .on("error", (err) => {
        console.error("Erro na conversão:", err)
        reject(err)
      })
      .on("end", () => {
        console.log(`Vídeo gerado com sucesso: ${videoPath}`)
        resolve(videoPath)
      })
      .run()
  })
}
