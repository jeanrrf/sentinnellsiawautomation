"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutoCardGenerator } from "@/components/auto-card-generator"
import { DesignerExport } from "@/components/designer-export"

export function CardGenerator({ products = [] }: { products?: any[] }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auto">Geração Automática</TabsTrigger>
          <TabsTrigger value="manual">Geração Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="mt-4">
          <AutoCardGenerator />
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <DesignerExport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
