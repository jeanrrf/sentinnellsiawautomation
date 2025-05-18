import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkflowGuide } from "@/components/workflow-guide"

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

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
            <CardTitle>Automação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configure a automação para gerar cards automaticamente.</p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/automacao" className="w-full">
              <Button className="w-full">Configurar Automação</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Geração Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gere cards com apenas um clique usando os produtos mais populares.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/one-click" className="w-full">
              <Button className="w-full">Geração Rápida</Button>
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
