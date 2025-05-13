import { Suspense } from "react"
import { CardGenerator } from "@/components/card-generator"
import { createLogger } from "@/lib/logger"

const logger = createLogger("designer-page")

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DesignerPage() {
  return (
    <div className="container mx-auto py-6 max-w-full px-4">
      <h1 className="text-3xl font-bold mb-6">Designer de Cards</h1>
      <p className="text-muted-foreground mb-6">
        Crie cards personalizados para TikTok e outras plataformas a partir dos produtos mais vendidos da Shopee.
      </p>

      <Suspense fallback={<div>Carregando gerador de cards...</div>}>
        <CardGenerator />
      </Suspense>
    </div>
  )
}
