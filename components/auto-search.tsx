"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ProductList } from "@/components/product-list"
import { Search, RefreshCw, Filter, TrendingUp, Zap } from "lucide-react"
import { debounce } from "@/lib/utils"
import { createLogger } from "@/lib/logger"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const logger = createLogger("AutoSearch")

// Categorias populares da Shopee
const CATEGORIES = [
  { id: "all", name: "Todas as categorias" },
  { id: "11", name: "Moda Feminina" },
  { id: "4", name: "Moda Masculina" },
  { id: "24", name: "Celulares & Acessórios" },
  { id: "16", name: "Beleza" },
  { id: "1", name: "Eletrônicos" },
  { id: "13", name: "Casa & Decoração" },
  { id: "21", name: "Esportes & Lazer" },
  { id: "3", name: "Computadores & Acessórios" },
  { id: "2", name: "Eletrodomésticos" },
]

// Rankings pré-definidos
const RANKINGS = [
  { id: "bestsellers", name: "Mais Vendidos Geral", sortBy: "sales", sortOrder: "desc", category: "all" },
  { id: "electronics", name: "Eletrônicos Populares", sortBy: "sales", sortOrder: "desc", category: "1" },
  { id: "fashion", name: "Moda em Alta", sortBy: "sales", sortOrder: "desc", category: "11" },
  { id: "beauty", name: "Beleza Mais Vendidos", sortBy: "sales", sortOrder: "desc", category: "16" },
  { id: "home", name: "Casa & Decoração Populares", sortBy: "sales", sortOrder: "desc", category: "13" },
  { id: "tech", name: "Tecnologia em Alta", sortBy: "sales", sortOrder: "desc", category: "3" },
  { id: "sports", name: "Esportes Populares", sortBy: "sales", sortOrder: "desc", category: "21" },
  { id: "discounts", name: "Maiores Descontos", sortBy: "discount", sortOrder: "desc", category: "all" },
]

