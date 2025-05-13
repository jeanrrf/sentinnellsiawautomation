"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutoCardGenerator } from "@/components/auto-card-generator"
import { DesignerExport } from "@/components/designer-export"

export function CardGenerator({ products = [] }: { products?: any[] }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auto">Geração Automática</TabsTrigger>
          <TabsTrigger value="manual">Geração Manual</TabsTrigger>
          <TabsTrigger value="animated">Cards Animados</TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="mt-4">
          <AutoCardGenerator />
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <DesignerExport />
        </TabsContent>

        <TabsContent value="animated" className="mt-4">
          <div className="border rounded-lg p-4 text-center space-y-4">
            <h3 className="text-lg font-medium">Cards com Transição de Imagens</h3>
            <p className="text-sm text-muted-foreground">
              Crie cards animados que alternam entre várias imagens do produto, aumentando o engajamento nas redes
              sociais.
            </p>
            <a
              href="/dashboard/multi-imagem"
              className="inline-block px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Criar Cards Animados
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
