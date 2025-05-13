"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, ShoppingCart, TrendingUp, ExternalLink, RefreshCw, AlertCircle, ArrowUpDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

interface Product {
  itemId: string
  productName: string
  price: string
  priceDiscountRate?: string
  calculatedOriginalPrice?: string
  imageUrl: string
  sales: string
  ratingStar?: string
  shopName: string
  offerLink: string
}

interface ProductListProps {
  products: Product[]
  isLoading: boolean
  error: string
  onSelectProduct?: (productId: string) => void
}

export function ProductList({ products, isLoading, error, onSelectProduct }: ProductListProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [sortField, setSortField] = useState<string>("sales")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  // Debug: log products when they change
  console.log("ProductList received products:", products)

  const handleFetchProducts = async () => {
    try {
      setIsFetching(true)
      const response = await fetch("/api/fetch-shopee", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Reload the page to show the new products
        window.location.reload()
      } else {
        throw new Error(data.message || "Failed to fetch products from Shopee")
      }
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Erro ao buscar produtos",
        description: err.message,
      })
    } finally {
      setIsFetching(false)
    }
  }

  const handleSelectProduct = (productId: string) => {
    // Se temos uma função de callback para selecionar produto, usamos ela
    if (onSelectProduct) {
      onSelectProduct(productId)
    } else {
      // Caso contrário, mudamos para a aba 2 e selecionamos o produto
      // Encontramos o elemento da aba 2 e clicamos nele
      const generatorTab = document.querySelector('[data-state="inactive"][value="generator"]')
      if (generatorTab) {
        // Armazenamos o ID do produto selecionado no localStorage para recuperá-lo na aba 2
        localStorage.setItem("selectedProductId", productId)

        // Clicamos na aba 2
        ;(generatorTab as HTMLElement).click()
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao mudar para a aba Gerador de Cards",
          description: "Não foi possível encontrar a aba Gerador de Cards",
        })
      }
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to descending
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    let valueA, valueB

    switch (sortField) {
      case "price":
        valueA = Number.parseFloat(a.price)
        valueB = Number.parseFloat(b.price)
        break
      case "sales":
        valueA = Number.parseInt(a.sales)
        valueB = Number.parseInt(b.sales)
        break
      case "discount":
        valueA = a.priceDiscountRate ? Number.parseFloat(a.priceDiscountRate) : 0
        valueB = b.priceDiscountRate ? Number.parseFloat(b.priceDiscountRate) : 0
        break
      case "rating":
        valueA = a.ratingStar ? Number.parseFloat(a.ratingStar) : 0
        valueB = b.ratingStar ? Number.parseFloat(b.ratingStar) : 0
        break
      default:
        valueA = a[sortField]
        valueB = b[sortField]
    }

    if (sortDirection === "asc") {
      return valueA > valueB ? 1 : -1
    } else {
      return valueA < valueB ? 1 : -1
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={handleFetchProducts} disabled={isFetching}>
            {isFetching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Buscando Produtos...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Buscar Produtos da Shopee
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Debug: log products length
  console.log("Products length:", products?.length || 0)

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum produto encontrado</AlertTitle>
          <AlertDescription>
            Não há produtos carregados. Clique no botão abaixo para buscar produtos da Shopee.
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button onClick={handleFetchProducts} disabled={isFetching}>
            {isFetching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Buscando Produtos...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Buscar Produtos da Shopee
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button onClick={handleFetchProducts} disabled={isFetching}>
          {isFetching ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Buscando Produtos...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Produtos
            </>
          )}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("productName")}>
                  Produto
                  {sortField === "productName" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("price")}>
                  Preço
                  {sortField === "price" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("discount")}>
                  Desconto
                  {sortField === "discount" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("sales")}>
                  Vendas
                  {sortField === "sales" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("rating")}>
                  Avaliação
                  {sortField === "rating" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("shopName")}>
                  Loja
                  {sortField === "shopName" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.itemId}>
                <TableCell>
                  <div className="w-16 h-16 relative overflow-hidden rounded-md">
                    <img
                      src={product.imageUrl || "/placeholder.svg?height=64&width=64&query=product"}
                      alt={product.productName}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="max-w-xs">
                    <p className="truncate" title={product.productName}>
                      {product.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">ID: {product.itemId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-bold">{formatCurrency(Number.parseFloat(product.price))}</p>
                    {product.calculatedOriginalPrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(Number.parseFloat(product.calculatedOriginalPrice))}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {product.priceDiscountRate && Number(product.priceDiscountRate) > 0 ? (
                    <Badge variant="destructive">-{product.priceDiscountRate}%</Badge>
                  ) : (
                    <span className="text-muted-foreground">Sem desconto</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    <span>{product.sales}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{product.ratingStar || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="truncate max-w-[120px] block" title={product.shopName}>
                    {product.shopName}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(product.offerLink, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Ver produto</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSelectProduct(product.itemId)}
                      disabled={selectedProduct === product.itemId}
                    >
                      {selectedProduct === product.itemId ? (
                        "Selecionando..."
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Gerar Card
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
