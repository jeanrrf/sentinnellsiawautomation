"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Product {
  itemId: string
  productName: string
}

interface ProductSelectorProps {
  products: Product[]
  value: string
  onChange: (value: string) => void
}

export function ProductSelector({ products, value, onChange }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value
            ? products.find((product) => product.itemId === value)?.productName || "Select product"
            : "Select product"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {products.map((product) => (
                <CommandItem
                  key={product.itemId}
                  value={product.itemId}
                  onSelect={() => {
                    onChange(product.itemId === value ? "" : product.itemId)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === product.itemId ? "opacity-100" : "opacity-0")} />
                  {product.productName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
