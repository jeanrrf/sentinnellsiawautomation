import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Steps, Step } from "@/components/ui/steps"

export function WorkflowGuide() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Guia de Uso</CardTitle>
      </CardHeader>
      <CardContent>
        <Steps>
          <Step number={1} title="Buscar Produtos">
            Use a ferramenta de busca para encontrar produtos populares da Shopee.
          </Step>
          <Step number={2} title="Gerar Cards">
            Selecione um produto e gere cards personalizados para TikTok.
          </Step>
          <Step number={3} title="Baixar">
            Baixe os cards gerados diretamente na interface.
          </Step>
          <Step number={4} title="Automatizar">
            Configure a automação para gerar cards periodicamente.
          </Step>
        </Steps>
      </CardContent>
    </Card>
  )
}