export function AutoSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRender = useRef(true)

  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "search")

  // Estados para os parâmetros de busca
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [minSales, setMinSales] = useState(Number.parseInt(searchParams.get("minSales") || "0"))
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "sales")
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc")
  const [page, setPage] = useState(Number.parseInt(searchParams.get("page") || "1"))
  const [limit, setLimit] = useState(Number.parseInt(searchParams.get("limit") || "20"))
  const [selectedRanking, setSelectedRanking] = useState(searchParams.get("ranking") || "")

  // Estados para controle da UI
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [error, setError] = useState("")
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [activeFilters, setActiveFilters] = useState(0)
  const [dataSource, setDataSource] = useState<"cache" | "api" | "">("")
  const [searchTitle, setSearchTitle] = useState("")

  // Função para atualizar a URL com os parâmetros de busca
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()

    params.set("tab", activeTab)

    if (activeTab === "search") {
      if (keyword) params.set("keyword", keyword)
      if (category && category !== "all") params.set("category", category)
      if (minPrice) params.set("minPrice", minPrice)
      if (maxPrice) params.set("maxPrice", maxPrice)
      if (minSales > 0) params.set("minSales", minSales.toString())
      if (sortBy !== "sales") params.set("sortBy", sortBy)
      if (sortOrder !== "desc") params.set("sortOrder", sortOrder)
    } else if (activeTab === "rankings") {
      if (selectedRanking) params.set("ranking", selectedRanking)
    }

    if (page > 1) params.set("page", page.toString())
    if (limit !== 20) params.set("limit", limit.toString())

    router.push(`/dashboard/busca?${params.toString()}`)
  }, [
    activeTab,
    keyword,
    category,
    minPrice,
    maxPrice,
    minSales,
    sortBy,
    sortOrder,
    page,
    limit,
    router,
    selectedRanking,
  ])

  // Função para buscar produtos
  const fetchProducts = useCallback(
    async (forceRefresh = false) => {
      try {
        // Verificar se temos parâmetros suficientes para busca
        if (
          activeTab === "search" &&
          !keyword &&
          (category === "all" || !category) &&
          keyword.length < 2 &&
          (category === "all" || !category)
        ) {
          setProducts([])
          setError("")
          setTotalResults(0)
          setTotalPages(1)
          setSearchTitle("")
          return
        }

        setIsLoading(true)
        setError("")

        // Construir URL da API
        const apiUrl = new URL(`${window.location.origin}/api/fetch-shopee`)

        // Parâmetros comuns
        apiUrl.searchParams.append("page", page.toString())
        apiUrl.searchParams.append("limit", limit.toString())
        if (forceRefresh) apiUrl.searchParams.append("forceRefresh", "true")

        // Parâmetros específicos baseados na aba ativa
        if (activeTab === "search") {
          // Busca normal com palavra-chave e filtros
          if (keyword) apiUrl.searchParams.append("keyword", keyword)
          if (category && category !== "all") apiUrl.searchParams.append("category", category)
          if (minPrice) apiUrl.searchParams.append("minPrice", minPrice)
          if (maxPrice) apiUrl.searchParams.append("maxPrice", maxPrice)
          if (minSales > 0) apiUrl.searchParams.append("minSales", minSales.toString())
          apiUrl.searchParams.append("sortBy", sortBy)
          apiUrl.searchParams.append("sortOrder", sortOrder)

          setSearchTitle(
            keyword
              ? `Resultados para "${keyword}"${category !== "all" ? ` em ${CATEGORIES.find((c) => c.id === category)?.name || ""}` : ""}`
              : category !== "all"
                ? `Produtos em ${CATEGORIES.find((c) => c.id === category)?.name || ""}`
                : "Todos os produtos",
          )
        } else if (activeTab === "rankings") {
          // Busca por ranking pré-definido
          if (selectedRanking) {
            const ranking = RANKINGS.find((r) => r.id === selectedRanking)
            if (ranking) {
              if (ranking.category !== "all") apiUrl.searchParams.append("category", ranking.category)
              apiUrl.searchParams.append("sortBy", ranking.sortBy)
              apiUrl.searchParams.append("sortOrder", ranking.sortOrder)
              setSearchTitle(ranking.name)
            }
          } else {
            // Ranking padrão: mais vendidos geral
            apiUrl.searchParams.append("sortBy", "sales")
            apiUrl.searchParams.append("sortOrder", "desc")
            setSearchTitle("Mais Vendidos Geral")
          }
        }

        logger.info("Buscando produtos", {
          activeTab,
          keyword,
          category,
          minPrice,
          maxPrice,
          minSales,
          sortBy,
          sortOrder,
          page,
          limit,
          selectedRanking,
          forceRefresh,
        })

        const response = await fetch(apiUrl.toString())
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Erro ao buscar produtos")
        }

        if (data.success) {
          setProducts(data.products || [])
          setTotalResults(data.total || 0)
          setTotalPages(data.totalPages || 1)
          setDataSource(data.source || "")
          logger.info(`Busca concluída. Encontrados ${data.products?.length || 0} produtos`)
        } else {
          throw new Error(data.message || "Erro desconhecido ao buscar produtos")
        }
      } catch (error: any) {
        logger.error("Erro na busca de produtos", { error })
        setError(error.message || "Ocorreu um erro ao buscar produtos. Tente novamente.")
        setProducts([])
        setTotalResults(0)
        setTotalPages(1)
        setSearchTitle("")
      } finally {
        setIsLoading(false)
      }
    },
    [activeTab, keyword, category, minPrice, maxPrice, minSales, sortBy, sortOrder, page, limit, selectedRanking],
  )

  // Função debounce para busca
  const debouncedFetch = useCallback(
    debounce(() => {
      fetchProducts()
      updateUrlParams()
    }, 800),
    [fetchProducts, updateUrlParams],
  )

  // Efeito para contar filtros ativos
  useEffect(() => {
    let count = 0
    if (category && category !== "all") count++
    if (minPrice) count++
    if (maxPrice) count++
    if (minSales > 0) count++
    if (sortBy !== "sales") count++
    if (sortOrder !== "desc") count++

    setActiveFilters(count)
  }, [category, minPrice, maxPrice, minSales, sortBy, sortOrder])

  // Efeito para buscar produtos quando os parâmetros mudam
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false

      // Buscar produtos apenas se houver parâmetros na URL
      if (activeTab === "search" && (keyword || (category && category !== "all"))) {
        fetchProducts()
      } else if (activeTab === "rankings") {
        fetchProducts()
      }
      return
    }

    // Resetar página ao mudar filtros
    if (page > 1) {
      setPage(1)
      return
    }

    debouncedFetch()
  }, [
    activeTab,
    keyword,
    category,
    minPrice,
    maxPrice,
    minSales,
    sortBy,
    sortOrder,
    limit,
    selectedRanking,
    debouncedFetch,
    fetchProducts,
    page,
  ])

  // Efeito para atualizar a URL quando a página muda
  useEffect(() => {
    if (!initialRender.current) {
      updateUrlParams()
    }
  }, [page, updateUrlParams])

  // Efeito para carregar parâmetros da URL ao iniciar
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }

    const ranking = searchParams.get("ranking")
    if (ranking) {
      setSelectedRanking(ranking)
    }
  }, [searchParams])

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setCategory("all")
    setMinPrice("")
    setMaxPrice("")
    setMinSales(0)
    setSortBy("sales")
    setSortOrder("desc")
    setPage(1)
  }

  // Função para selecionar um produto
  const handleSelectProduct = (productId: string) => {
    router.push(`/dashboard/designer?productId=${productId}`)
  }

  // Função para forçar atualização dos produtos
  const handleRefresh = () => {
    fetchProducts(true)
  }

  // Função para mudar de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)

    // Se mudar para rankings e não tiver um ranking selecionado, selecionar o primeiro
    if (value === "rankings" && !selectedRanking) {
      setSelectedRanking(RANKINGS[0].id)
    }
  }

  // Função para selecionar um ranking
  const handleRankingSelect = (rankingId: string) => {
    setSelectedRanking(rankingId)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Busca Personalizada</span>
          </TabsTrigger>
          <TabsTrigger value="rankings" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Rankings Populares</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar produtos na Shopee..."
                className="pl-8"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {activeFilters > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilters}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtros de Busca</SheetTitle>
                    <SheetDescription>Refine sua busca de produtos</SheetDescription>
                  </SheetHeader>

                  <div className="py-4 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="price-range">Faixa de Preço (R$)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="min-price"
                          type="number"
                          placeholder="Mín"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        <span>-</span>
                        <Input
                          id="max-price"
                          type="number"
                          placeholder="Máx"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min-sales">Vendas Mínimas: {minSales}</Label>
                      <Slider
                        id="min-sales"
                        value={[minSales]}
                        min={0}
                        max={1000}
                        step={10}
                        onValueChange={(value) => setMinSales(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>500</span>
                        <span>1000+</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sort-by">Ordenar por</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger id="sort-by">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Vendas</SelectItem>
                          <SelectItem value="price">Preço</SelectItem>
                          <SelectItem value="rating">Avaliação</SelectItem>
                          <SelectItem value="discount">Desconto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sort-order">Ordem</Label>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger id="sort-order">
                          <SelectValue placeholder="Ordem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Maior para menor</SelectItem>
                          <SelectItem value="asc">Menor para maior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="results-per-page">Resultados por página</Label>
                      <Select value={limit.toString()} onValueChange={(value) => setLimit(Number.parseInt(value))}>
                        <SelectTrigger id="results-per-page">
                          <SelectValue placeholder="Resultados por página" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <SheetFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Limpar Filtros
                    </Button>
                    <SheetClose asChild>
                      <Button className="w-full">Aplicar Filtros</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2">
            {RANKINGS.map((ranking) => (
              <Card
                key={ranking.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedRanking === ranking.id ? "border-primary ring-2 ring-primary/20" : ""}`}
                onClick={() => handleRankingSelect(ranking.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {ranking.id === "bestsellers" && <TrendingUp className="h-5 w-5 text-orange-500" />}
                    {ranking.id === "discounts" && <Zap className="h-5 w-5 text-purple-500" />}
                    {ranking.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {ranking.id === "bestsellers" && "Os produtos mais vendidos de todas as categorias"}
                    {ranking.id === "electronics" && "Eletrônicos com maior volume de vendas"}
                    {ranking.id === "fashion" && "Itens de moda feminina mais populares"}
                    {ranking.id === "beauty" && "Produtos de beleza mais vendidos"}
                    {ranking.id === "home" && "Itens para casa com maior demanda"}
                    {ranking.id === "tech" && "Tecnologia e acessórios mais populares"}
                    {ranking.id === "sports" && "Equipamentos esportivos mais vendidos"}
                    {ranking.id === "discounts" && "Produtos com os maiores descontos"}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0">
                  {selectedRanking === ranking.id ? (
                    <Badge variant="outline" className="bg-primary/10">
                      Selecionado
                    </Badge>
                  ) : (
                    <Badge variant="outline">Clique para ver</Badge>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar Ranking
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Informações da busca */}
      {products.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{searchTitle}</h2>
            <span className="text-muted-foreground">
              ({products.length} de {totalResults} resultados)
            </span>
            {dataSource && (
              <Badge variant="outline" className="text-xs">
                Fonte: {dataSource === "cache" ? "Cache" : "API"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "search" && activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                Limpar filtros ({activeFilters})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Lista de produtos */}
      <ProductList products={products} isLoading={isLoading} error={error} onSelectProduct={handleSelectProduct} />

      {/* Paginação */}
      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}
