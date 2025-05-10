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

export function VideoRecordingGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          Como gravar vídeos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Como gravar vídeos para o TikTok</DialogTitle>
          <DialogDescription>
            Siga estas instruções para gravar vídeos de alta qualidade para o TikTok
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Passo 1: Gere o Card</h3>
            <p className="text-sm text-muted-foreground">
              Selecione um produto e clique em "Gerar Card" para criar o card do produto.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Passo 2: Vá para a aba "Vídeo"</h3>
            <p className="text-sm text-muted-foreground">
              Após gerar o card, clique na aba "Vídeo" para acessar as ferramentas de gravação.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Passo 3: Inicie a Gravação</h3>
            <p className="text-sm text-muted-foreground">
              Clique em "Gravar Vídeo" e selecione a área da tela que contém o card. Uma contagem regressiva começará
              antes da gravação.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Passo 4: Selecione a Área Correta</h3>
            <p className="text-sm text-muted-foreground">
              Quando solicitado pelo navegador, selecione apenas a área que contém o card para melhor qualidade. Você
              pode escolher "Esta Guia" e depois ajustar a área de captura.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Passo 5: Baixe o Vídeo</h3>
            <p className="text-sm text-muted-foreground">
              Após a gravação, o vídeo será exibido. Clique em "Baixar Vídeo" para salvá-lo no seu computador.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Passo 6: Publique no TikTok</h3>
            <p className="text-sm text-muted-foreground">
              Faça upload do vídeo baixado diretamente no aplicativo do TikTok. O formato WebM é compatível com o
              TikTok, mas você também pode convertê-lo para MP4 se necessário.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button">Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
