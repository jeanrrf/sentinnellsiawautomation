import { Badge } from "@/components/ui/badge"
import { TrendingUp, Flame, Star, ArrowUp } from "lucide-react"

interface TrendIndicatorProps {
  indicator: "baixa" | "média" | "alta" | "muito-alta"
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function TrendIndicator({ indicator, showLabel = true, size = "md" }: TrendIndicatorProps) {
  let variant: "default" | "secondary" | "success" | "destructive"
  let icon
  let label

  switch (indicator) {
    case "muito-alta":
      variant = "destructive"
      icon = <Flame className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      label = "Em alta"
      break
    case "alta":
      variant = "success"
      icon = <TrendingUp className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      label = "Tendência"
      break
    case "média":
      variant = "secondary"
      icon = <ArrowUp className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      label = "Subindo"
      break
    default:
      variant = "default"
      icon = <Star className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      label = "Normal"
  }

  return (
    <Badge variant={variant} className={size === "sm" ? "text-xs py-0 px-1.5" : ""}>
      {icon}
      {showLabel && <span className="ml-1">{label}</span>}
    </Badge>
  )
}
