import { ImageToVideoConverter } from "@/components/image-to-video-converter"
import { InfoSection } from "@/components/info-section"

export default function ImageConverterPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Conversor de Imagens para Vídeo MP4</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          Faça upload de múltiplas imagens para criar um vídeo MP4 com transições suaves
        </p>

        <ImageToVideoConverter />

        <InfoSection />
      </div>
    </main>
  )
}
