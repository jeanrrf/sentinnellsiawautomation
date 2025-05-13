import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

export function InfoSection() {
  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-4">Sobre o Conversor de Imagens para Vídeo</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Como funciona?</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Este conversor utiliza tecnologias modernas do navegador (Canvas API e MediaRecorder) para transformar
              suas imagens em um vídeo fluido com transições. Todo o processamento acontece diretamente no seu
              navegador, sem necessidade de upload para servidores externos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Vantagens
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>Processamento local (privacidade)</li>
                <li>Sem limites de uso</li>
                <li>Totalmente gratuito</li>
                <li>Sem marca d'água</li>
                <li>Controle total sobre duração e transições</li>
                <li>Suporte a múltiplas imagens</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                Limitações
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>Gera vídeos no formato WebM (não MP4 diretamente)</li>
                <li>Depende do poder de processamento do seu dispositivo</li>
                <li>Funcionalidades limitadas em comparação com software profissional</li>
                <li>Pode não funcionar em navegadores mais antigos</li>
                <li>Sem suporte a edição avançada</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Dicas para melhores resultados</h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
              <li>Use imagens com a mesma resolução para resultados mais consistentes</li>
              <li>Para vídeos mais longos, divida em partes menores</li>
              <li>Experimente diferentes durações de transição para efeitos variados</li>
              <li>O efeito de zoom suave adiciona movimento sutil às imagens estáticas</li>
              <li>Após baixar o vídeo WebM, você pode convertê-lo para MP4 usando ferramentas online gratuitas</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Conversão para MP4</h3>
            <p className="text-blue-700 dark:text-blue-300">
              Para converter o vídeo WebM gerado para MP4, você pode usar serviços online gratuitos como:
            </p>
            <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 mt-2">
              <li>CloudConvert</li>
              <li>Online-Convert</li>
              <li>Convertio</li>
              <li>FileZigZag</li>
            </ul>
            <p className="text-blue-700 dark:text-blue-300 mt-2">
              Esses serviços permitem converter facilmente seu vídeo WebM para o formato MP4 sem perda de qualidade.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
