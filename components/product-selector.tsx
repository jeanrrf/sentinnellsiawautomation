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

  // Função para truncar o nome do produto se for muito longo
  const truncateProductName = (name: string, maxLength = 50) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength) + "..."
  }

  // Encontrar o produto selecionado
  const selectedProduct = products.find((product) => product.itemId === value)

  // Texto a ser exibido no botão
  const buttonText = selectedProduct ? truncateProductName(selectedProduct.productName) : "Selecione um produto"

  const handleSelectChange = (newValue: string) => {
    console.log("Produto selecionado:", newValue)

    // Verificar se o produto existe na lista
    const productExists = products.some((p) => p.itemId === newValue)
    if (!productExists && newValue) {
      console.warn("Produto selecionado não encontrado na lista:", newValue)
    }

    onChange(newValue)

    // Salvar a seleção no localStorage para persistência
    try {
      localStorage.setItem("selectedProductId", newValue)
    } catch (error) {
      console.error("Erro ao salvar produto no localStorage:", error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden"
        >
          <span className="truncate mr-2">{buttonText}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar produtos..." />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {products.map((product) => (
                <CommandItem
                  key={product.itemId}
                  value={product.itemId}
                  onSelect={() => {
                    handleSelectChange(product.itemId === value ? "" : product.itemId)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === product.itemId ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{product.productName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
