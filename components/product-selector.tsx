"use client"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductSelectorProps {
  products: any[]
  value: string
  onChange: (value: string) => void
}

export function ProductSelector({ products, value, onChange }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [isLoading, setIsLoading] = useState(false)

  // Filtrar produtos quando o termo de pesquisa mudar
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products)
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(lowerSearchTerm) ||
        product.itemId.toString().includes(lowerSearchTerm),
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  // Buscar produtos se não houver nenhum
  useEffect(() => {
    if (products.length === 0) {
      const fetchProducts = async () => {
        setIsLoading(true)
        try {
          const response = await fetch("/api/products")
          if (response.ok) {
            const data = await response.json()
            setFilteredProducts(data.products || [])
          }
        } catch (error) {
          console.error("Error fetching products:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchProducts()
    }
  }, [products])

  // Encontrar o produto selecionado
  const selectedProduct = products.find((product) => product.itemId === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", value ? "text-foreground" : "text-muted-foreground")}
          aria-label="Selecione um produto"
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Carregando produtos...</span>
            </div>
          ) : value ? (
            <div className="flex items-center">
              <span className="truncate max-w-[300px]">
                {selectedProduct ? selectedProduct.productName : "Selecione um produto"}
              </span>
            </div>
          ) : (
            "Selecione um produto"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar produto..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            aria-label="Buscar produto"
          />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup heading="Produtos">
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.itemId}
                  value={product.itemId}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === product.itemId ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className="truncate max-w-[300px]">{product.productName}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {product.itemId} | R$ {product.price} | Vendas: {product.sales}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
