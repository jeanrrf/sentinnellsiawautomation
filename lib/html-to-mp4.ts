import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Função para converter HTML em MP4 usando ferramentas externas
export async function convertHtmlToMp4(
  htmlContent: string,
  outputPath: string,
  options = {
    width: 1080,
    height: 1920,
    duration: 15, // duração em segundos
    fps: 30,
  },
): Promise<boolean> {
  try {
    // Criar diretório temporário
    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Criar arquivo HTML temporário
    const tempHtmlPath = path.join(tempDir, `temp_${Date.now()}.html`)
    fs.writeFileSync(tempHtmlPath, htmlContent)

    // Criar diretório para o vídeo de saída
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Usar ffmpeg diretamente para capturar o HTML e convertê-lo em vídeo
    // Nota: Isso requer que o ffmpeg esteja instalado no sistema
    try {
      // Criar um arquivo de vídeo estático com a cor de fundo
      const bgVideoPath = path.join(tempDir, `bg_${Date.now()}.mp4`)
      await execAsync(
        `ffmpeg -y -f lavfi -i color=c=black:s=${options.width}x${options.height}:r=${options.fps} -t ${options.duration} "${bgVideoPath}"`,
      )

      // Criar um arquivo de texto com o HTML
      const htmlTextPath = path.join(tempDir, `html_${Date.now()}.txt`)
      fs.writeFileSync(htmlTextPath, htmlContent)

      // Sobrepor o HTML como texto no vídeo
      // Nota: Esta é uma solução simplificada. Na prática, você precisaria de uma ferramenta mais robusta.
      await execAsync(
        `ffmpeg -y -i "${bgVideoPath}" -vf "drawtext=fontfile=/path/to/font.ttf:textfile='${htmlTextPath}':x=10:y=10:fontsize=24:fontcolor=white" -c:v libx264 -preset ultrafast "${outputPath}"`,
      )

      // Limpar arquivos temporários
      fs.unlinkSync(tempHtmlPath)
      fs.unlinkSync(bgVideoPath)
      fs.unlinkSync(htmlTextPath)

      return true
    } catch (error) {
      console.error("Erro durante a conversão HTML para MP4:", error)

      // Criar um arquivo MP4 simples com uma mensagem de erro
      try {
        await execAsync(
          `ffmpeg -y -f lavfi -i color=c=black:s=${options.width}x${options.height}:r=${options.fps} -t 5 -vf "drawtext=fontfile=/path/to/font.ttf:text='Erro ao gerar vídeo':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=36:fontcolor=white" -c:v libx264 -preset ultrafast "${outputPath}"`,
        )
      } catch (ffmpegError) {
        console.error("Erro ao criar vídeo de fallback:", ffmpegError)
      }

      return false
    }
  } catch (error) {
    console.error("Erro ao converter HTML para MP4:", error)
    return false
  }
}
