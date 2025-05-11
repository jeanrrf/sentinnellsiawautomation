import { RedisDiagnostics } from "@/components/redis-diagnostics"

export default function RedisDiagnosticsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico do Redis</h1>
      <div className="max-w-2xl">
        <RedisDiagnostics />
      </div>
    </div>
  )
}
