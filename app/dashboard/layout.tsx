import type React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">AutoSeller</h1>
        </div>
        <ModeToggle />
      </div>

      <Tabs defaultValue="auto-search" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="auto-search" asChild>
            <Link href="/dashboard/auto-search">Busca</Link>
          </TabsTrigger>
          <TabsTrigger value="designer" asChild>
            <Link href="/dashboard/designer">Designer</Link>
          </TabsTrigger>
          <TabsTrigger value="automation" asChild>
            <Link href="/dashboard/automation">Automação</Link>
          </TabsTrigger>
          <TabsTrigger value="cache" asChild>
            <Link href="/dashboard/cache">Publicação</Link>
          </TabsTrigger>
          <TabsTrigger value="settings" asChild>
            <Link href="/dashboard/settings">Configurações</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">{children}</div>
    </div>
  )
}
