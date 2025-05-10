"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createLogger, ErrorCodes } from "@/lib/logger"

// Criar logger específico para este componente
const logger = createLogger("ProductSelector")

interface ProductSelectorProps {
  products: any[]
  value: string
  onChange: (value: string) => void
}

export function ProductSelector({ products, value, onChange }: ProductSelectorProps) {
  // Log component initialization
  logger.debug("Component initializing", {
    context: { productsCount: products?.length || 0 },
  })

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [localProducts, setLocalProducts] = useState<any[]>([])
  const [showProductNotFoundAlert, setShowProductNotFoundAlert] = useState(false)

  // Inicializar produtos locais quando os produtos externos mudarem
  useEffect(() => {
    if (products && Array.isArray(products) && products.length > 0) {
      logger.debug("Initializing local products from props", {
        context: { count: products.length },
      })

      setLocalProducts(products)
      setFilteredProducts(products)
    }
  }, [products])

  // Filtrar produtos quando o termo de pesquisa mudar
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(localProducts || [])
      return
    }

    logger.debug("Filtering products by search term", {
      context: {
        searchTerm,
        totalProducts: localProducts?.length || 0,
      },
    })

    // Garantir que localProducts é um array antes de filtrar
    if (!Array.isArray(localProducts)) {
      setFilteredProducts([])
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = localProducts.filter(
      (product) =>
        product.productName?.toLowerCase().includes(lowerSearchTerm) ||
        product.itemId?.toString().includes(lowerSearchTerm),
    )

    setFilteredProducts(filtered)

    logger.debug("Products filtered", {
      context: {
        filteredCount: filtered.length,
        totalCount: localProducts.length,
      },
    })
  }, [searchTerm, localProducts])

  // Buscar produtos se não houver nenhum
  useEffect(() => {
    if ((localProducts?.length === 0 || !localProducts) && !isLoading) {
      logger.info("No local products available, fetching from API")

      const fetchProducts = async () => {
        setIsLoading(true)
        try {
          logger.debug("Sending API request to fetch products")

          const response = await fetch("/api/products")

          if (!response.ok) {
            logger.error("Products API request failed", {
              code: ErrorCodes.API.REQUEST_FAILED,
              context: {
                status: response.status,
                statusText: response.statusText,
              },
            })
            throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()

          if (data.products && Array.isArray(data.products)) {
            logger.info("Products fetched successfully from API", {
              context: { count: data.products.length },
            })

            setLocalProducts(data.products)
            setFilteredProducts(data.products)
          } else {
            logger.warning("API returned invalid products data", {
              code: ErrorCodes.API.RESPONSE_INVALID,
              context: {
                responseType: typeof data.products,
                isArray: Array.isArray(data.products),
              },
            })
            // Inicializar com array vazio para evitar erros
            setLocalProducts([])
            setFilteredProducts([])
          }
        } catch (error) {
          logger.error("Error fetching products", {
            code: ErrorCodes.API.REQUEST_FAILED,
            details: error,
          })
          // Inicializar com array vazio para evitar erros
          setLocalProducts([])
          setFilteredProducts([])
        } finally {
          setIsLoading(false)
        }
      }

      fetchProducts()
    }
  }, [localProducts, isLoading])

  // Encontrar o produto selecionado
  const selectedProduct = Array.isArray(localProducts)
    ? localProducts.find((product) => product.itemId === value)
    : null

  // Log component render
  logger.debug("Component rendering", {
    context: {
      selectedProduct: selectedProduct?.itemId || "none",
      isOpen: open,
      filteredProductsCount: filteredProducts?.length || 0,
    },
  })

  return (
    <div className="space-y-4">
      {showProductNotFoundAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O produto selecionado anteriormente não está mais disponível. Por favor, selecione outro produto.
          </AlertDescription>
        </Alert>
      )}

      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          logger.debug("Popover state changed", {
            context: { previousState: open, newState: newOpen },
          })
          setOpen(newOpen)
        }}
      >
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
            ) : value && selectedProduct ? (
              <div className="flex items-center">
                <span className="truncate max-w-[300px]">{selectedProduct.productName}</span>
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
              onValueChange={(newValue) => {
                logger.debug("Search term changed", {
                  context: { previousTerm: searchTerm, newTerm: newValue },
                })
                setSearchTerm(newValue)
              }}
              aria-label="Buscar produto"
            />
            <CommandList>
              <CommandEmpty>
                {logger.debug("No products found for search term", {
                  context: { searchTerm },
                }) && null}
                Nenhum produto encontrado.
              </CommandEmpty>
              <CommandGroup heading="Produtos">
                {Array.isArray(filteredProducts) &&
                  filteredProducts.map((product) => (
                    <CommandItem
                      key={product.itemId}
                      value={product.itemId}
                      onSelect={(currentValue) => {
                        logger.info("Product selected", {
                          context: {
                            productId: currentValue,
                            productName: product.productName,
                          },
                        })
                        onChange(currentValue === value ? "" : currentValue)
                        setOpen(false)
                        setShowProductNotFoundAlert(false)
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
    </div>
  )
}
