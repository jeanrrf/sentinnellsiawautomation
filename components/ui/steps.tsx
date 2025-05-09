import type { ReactNode } from "react"

interface StepProps {
  number: number
  title: string
  children: ReactNode
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex items-start mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3">
        {number}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

interface StepsProps {
  children: ReactNode
}

export function Steps({ children }: StepsProps) {
  return <div className="space-y-4">{children}</div>
}
