import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertCircle } from "lucide-react"

export function VideoConversionHelp() {
  return (
    <div className="w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-sm">Dicas para melhores resultados</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Use imagens de alta qualidade com pelo menos 1080px de largura</li>
              <li>Certifique-se de que o produto esteja bem iluminado e centralizado</li>
              <li>Evite imagens com muitos elementos de fundo que possam distrair</li>
              <li>Formatos recomendados: JPG, PNG ou WebP</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-sm">Formatos suportados</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm mb-2">Formatos de entrada:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>JPG/JPEG</li>
              <li>PNG</li>
              <li>WebP</li>
              <li>GIF (primeira frame apenas)</li>
            </ul>
            <p className="text-sm mt-3 mb-2">Formato de saída:</p>
            <ul className="list-disc pl-5 text-sm">
              <li>MP4 (H.264)</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-sm">Problemas comuns</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Arquivo muito grande</p>
                  <p className="text-xs text-muted-foreground">
                    O tamanho máximo de arquivo é 10MB. Tente redimensionar ou comprimir sua imagem.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Conversão lenta</p>
                  <p className="text-xs text-muted-foreground">
                    O tempo de processamento depende do tamanho da imagem e da carga do servidor. Aguarde alguns
                    minutos.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Formato não suportado</p>
                  <p className="text-xs text-muted-foreground">
                    Certifique-se de que está enviando um dos formatos de imagem suportados.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
