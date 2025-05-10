import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
            <CardDescription>Encontre produtos populares da Shopee</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use nossa ferramenta de busca para encontrar produtos populares da Shopee que podem ser convertidos em
              vídeos para o TikTok.
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
            <CardTitle>Designer de Vídeos</CardTitle>
            <CardDescription>Crie vídeos para TikTok</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use nosso designer para criar vídeos profissionais para TikTok a partir dos produtos da Shopee.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/designer" className="w-full">
              <Button className="w-full">Criar Vídeos</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automação</CardTitle>
            <CardDescription>Automatize a geração de vídeos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure a automação para gerar e publicar vídeos automaticamente, economizando seu tempo.
            </p>
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
            <CardTitle>Publicação</CardTitle>
            <CardDescription>Gerencie seus vídeos gerados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visualize, baixe e publique os vídeos que você gerou. Acompanhe o status de publicação.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/publicacao" className="w-full">
              <Button className="w-full">Gerenciar Vídeos</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Verifique o status do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Verifique o status do sistema, incluindo conexão com a API da Shopee, geração de vídeos e mais.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/status" className="w-full">
              <Button className="w-full">Verificar Status</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <WorkflowGuide />
    </div>
  )
}
