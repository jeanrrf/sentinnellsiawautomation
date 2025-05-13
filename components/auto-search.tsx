"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Search, Filter, ArrowDownUp, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductList } from "@/components/product-list"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { saveLastSearchResults } from "@/lib/search-store"

export function AutoSearch() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [searchParams, setSearchParams] = useState({
    limit: "20",
    sortType: "2",
    category: "",
    keyword: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    minDiscount: "",
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/fetch-shopee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 20,
          sortType: 2,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao buscar produtos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        const productsData = data.products || []
        setProducts(productsData)
        saveLastSearchResults(productsData)
      } else {
        throw new Error(data.message || "Falha ao buscar produtos")
      }
    } catch (err: any) {
      console.error("Erro ao buscar produtos:", err)
      setError(err.message || "Falha ao buscar produtos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchProducts = async () => {
    try {
      setIsFetching(true)
      setError("")

      const searchBody: any = {
        limit: Number.parseInt(searchParams.limit),
        sortType: Number.parseInt(searchParams.sortType),
      }

      if (searchParams.category) searchBody.category = searchParams.category
      if (searchParams.keyword) searchBody.keyword = searchParams.keyword
      if (searchParams.minPrice) searchBody.minPrice = Number.parseFloat(searchParams.minPrice)
      if (searchParams.maxPrice) searchBody.maxPrice = Number.parseFloat(searchParams.maxPrice)
      if (searchParams.minRating) searchBody.minRating = Number.parseFloat(searchParams.minRating)
      if (searchParams.minDiscount) searchBody.minDiscountRate = Number.parseInt(searchParams.minDiscount)

      const response = await fetch("/api/fetch-shopee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `Falha ao buscar produtos da Shopee: ${response.status} ${response.statusText}`,
        )
      }

      const data = await response.json()

      if (data.success) {
        const productsData = data.products || []
        setProducts(productsData)
        saveLastSearchResults(productsData)
        setError("")
      } else {
        throw new Error(data.message || "Falha ao buscar produtos da Shopee")
      }
    } catch (err: any) {
      setError(err.message || "Falha ao buscar produtos da Shopee")
      console.error("Erro ao buscar produtos da Shopee:", err)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    const filters = []

    if (searchParams.keyword) filters.push(`Palavra-chave: ${searchParams.keyword}`)
    if (searchParams.category) filters.push(`Categoria: ${searchParams.category}`)
    if (searchParams.minPrice) filters.push(`Preço mín: R$${searchParams.minPrice}`)
    if (searchParams.maxPrice) filters.push(`Preço máx: R$${searchParams.maxPrice}`)
    if (searchParams.minRating) filters.push(`Avaliação mín: ${searchParams.minRating}★`)
    if (searchParams.minDiscount) filters.push(`Desconto mín: ${searchParams.minDiscount}%`)

    setActiveFilters(filters)
  }, [searchParams])

  const clearFilter = (filter: string) => {
    if (filter.startsWith("Palavra-chave:")) {
      setSearchParams({ ...searchParams, keyword: "" })
    } else if (filter.startsWith("Categoria:")) {
      setSearchParams({ ...searchParams, category: "" })
    } else if (filter.startsWith("Preço mín:")) {
      setSearchParams({ ...searchParams, minPrice: "" })
    } else if (filter.startsWith("Preço máx:")) {
      setSearchParams({ ...searchParams, maxPrice: "" })
    } else if (filter.startsWith("Avaliação mín:")) {
      setSearchParams({ ...searchParams, minRating: "" })
    } else if (filter.startsWith("Desconto mín:")) {
      setSearchParams({ ...searchParams, minDiscount: "" })
    }
  }

  const clearAllFilters = () => {
    setSearchParams({
      ...searchParams,
      keyword: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      minDiscount: "",
    })
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Buscar produtos por palavra-chave..."
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              className="pr-10"
            />
            {searchParams.keyword && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchParams({ ...searchParams, keyword: "" })}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Limpar busca</span>
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros de Busca</SheetTitle>
                </SheetHeader>

                <div className="py-4 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="limit">Limite de Produtos</Label>
                    <Select
                      value={searchParams.limit}
                      onValueChange={(value) => setSearchParams({ ...searchParams, limit: value })}
                    >
                      <SelectTrigger id="limit">
                        <SelectValue placeholder="Selecione o limite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 produtos</SelectItem>
                        <SelectItem value="20">20 produtos</SelectItem>
                        <SelectItem value="50">50 produtos</SelectItem>
                        <SelectItem value="100">100 produtos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortType">Ordenação</Label>
                    <Select
                      value={searchParams.sortType}
                      onValueChange={(value) => setSearchParams({ ...searchParams, sortType: value })}
                    >
                      <SelectTrigger id="sortType">
                        <SelectValue placeholder="Selecione a ordenação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">Mais Vendidos</SelectItem>
                        <SelectItem value="1">Mais Recentes</SelectItem>
                        <SelectItem value="3">Preço (menor para maior)</SelectItem>
                        <SelectItem value="4">Preço (maior para menor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">ID da Categoria</Label>
                    <Input
                      id="category"
                      placeholder="ID da categoria (opcional)"
                      value={searchParams.category}
                      onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Faixa de Preço (R$)</Label>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Mínimo"
                        type="number"
                        min="0"
                        value={searchParams.minPrice}
                        onChange={(e) => setSearchParams({ ...searchParams, minPrice: e.target.value })}
                      />
                      <Input
                        placeholder="Máximo"
                        type="number"
                        min="0"
                        value={searchParams.maxPrice}
                        onChange={(e) => setSearchParams({ ...searchParams, maxPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minRating">Avaliação Mínima</Label>
                    <Select
                      value={searchParams.minRating}
                      onValueChange={(value) => setSearchParams({ ...searchParams, minRating: value })}
                    >
                      <SelectTrigger id="minRating">
                        <SelectValue placeholder="Qualquer avaliação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Qualquer avaliação</SelectItem>
                        <SelectItem value="3">3 estrelas ou mais</SelectItem>
                        <SelectItem value="4">4 estrelas ou mais</SelectItem>
                        <SelectItem value="4.5">4.5 estrelas ou mais</SelectItem>
                        <SelectItem value="4.8">4.8 estrelas ou mais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minDiscount">Desconto Mínimo</Label>
                    <Select
                      value={searchParams.minDiscount}
                      onValueChange={(value) => setSearchParams({ ...searchParams, minDiscount: value })}
                    >
                      <SelectTrigger id="minDiscount">
                        <SelectValue placeholder="Qualquer desconto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Qualquer desconto</SelectItem>
                        <SelectItem value="10">10% ou mais</SelectItem>
                        <SelectItem value="20">20% ou mais</SelectItem>
                        <SelectItem value="30">30% ou mais</SelectItem>
                        <SelectItem value="40">40% ou mais</SelectItem>
                        <SelectItem value="50">50% ou mais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={clearAllFilters}>
                      Limpar Filtros
                    </Button>
                    <Button onClick={handleFetchProducts} disabled={isFetching}>
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button onClick={handleFetchProducts} disabled={isFetching}>
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                {filter}
                <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => clearFilter(filter)}>
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remover filtro</span>
                </Button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-7" onClick={clearAllFilters}>
              Limpar todos
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Produtos</CardTitle>
          <Select
            value={searchParams.sortType}
            onValueChange={(value) => {
              setSearchParams({ ...searchParams, sortType: value })
              if (products.length > 0) handleFetchProducts()
            }}
          >
            <SelectTrigger className="w-[180px]">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Mais Vendidos</SelectItem>
              <SelectItem value="1">Mais Recentes</SelectItem>
              <SelectItem value="3">Preço (menor para maior)</SelectItem>
              <SelectItem value="4">Preço (maior para menor)</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ProductList
            products={products}
            isLoading={isLoading || isFetching}
            error={error}
            onSelectProduct={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  )
}
