"use client"

import { CacheCleaner } from "@/components/cache-cleaner"
import { CacheViewer } from "@/components/cache-viewer"
import { ToastProvider } from "@/components/ui/use-toast"

export default function CacheManagementPage() {
  return (
    <ToastProvider>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Gerenciamento de Cache</h1>
        <p className="text-muted-foreground mb-6">Visualize e gerencie o cache do sistema.</p>

        <div className="grid grid-cols-1 gap-6">
          <CacheCleaner />
          <CacheViewer />
        </div>
      </div>
    </ToastProvider>
  )
}
