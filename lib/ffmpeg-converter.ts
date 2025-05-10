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

// Função para converter imagem em vídeo com melhor tratamento de erros e mais opções
export async function convertImageToVideo(
  imagePath: string,
  options = {
    duration: 10,
    fadeIn: 0.5,
    fadeOut: 0.5,
    audioPath: null as string | null,
    resolution: "1080p" as "720p" | "1080p" | "square" | "landscape",
    quality: "medium" as "low" | "medium" | "high",
    fps: 30,
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
    console.log(`Opções: ${JSON.stringify(options)}`)

    // Definir dimensões com base na resolução
    let width = 1080
    let height = 1920

    if (options.resolution === "720p") {
      width = 720
      height = 1280
    } else if (options.resolution === "square") {
      width = 1080
      height = 1080
    } else if (options.resolution === "landscape") {
      width = 1920
      height = 1080
    }

    // Definir qualidade com base na opção
    let crf = "23" // Médio (padrão)
    if (options.quality === "low") {
      crf = "28" // Menor qualidade, arquivo menor
    } else if (options.quality === "high") {
      crf = "18" // Alta qualidade, arquivo maior
    }

    // Criar comando FFmpeg com mais opções e melhor tratamento de erros
    let command = ffmpeg(imagePath)
      .loop(options.duration)
      .inputOptions("-framerate", options.fps.toString())
      .videoFilters([
        `fade=t=in:st=0:d=${options.fadeIn}`,
        `fade=t=out:st=${options.duration - options.fadeOut}:d=${options.fadeOut}`,
        `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        // Adicionar um leve zoom para dar movimento
        "zoompan=z='min(zoom+0.0005,1.1)':d=1:s=1080x1920",
      ])
      .outputOptions([
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        options.fps.toString(),
        "-movflags",
        "+faststart",
        "-profile:v",
        "main",
        "-level",
        "4.0",
        "-crf",
        crf,
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

    // Adicionar manipuladores de eventos para melhor logging e tratamento de erros
    command
      .on("start", (commandLine) => {
        console.log("Comando FFmpeg:", commandLine)
      })
      .on("progress", (progress) => {
        console.log(`Progresso: ${Math.floor(progress.percent || 0)}% concluído`)
        console.log(`Frame atual: ${progress.frames}, FPS: ${progress.currentFps}`)
        console.log(`Tempo processado: ${progress.timemark}`)
      })
      .on("error", (err, stdout, stderr) => {
        console.error("Erro na conversão:", err)
        console.error("Saída padrão:", stdout)
        console.error("Saída de erro:", stderr)

        // Verificar se o arquivo de saída foi criado mesmo com erro
        if (fs.existsSync(videoPath) && fs.statSync(videoPath).size > 0) {
          console.warn("Erro ocorreu, mas o arquivo de vídeo foi criado. Tentando continuar...")
          resolve(videoPath)
        } else {
          reject(err)
        }
      })
      .on("end", (stdout, stderr) => {
        console.log(`Vídeo gerado com sucesso: ${videoPath}`)
        console.log("Saída padrão:", stdout)

        if (stderr) {
          console.warn("Avisos durante a conversão:", stderr)
        }

        // Verificar se o arquivo foi criado corretamente
        if (fs.existsSync(videoPath) && fs.statSync(videoPath).size > 0) {
          resolve(videoPath)
        } else {
          reject(new Error("O arquivo de vídeo não foi criado corretamente"))
        }
      })
      .save(videoPath)
  })
}

// Função para adicionar áudio a um vídeo existente
export async function addAudioToVideo(videoPath: string, audioPath: string, outputPath?: string): Promise<string> {
  // Configurar FFmpeg
  await configureFfmpeg()

  // Se não for fornecido um caminho de saída, criar um
  if (!outputPath) {
    const dir = path.dirname(videoPath)
    const filename = path.basename(videoPath, path.extname(videoPath))
    outputPath = path.join(dir, `${filename}-with-audio.mp4`)
  }

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        "-c:v",
        "copy", // Copiar vídeo sem recodificar
        "-c:a",
        "aac", // Codificar áudio como AAC
        "-b:a",
        "128k", // Bitrate de áudio
        "-shortest", // Encerrar quando o stream mais curto terminar
        "-map",
        "0:v:0", // Usar o primeiro stream de vídeo do primeiro input
        "-map",
        "1:a:0", // Usar o primeiro stream de áudio do segundo input
      ])
      .on("start", (commandLine) => {
        console.log("Comando FFmpeg para adicionar áudio:", commandLine)
      })
      .on("error", (err) => {
        console.error("Erro ao adicionar áudio:", err)
        reject(err)
      })
      .on("end", () => {
        console.log(`Áudio adicionado com sucesso: ${outputPath}`)
        resolve(outputPath)
      })
      .save(outputPath)
  })
}

// Função para otimizar um vídeo para redes sociais
export async function optimizeVideoForSocialMedia(videoPath: string, outputPath?: string): Promise<string> {
  // Configurar FFmpeg
  await configureFfmpeg()

  // Se não for fornecido um caminho de saída, criar um
  if (!outputPath) {
    const dir = path.dirname(videoPath)
    const filename = path.basename(videoPath, path.extname(videoPath))
    outputPath = path.join(dir, `${filename}-optimized.mp4`)
  }

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        "-c:v",
        "libx264", // Codec de vídeo H.264
        "-crf",
        "23", // Qualidade de vídeo (23 é um bom equilíbrio)
        "-preset",
        "medium", // Velocidade de codificação vs. tamanho do arquivo
        "-profile:v",
        "main", // Perfil de compatibilidade
        "-level",
        "4.0", // Nível de compatibilidade
        "-pix_fmt",
        "yuv420p", // Formato de pixel para compatibilidade
        "-movflags",
        "+faststart", // Otimização para streaming
        "-c:a",
        "aac", // Codec de áudio AAC
        "-b:a",
        "128k", // Bitrate de áudio
      ])
      .on("start", (commandLine) => {
        console.log("Comando FFmpeg para otimização:", commandLine)
      })
      .on("error", (err) => {
        console.error("Erro ao otimizar vídeo:", err)
        reject(err)
      })
      .on("end", () => {
        console.log(`Vídeo otimizado com sucesso: ${outputPath}`)
        resolve(outputPath)
      })
      .save(outputPath)
  })
}
