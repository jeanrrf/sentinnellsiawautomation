import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"

export function Header() {
  return (
    <header className="flex justify-between items-center py-4">
      <div>
        <h1 className="text-2xl font-bold">Sales Martins</h1>
        <p className="text-muted-foreground">Shopee Affiliate TikTok Generator</p>
        <div className="flex gap-3 mt-1">
          <Link href="/" className="text-xs text-blue-500 hover:underline">
            Home
          </Link>
          <Link href="/debug" className="text-xs text-blue-500 hover:underline">
            Debug API
          </Link>
          <Link href="/diagnostics" className="text-xs text-blue-500 hover:underline">
            Diagnostics
          </Link>
          <Link href="/cache-management" className="text-xs text-blue-500 hover:underline">
            Cache Management
          </Link>
        </div>
      </div>
      <ModeToggle />
    </header>
  )
}
