import path from "path"

// Configuração para FFmpeg em ambiente serverless
export const ffmpegConfig = {
  // Em produção (Vercel), precisamos usar binários específicos
  // Estes caminhos serão definidos em variáveis de ambiente
  ffmpegPath: process.env.FFMPEG_PATH || "/tmp/ffmpeg",
  ffprobePath: process.env.FFPROBE_PATH || "/tmp/ffprobe",

  // Diretório temporário para arquivos
  tempDir: process.env.TEMP_DIR || path.join(process.cwd(), "tmp"),

  // Configurações padrão para vídeos
  defaultVideoSettings: {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 10,
    fadeIn: 0.5,
    fadeOut: 0.5,
  },

  // Configurações de áudio
  defaultAudioSettings: {
    bitrate: "128k",
    fadeIn: 0.5,
    fadeOut: 0.5,
  },
}
