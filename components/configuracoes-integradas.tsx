"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SystemStatusDashboard } from "@/components/system-status-dashboard"
import { ValidationSettingsPage } from "@/components/validation-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ConfiguracoesIntegradas() {
  const [activeTab, setActiveTab] = useState("status")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="status">Status do Sistema</TabsTrigger>
          <TabsTrigger value="settings">Configurações Avançadas</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Verificador de Status do Sistema</CardTitle>
                <CardDescription>
                  Verifique se todos os componentes do sistema estão funcionando corretamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemStatusDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <ValidationSettingsPage />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
