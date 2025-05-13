"use client"
import { useValidation } from "@/components/validation-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ValidationRulesManagerProps {
  title?: string
  description?: string
  className?: string
}

export function ValidationRulesManager({
  title = "Regras de Validação",
  description = "Configure as regras de validação do sistema",
  className,
}: ValidationRulesManagerProps) {
  const { validationRules, updateValidationRule } = useValidation()

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    updateValidationRule(ruleId, { enabled })
  }

  const handleChangeSeverity = (ruleId: string, severity: "error" | "warning" | "info") => {
    updateValidationRule(ruleId, { severity })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.values(validationRules).map((rule) => (
            <div key={rule.id} className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor={`rule-${rule.id}`} className="font-medium">
                  {rule.name}
                </Label>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Select
                  value={rule.severity}
                  onValueChange={(value) => handleChangeSeverity(rule.id, value as "error" | "warning" | "info")}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`rule-${rule.id}`}
                    checked={rule.enabled}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                  />
                  <Label htmlFor={`rule-${rule.id}`} className="sr-only">
                    {rule.enabled ? "Ativado" : "Desativado"}
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
