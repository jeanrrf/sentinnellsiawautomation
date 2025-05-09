import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedLogo } from "@/components/animated-logo"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AutoSeller</h1>
          <p className="text-xl text-muted-foreground">Gerador Automático de Posts para TikTok</p>
          <div className="mt-6">
            <AnimatedLogo />
          </div>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bem-vindo ao AutoSeller</CardTitle>
            <CardDescription>Gere posts para TikTok automaticamente a partir de produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Utilize nossa plataforma para criar conteúdo atraente para o TikTok e aumentar suas vendas.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">Acessar Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
