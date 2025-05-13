"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { type TransitionConfig, DEFAULT_TRANSITION_CONFIG } from "@/lib/multi-image-card-generator"

interface TransitionSettingsProps {
  value: Partial<TransitionConfig>
  onChange: (value: Partial<TransitionConfig>) => void
}

export function TransitionSettings({ value, onChange }: TransitionSettingsProps) {
  const config = { ...DEFAULT_TRANSITION_CONFIG, ...value }

  const handleValueChange = (key: keyof TransitionConfig, newValue: any) => {
    onChange({ ...config, [key]: newValue })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Transição</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="transition-enabled" className="flex flex-col space-y-1">
            <span>Ativar Transição</span>
            <span className="font-normal text-xs text-muted-foreground">Alterna entre as imagens automaticamente</span>
          </Label>
          <Switch
            id="transition-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => handleValueChange("enabled", checked)}
          />
        </div>

        <div className="space-y-3">
          <Label>Efeito de Transição</Label>
          <RadioGroup
            value={config.effect}
            onValueChange={(value) => handleValueChange("effect", value as "fade" | "slide" | "zoom")}
            className="grid grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fade" id="fade" />
              <Label htmlFor="fade">Desvanecer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="slide" id="slide" />
              <Label htmlFor="slide">Deslizar</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="zoom" id="zoom" />
              <Label htmlFor="zoom">Zoom</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Label htmlFor="duration-slider">Duração (segundos)</Label>
            <span className="text-muted-foreground">{(config.duration / 1000).toFixed(1)}s</span>
          </div>
          <Slider
            id="duration-slider"
            min={500}
            max={5000}
            step={100}
            value={[config.duration]}
            onValueChange={(value) => handleValueChange("duration", value[0])}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Label htmlFor="transition-slider">Tempo de Transição</Label>
            <span className="text-muted-foreground">{(config.transitionTime / 1000).toFixed(1)}s</span>
          </div>
          <Slider
            id="transition-slider"
            min={100}
            max={2000}
            step={100}
            value={[config.transitionTime]}
            onValueChange={(value) => handleValueChange("transitionTime", value[0])}
          />
        </div>
      </CardContent>
    </Card>
  )
}
