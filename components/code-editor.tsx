"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Componente simplificado que não usa o Monaco Editor
export function CodeEditor({
  initialValue = "",
  onChange = () => {},
  language = "javascript",
  title = "Editor de Código",
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = initialValue
    }
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border rounded-md">
          <textarea
            ref={textareaRef}
            className="w-full h-64 p-4 font-mono text-sm bg-secondary/20 rounded-md"
            onChange={handleChange}
            placeholder={`Digite seu código ${language} aqui...`}
          />
        </div>
        <div className="flex justify-end mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (textareaRef.current) {
                navigator.clipboard.writeText(textareaRef.current.value)
              }
            }}
          >
            Copiar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
