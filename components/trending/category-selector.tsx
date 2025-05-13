"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Category } from "@/lib/trending-products-service"

interface CategorySelectorProps {
  categories: Category[]
  selectedCategory: string | null
  onChange: (categoryId: string | null) => void // Alterado de onSelectCategory para onChange
}

export function CategorySelector({ categories, selectedCategory, onChange }: CategorySelectorProps) {
  return (
    <div className="mb-6">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 p-1">
          <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => onChange(null)}>
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
