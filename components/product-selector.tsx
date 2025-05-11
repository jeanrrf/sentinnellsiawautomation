"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, ChevronsUpDown, AlertCircle, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createLogger, ErrorCodes } from "@/lib/logger"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Create a module-specific logger
const logger = createLogger("ProductSelector")

export interface Product {
  itemId: string
  productName: string
  price: string | number
  sales: number
  imageUrl?: string
}

interface ProductSelectorProps {
  products: Product[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  showAlert?: boolean
}

export function ProductSelector({
  products,
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um produto",
  className,
  showAlert = true,
}: ProductSelectorProps) {
  // Component state
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [localProducts, setLocalProducts] = useState<Product[]>([])
  const [showProductNotFoundAlert, setShowProductNotFoundAlert] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [fetchAttempts, setFetchAttempts] = useState(0)

  // Unique ID for accessibility
  const selectorId = useMemo(() => `product-selector-${Math.random().toString(36).substring(2, 9)}`, [])

  // Initialize local products when external products change
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      logger.debug("Initializing local products from props", {
        context: { count: products.length },
      })
      setLocalProducts(products)
      setHasInitialized(true)
    }
  }, [products])

  // Validate selected product exists in the product list
  useEffect(() => {
    if (hasInitialized && value && Array.isArray(localProducts) && localProducts.length > 0) {
      const productExists = localProducts.some((product) => product.itemId === value)

      if (!productExists) {
        logger.warning("Selected product not found in product list", {
          context: { selectedProductId: value },
        })

        if (showAlert) {
          setShowProductNotFoundAlert(true)
        }
      } else {
        setShowProductNotFoundAlert(false)
      }
    }
  }, [value, localProducts, hasInitialized, showAlert])

  // Fetch products if none are available
  useEffect(() => {
    const shouldFetchProducts =
      (hasInitialized && !Array.isArray(localProducts)) || (Array.isArray(localProducts) && localProducts.length === 0)

    // Limitar a 3 tentativas para evitar loops infinitos
    if (shouldFetchProducts && !isLoading && fetchAttempts < 3) {
      logger.info("No local products available, fetching from API")

      const fetchProducts = async () => {
        setIsLoading(true)
        try {
          const response = await fetch("/api/products")

          if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()

          if (data.products && Array.isArray(data.products)) {
            logger.info("Products fetched successfully", {
              context: { count: data.products.length },
            })
            setLocalProducts(data.products)

            // Se não houver produtos, não tente novamente
            if (data.products.length === 0) {
              setFetchAttempts(3) // Impedir novas tentativas
            }
          } else {
            logger.warning("API returned invalid products data", {
              code: ErrorCodes.API.RESPONSE_INVALID,
            })
            setLocalProducts([])
            setFetchAttempts(fetchAttempts + 1)
          }
        } catch (error) {
          logger.error("Error fetching products", {
            code: ErrorCodes.API.REQUEST_FAILED,
            details: error,
          })
          setLocalProducts([])
          setFetchAttempts(fetchAttempts + 1)
        } finally {
          setIsLoading(false)
        }
      }

      fetchProducts()
    }
  }, [localProducts, isLoading, hasInitialized, fetchAttempts])

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(localProducts)) {
      return []
    }

    if (!searchTerm) {
      return localProducts
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    return localProducts.filter(
      (product) =>
        product.productName?.toLowerCase().includes(lowerSearchTerm) ||
        product.itemId?.toString().includes(lowerSearchTerm),
    )
  }, [localProducts, searchTerm])

  // Find the selected product
  const selectedProduct = useMemo(() => {
    if (!Array.isArray(localProducts) || !value) {
      return null
    }
    return localProducts.find((product) => product.itemId === value)
  }, [localProducts, value])

  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    const newValue = productId === value ? "" : productId
    logger.info("Product selection changed", {
      context: {
        previousValue: value,
        newValue,
      },
    })
    onChange(newValue)
    setOpen(false)
    setShowProductNotFoundAlert(false)
  }

  // Função para forçar uma nova busca
  const handleRefresh = () => {
    setFetchAttempts(0)
    setLocalProducts([])
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showProductNotFoundAlert && (
        <Alert variant="destructive" className="mb-2 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            O produto selecionado não está mais disponível. Por favor, selecione outro produto.
          </AlertDescription>
        </Alert>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${selectorId}-dropdown`}
            className={cn(
              "w-full justify-between transition-all",
              selectedProduct ? "text-foreground" : "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
            id={selectorId}
            data-testid="product-selector-button"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando produtos...</span>
              </div>
            ) : selectedProduct ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 truncate">
                  {selectedProduct.imageUrl && (
                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={selectedProduct.imageUrl || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <span className="truncate">{selectedProduct.productName}</span>
                </div>
                <Badge variant="outline" className="ml-2 flex-shrink-0">
                  R$ {selectedProduct.price}
                </Badge>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start" id={`${selectorId}-dropdown`} side="bottom" sideOffset={4}>
          <Command className="w-full" shouldFilter={false}>
            <div className="flex items-center border-b px-3 py-2">
              <Search className="h-4 w-4 mr-2 opacity-50 flex-shrink-0" />
              <CommandInput
                placeholder="Buscar produto..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="flex-1 outline-none border-0 focus:ring-0 focus-visible:ring-0 p-0"
              />
            </div>

            <CommandList className="max-h-[300px] overflow-auto">
              {isLoading ? (
                <div className="p-2 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 p-2">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-6 text-center text-sm">
                  {searchTerm ? (
                    <>
                      Nenhum produto encontrado para <strong>"{searchTerm}"</strong>
                    </>
                  ) : fetchAttempts >= 3 ? (
                    <div className="flex flex-col items-center gap-2">
                      <p>Não foi possível carregar produtos.</p>
                      <Button size="sm" variant="outline" onClick={handleRefresh}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    "Nenhum produto disponível"
                  )}
                </div>
              ) : (
                <CommandGroup heading="Produtos">
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.itemId}
                      value={product.itemId}
                      onSelect={() => handleSelectProduct(product.itemId)}
                      className="flex items-center gap-2 py-3 px-2 cursor-pointer"
                      data-selected={value === product.itemId ? "true" : "false"}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                          value === product.itemId ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        {value === product.itemId && <Check className="h-3 w-3" />}
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{product.productName}</span>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>ID: {product.itemId}</span>
                          <span className="flex items-center gap-2">
                            <span>R$ {product.price}</span>
                            <span>•</span>
                            <span>Vendas: {product.sales}</span>
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
