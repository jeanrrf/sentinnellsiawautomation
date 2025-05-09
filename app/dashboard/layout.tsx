import type React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { AnimatedLogo } from "@/components/animated-logo"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <AnimatedLogo />
        <ModeToggle />
      </div>

      <Tabs defaultValue="busca" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="busca" asChild>
            <Link href="/dashboard/busca">Busca</Link>
          </TabsTrigger>
          <TabsTrigger value="designer" asChild>
            <Link href="/dashboard/designer">Designer</Link>
          </TabsTrigger>
          <TabsTrigger value="automacao" asChild>
            <Link href="/dashboard/automacao">Automação</Link>
          </TabsTrigger>
          <TabsTrigger value="publicacao" asChild>
            <Link href="/dashboard/publicacao">Publicação</Link>
          </TabsTrigger>
          <TabsTrigger value="configuracoes" asChild>
            <Link href="/dashboard/configuracoes">Configurações</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">{children}</div>
    </div>
  )
}
