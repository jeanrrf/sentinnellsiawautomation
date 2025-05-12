import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SystemStatusChecker } from "@/components/system-status-checker"
import { SystemMonitorDashboard } from "@/components/system-monitor-dashboard"

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">System Monitoring</h1>
      <p className="text-muted-foreground mb-6">Monitor the health and performance of the system components.</p>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system">System Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <SystemStatusChecker />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <SystemMonitorDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
