import { SystemStatusChecker } from "@/components/system-status-checker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { InfoIcon, ServerIcon, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function StatusPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Status do Sistema</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/diagnostics">
              Diagnóstico Avançado
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Monitoramento em Tempo Real</AlertTitle>
          <AlertDescription className="text-blue-700">
            Esta página mostra o status atual dos componentes do sistema. Você pode verificar a conexão com o Redis e o
            status geral do sistema.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SystemStatusChecker />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerIcon className="h-5 w-5" />
              Componentes do Sistema
            </CardTitle>
            <CardDescription>Status dos principais componentes e serviços</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="services">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="services">Serviços</TabsTrigger>
                <TabsTrigger value="apis">APIs</TabsTrigger>
                <TabsTrigger value="storage">Armazenamento</TabsTrigger>
              </TabsList>

              <TabsContent value="services">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ServiceStatusCard
                    name="Agendamento"
                    status="online"
                    description="Serviço de agendamento de tarefas"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="Geração de Vídeos"
                    status="online"
                    description="Serviço de geração de vídeos"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="Publicação"
                    status="online"
                    description="Serviço de publicação de conteúdo"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="Busca de Produtos"
                    status="online"
                    description="Serviço de busca de produtos"
                    lastChecked="Agora"
                  />
                </div>
              </TabsContent>

              <TabsContent value="apis">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ServiceStatusCard
                    name="API Shopee"
                    status="online"
                    description="Conexão com a API da Shopee"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="API TikTok"
                    status="online"
                    description="Conexão com a API do TikTok"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="API de Geração de Imagens"
                    status="online"
                    description="Serviço de geração de imagens"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="API de Descrições"
                    status="online"
                    description="Serviço de geração de descrições"
                    lastChecked="Agora"
                  />
                </div>
              </TabsContent>

              <TabsContent value="storage">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ServiceStatusCard
                    name="Redis"
                    status="warning"
                    description="Serviço de cache e armazenamento"
                    lastChecked="Agora"
                    message="Conexão instável"
                  />
                  <ServiceStatusCard
                    name="Blob Storage"
                    status="online"
                    description="Armazenamento de arquivos"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="Sistema de Arquivos"
                    status="online"
                    description="Armazenamento local de arquivos"
                    lastChecked="Agora"
                  />
                  <ServiceStatusCard
                    name="Cache do Navegador"
                    status="online"
                    description="Cache local no navegador"
                    lastChecked="Agora"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ServiceStatusCard({ name, status, description, lastChecked, message }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
          <span>Última verificação: {lastChecked}</span>
          {message && <span className="text-yellow-600 font-medium">{message}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }) {
  if (status === "online") {
    return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Online</span>
  } else if (status === "offline") {
    return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Offline</span>
  } else if (status === "warning") {
    return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Alerta</span>
  } else {
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Desconhecido</span>
  }
}
