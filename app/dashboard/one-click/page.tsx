import { redirect } from "next/navigation"

export default function OneClickPage() {
  redirect("/dashboard/automacao?tab=quick")
}
