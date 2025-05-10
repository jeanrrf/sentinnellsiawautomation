"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ExternalLink } from "lucide-react"

interface ProductListProps {
  products: any[]
  isLoading: boolean
  error: string
  onSelectProduct: (productId: string) => void
}

export function ProductList({ products, isLoading, error, onSelectProduct }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filtrar produtos com base no termo de pesquisa
  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.itemId.toString().includes(searchTerm),
  )

  // Ordenar produtos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0

    let valueA = a[sortField]
    let valueB = b[sortField]

    // Converter para número se for um campo numérico
    if (sortField === "price" || sortField === "sales" || sortField === "ratingStar") {
      valueA = Number(valueA)
      valueB = Number(valueB)
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Função para alternar a ordenação
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Renderizar seta de ordenação
  const renderSortArrow = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? " ↑" : " ↓"
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum produto encontrado. Use os parâmetros acima para buscar produtos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("productName")}>
                Nome{renderSortArrow("productName")}
              </TableHead>
              <TableHead className="cursor-pointer w-[100px] text-right" onClick={() => toggleSort("price")}>
                Preço{renderSortArrow("price")}
              </TableHead>
              <TableHead className="cursor-pointer w-[100px] text-right" onClick={() => toggleSort("sales")}>
                Vendas{renderSortArrow("sales")}
              </TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.itemId}>
                <TableCell>
                  <div className="w-12 h-12 rounded overflow-hidden">
                    <img
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="truncate max-w-[300px]" title={product.productName}>
                    {product.productName}
                  </div>
                  <div className="text-xs text-muted-foreground">ID: {product.itemId}</div>
                </TableCell>
                <TableCell className="text-right">R$ {Number(product.price).toFixed(2)}</TableCell>
                <TableCell className="text-right">{product.sales}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onSelectProduct(product.itemId)}>
                      Selecionar
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={product.offerLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredProducts.length} de {products.length} produtos
      </div>
    </div>
  )
}
