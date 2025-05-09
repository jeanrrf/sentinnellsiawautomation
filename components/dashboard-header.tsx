import { ModeToggle } from "@/components/mode-toggle"

export function DashboardHeader() {
  return (
    <header className="flex justify-between items-center py-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">AutoSeller</h1>
        <p className="text-muted-foreground">Gerador Automático de Posts para TikTok</p>
      </div>
      <ModeToggle />
    </header>
  )
}
