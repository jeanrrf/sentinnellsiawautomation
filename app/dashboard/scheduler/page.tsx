import { redirect } from "next/navigation"

export default function SchedulerPage() {
  redirect("/dashboard/automacao?tab=scheduler")
}
