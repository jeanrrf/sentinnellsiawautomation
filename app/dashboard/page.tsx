import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkflowGuide } from "@/components/workflow-guide"

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Primary Functions - Core functionality */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Busca de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Encontre produtos populares da Shopee para criar cards e vídeos.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/busca" className="w-full">
              <Button className="w-full">Buscar Produtos</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Designer de Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Crie cards personalizados para TikTok a partir dos produtos da Shopee.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/designer" className="w-full">
              <Button className="w-full">Criar Cards</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Studio Integrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Plataforma unificada para design, geração e automação de cards de produtos.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/studio" className="w-full">
              <Button className="w-full">Acessar Studio</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Secondary Functions - Supporting tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Automação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure agendamentos e geração automática de cards para seus produtos.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/automacao" className="w-full">
              <Button className="w-full">Configurar Automação</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gerencie e personalize templates para seus cards de produtos.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/templates" className="w-full">
              <Button className="w-full">Gerenciar Templates</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monitoramento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitore o desempenho do sistema e uso de recursos como Redis e armazenamento.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/monitoring" className="w-full">
              <Button className="w-full">Monitorar Sistema</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* System Functions - Configuration and documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Documentação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Acesse a documentação completa do sistema e guias de uso.</p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/documentation" className="w-full">
              <Button className="w-full">Ver Documentação</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ajuste as configurações do sistema e personalize sua experiência.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/configuracoes" className="w-full">
              <Button className="w-full">Configurações</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <WorkflowGuide />
    </div>
  )
}
