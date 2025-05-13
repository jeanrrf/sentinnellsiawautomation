"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategorySelector } from "@/components/trending/category-selector"
import { TrendingGrid } from "@/components/trending/trending-grid"
import { CategorySection } from "@/components/trending/category-section"
import { ProductDetailDialog } from "@/components/trending/product-detail-dialog"
import { DashboardWithNav } from "@/components/dashboard-with-nav"
import type { Category, TrendingProduct } from "@/lib/trending-products-service"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFallbackData } from "@/components/trending/fallback-data-provider"

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState("categorias")
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<TrendingProduct[]>([])
  const [categoryProducts, setCategoryProducts] = useState<{ category: Category; products: TrendingProduct[] }[]>([])
  const [selectedProduct, setSelectedProduct] = useState<TrendingProduct | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dados de fallback para quando a API falhar
  const fallbackData = useFallbackData()
  const [usingFallbackData, setUsingFallbackData] = useState(false)

  // Carregar categorias
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/trending-products", {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error(`Falha ao carregar categorias: ${response.status}`)
        }

        const data = await response.json()
        if (data.success) {
          setCategories(data.data)
          setUsingFallbackData(false)
        } else {
          throw new Error(data.error || "Erro ao carregar categorias")
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error)
        setError("Não foi possível carregar as categorias da API. Usando dados de exemplo.")
        if (fallbackData.isLoaded) {
          setCategories(fallbackData.categories)
          setUsingFallbackData(true)
        }
      }
    }

    fetchCategories()
  }, [])

  // Carregar produtos com base na categoria selecionada
  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true)
      setError(null)

      try {
        const url = `/api/trending-products?${selectedCategory ? `category=${selectedCategory}&` : ""}limit=20`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Falha ao carregar produtos: ${response.status}`)
        }

        const data = await response.json()
        if (data.success) {
          setProducts(data.data)
          setUsingFallbackData(false)
        } else {
          throw new Error(data.error || "Erro ao carregar produtos")
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error)
        setError("Não foi possível carregar os produtos da API. Usando dados de exemplo.")
        if (fallbackData.isLoaded) {
          setProducts(fallbackData.getProductsByCategory(selectedCategory))
          setUsingFallbackData(true)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory])

  // Carregar produtos por categoria para a aba "Categorias"
  useEffect(() => {
    if (activeTab === "categorias") {
      async function fetchCategoryProducts() {
        setIsLoading(true)
        setError(null)

        try {
          const url = `/api/trending-products?all=true&limit=5`

          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`Falha ao carregar produtos por categoria: ${response.status}`)
          }

          const data = await response.json()
          if (data.success) {
            setCategoryProducts(data.data)
            setUsingFallbackData(false)
          } else {
            throw new Error(data.error || "Erro ao carregar produtos por categoria")
          }
        } catch (error) {
          console.error("Erro ao carregar produtos por categoria:", error)
          setError("Não foi possível carregar os produtos por categoria da API. Usando dados de exemplo.")
          if (fallbackData.isLoaded) {
            setCategoryProducts(fallbackData.categoryProducts)
            setUsingFallbackData(true)
          }
        } finally {
          setIsLoading(false)
        }
      }

      fetchCategoryProducts()
    }
  }, [activeTab])

  // Função para selecionar uma categoria
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setActiveTab("todos")
  }

  // Função para visualizar mais produtos de uma categoria
  const handleViewMore = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setActiveTab("todos")
  }

  // Função para selecionar um produto
  const handleSelectProduct = (product: TrendingProduct) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  // Função para atualizar os dados
  const handleRefresh = () => {
    if (activeTab === "categorias") {
      setCategoryProducts([])
      setActiveTab("categorias") // Isso vai disparar o useEffect para recarregar
    } else {
      setProducts([])
      setSelectedCategory(selectedCategory) // Isso vai disparar o useEffect para recarregar
    }
  }

  // Função para controlar o estado do diálogo
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // Quando o diálogo é fechado, limpe o produto selecionado
      setSelectedProduct(null)
    }
  }

  const content = (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {usingFallbackData && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            Usando dados de exemplo devido a problemas de conexão com a API da Shopee.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="categorias">Por Categorias</TabsTrigger>
          <TabsTrigger value="todos">Todos os Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div>
              {categoryProducts.map(({ category, products }) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  products={products}
                  onSelectProduct={handleSelectProduct}
                  onViewMore={handleViewMore}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos">
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onChange={handleCategoryChange}
          />

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TrendingGrid products={products} onSelectProduct={handleSelectProduct} />
          )}
        </TabsContent>
      </Tabs>

      {/* Só renderize o diálogo quando isDialogOpen for true */}
      <ProductDetailDialog product={selectedProduct} open={isDialogOpen} onOpenChange={handleDialogOpenChange} />
    </div>
  )

  return (
    <DashboardWithNav
      title="Produtos em Alta"
      description="Visualize os produtos mais populares da Shopee por categoria"
    >
      {content}
    </DashboardWithNav>
  )
}
