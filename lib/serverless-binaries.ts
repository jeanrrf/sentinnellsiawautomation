import fs from "fs"
import path from "path"
import https from "https"
import { tmpdir } from "os"

// URLs dos binários do FFmpeg otimizados para Lambda
const FFMPEG_URL = "https://github.com/eugeneware/ffmpeg-static/releases/download/b4.4/ffmpeg-linux-x64"
const FFPROBE_URL = "https://github.com/eugeneware/ffmpeg-static/releases/download/b4.4/ffprobe-linux-x64"

// Diretório temporário para armazenar os binários
const TMP_DIR = process.env.TEMP_DIR || path.join(tmpdir(), "shopee-tiktok-binaries")

// Caminhos para os binários
export const FFMPEG_PATH = process.env.FFMPEG_PATH || path.join(TMP_DIR, "ffmpeg")
export const FFPROBE_PATH = process.env.FFPROBE_PATH || path.join(TMP_DIR, "ffprobe")

// Função para baixar um arquivo de uma URL
function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verificar se o arquivo já existe
    if (fs.existsSync(outputPath)) {
      console.log(`Binário já existe: ${outputPath}`)
      return resolve()
    }

    console.log(`Baixando binário de ${url} para ${outputPath}...`)

    // Criar diretório se não existir
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Baixar o arquivo
    const file = fs.createWriteStream(outputPath)
    https
      .get(url, (response) => {
        response.pipe(file)
        file.on("finish", () => {
          file.close()
          // Tornar o arquivo executável
          fs.chmodSync(outputPath, "755")
          console.log(`Binário baixado e configurado: ${outputPath}`)
          resolve()
        })
      })
      .on("error", (err) => {
        fs.unlinkSync(outputPath)
        reject(err)
      })
  })
}

// Função para garantir que os binários estejam disponíveis
export async function ensureBinaries(): Promise<{ ffmpegPath: string; ffprobePath: string }> {
  // Em ambiente de desenvolvimento, assumir que FFmpeg está instalado globalmente
  if (process.env.NODE_ENV === "development") {
    console.log("Ambiente de desenvolvimento - usando FFmpeg global")
    return {
      ffmpegPath: "ffmpeg",
      ffprobePath: "ffprobe",
    }
  }

  try {
    // Criar diretório temporário se não existir
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true })
    }

    // Baixar binários se necessário
    await Promise.all([downloadFile(FFMPEG_URL, FFMPEG_PATH), downloadFile(FFPROBE_URL, FFPROBE_PATH)])

    return {
      ffmpegPath: FFMPEG_PATH,
      ffprobePath: FFPROBE_PATH,
    }
  } catch (error) {
    console.error("Erro ao configurar binários:", error)
    throw error
  }
}
