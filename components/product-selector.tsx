"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createLogger, ErrorCodes } from "@/lib/logger"
import { usePersistentState } from "@/hooks/use-persistent-state"

// Criar logger específico para este componente
const logger = createLogger("ProductSelector")

interface ProductSelectorProps {
  onSelect: (product: any) => void
  selectedProduct?: any
  className?: string
}

export function ProductSelector({ onSelect, selectedProduct: propSelectedProduct, className }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = usePersistentState<string | null>("selectedProductId", null)
  const [showNotFoundAlert, setShowNotFoundAlert] = useState(false)
  const [validationPerformed, setValidationPerformed] = useState(false)

  // Carregar produtos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        logger.debug("Buscando produtos")
        const response = await fetch("/api/products")

        if (!response.ok) {
          throw new Error(`Erro ao buscar produtos: ${response.statusText}`)
        }

        const data = await response.json()
        setProducts(data)
        logger.debug(`${data.length} produtos carregados`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao buscar produtos"
        logger.error("Falha ao buscar produtos", {
          code: ErrorCodes.API.FETCH_FAILED,
          details: err,
        })
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Validar o produto selecionado quando os produtos são carregados
  useEffect(() => {
    const validateSelectedProduct = async () => {
      if (!selectedProductId || validationPerformed || products.length === 0) return

      logger.debug(`Validando produto selecionado: ${selectedProductId}`)

      // Verificar se o produto existe na lista
      const productExists = products.some((product) => product.itemId === selectedProductId)

      if (productExists) {
        // Produto encontrado na lista, selecionar
        const product = products.find((p) => p.itemId === selectedProductId)
        logger.debug("Produto encontrado na lista local", { context: { productId: selectedProductId } })
        onSelect(product)
      } else {
        // Produto não encontrado na lista, verificar na API
        try {
          logger.debug("Produto não encontrado na lista local, verificando na API", {
            context: { productId: selectedProductId },
          })

          const response = await fetch(`/api/validate-id?id=${selectedProductId}`)
          const data = await response.json()

          if (response.ok && data.valid) {
            // Produto válido, mas não está na lista atual
            logger.debug("Produto validado pela API, mas não está na lista atual", {
              context: { productId: selectedProductId },
            })
            // Não fazemos nada, pois o produto não está disponível na lista atual
          } else {
            // Produto inválido
            logger.debug("Produto inválido ou não encontrado na API", {
              context: { productId: selectedProductId },
            })
            setShowNotFoundAlert(true)
            // Limpar o ID selecionado
            setSelectedProductId(null)
          }
        } catch (err) {
          logger.error("Erro ao validar produto", {
            code: ErrorCodes.API.VALIDATION_FAILED,
            details: err,
            context: { productId: selectedProductId },
          })
        }
      }

      setValidationPerformed(true)
    }

    validateSelectedProduct()
  }, [products, selectedProductId, onSelect, validationPerformed, setSelectedProductId])

  // Sincronizar o produto selecionado com as props
  useEffect(() => {
    if (propSelectedProduct && propSelectedProduct.itemId) {
      if (propSelectedProduct.itemId !== selectedProductId) {
        logger.debug("Atualizando produto selecionado a partir das props", {
          context: { productId: propSelectedProduct.itemId },
        })
        setSelectedProductId(propSelectedProduct.itemId)
      }
    }
  }, [propSelectedProduct, selectedProductId, setSelectedProductId])

  // Limpar o alerta após 5 segundos
  useEffect(() => {
    if (showNotFoundAlert) {
      const timer = setTimeout(() => {
        setShowNotFoundAlert(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [showNotFoundAlert])

  const handleSelectProduct = (productId: string) => {
    const product = products.find((p) => p.itemId === productId)

    if (product) {
      logger.debug("Produto selecionado", { context: { productId } })
      setSelectedProductId(productId)
      onSelect(product)
      setOpen(false)
      // Limpar qualquer alerta quando um novo produto é selecionado
      setShowNotFoundAlert(false)
    }
  }

  return (
    <div className="space-y-4">
      {showNotFoundAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Produto não encontrado</AlertTitle>
          <AlertDescription>
            O produto selecionado anteriormente não está mais disponível ou foi removido.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={loading}
          >
            {selectedProductId && products.length > 0
              ? products.find((product) => product.itemId === selectedProductId)?.name || "Selecione um produto"
              : "Selecione um produto"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Buscar produto..." />
            <CommandList>
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-y-auto">
                {products.map((product) => (
                  <CommandItem key={product.itemId} value={product.itemId} onSelect={handleSelectProduct}>
                    <Check
                      className={cn("mr-2 h-4 w-4", selectedProductId === product.itemId ? "opacity-100" : "opacity-0")}
                    />
                    {product.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
