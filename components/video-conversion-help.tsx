"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

export function VideoConversionHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Ajuda para conversão de vídeo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Como converter HTML em vídeo MP4</DialogTitle>
          <DialogDescription>
            Siga estas etapas para criar um vídeo MP4 a partir do arquivo HTML baixado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Opção 1: Usando OBS Studio (Gratuito)</h3>
            <ol className="ml-6 list-decimal text-sm text-muted-foreground space-y-2">
              <li>
                Baixe e instale o{" "}
                <a
                  href="https://obsproject.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  OBS Studio
                </a>
              </li>
              <li>Abra o arquivo HTML baixado em seu navegador</li>
              <li>No OBS, adicione uma fonte "Captura de Janela" e selecione a janela do navegador</li>
              <li>Ajuste o tamanho para capturar apenas o conteúdo do vídeo</li>
              <li>Clique em "Iniciar Gravação" e grave por 5-10 segundos</li>
              <li>Clique em "Parar Gravação" e o vídeo será salvo no formato MP4</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Opção 2: Usando ScreenToGif (Gratuito, Windows)</h3>
            <ol className="ml-6 list-decimal text-sm text-muted-foreground space-y-2">
              <li>
                Baixe e instale o{" "}
                <a
                  href="https://www.screentogif.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  ScreenToGif
                </a>
              </li>
              <li>Abra o arquivo HTML baixado em seu navegador</li>
              <li>Abra o ScreenToGif e selecione "Gravador de Tela"</li>
              <li>Ajuste a área de captura para cobrir apenas o conteúdo do vídeo</li>
              <li>Clique em "Gravar" e grave por 5-10 segundos</li>
              <li>Clique em "Parar" e salve o arquivo como MP4</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Opção 3: Usando QuickTime (Mac)</h3>
            <ol className="ml-6 list-decimal text-sm text-muted-foreground space-y-2">
              <li>Abra o arquivo HTML baixado em seu navegador</li>
              <li>Abra o QuickTime Player e selecione "Arquivo &gt; Nova Gravação de Tela"</li>
              <li>Selecione a área do navegador que contém o vídeo</li>
              <li>Clique em "Gravar" e grave por 5-10 segundos</li>
              <li>Clique no botão de parar e salve o arquivo</li>
            </ol>
          </div>
        </div>
        <DialogFooter>
          <Button type="button">Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
