"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutoSearch } from "@/components/auto-search"
import { DesignerExport } from "@/components/designer-export"
import { ScheduleAutomation } from "@/components/schedule-automation"
import { CacheViewer } from "@/components/cache-viewer"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("auto-search")

  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auto-search">Auto Search</TabsTrigger>
          <TabsTrigger value="designer">Designer & Export</TabsTrigger>
          <TabsTrigger value="automation">Schedule/Automation</TabsTrigger>
          <TabsTrigger value="cache">Cache Viewer</TabsTrigger>
        </TabsList>

        <TabsContent value="auto-search" className="w-full overflow-x-auto">
          <AutoSearch />
        </TabsContent>

        <TabsContent value="designer" className="w-full">
          <DesignerExport />
        </TabsContent>

        <TabsContent value="automation">
          <ScheduleAutomation />
        </TabsContent>

        <TabsContent value="cache">
          <CacheViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
