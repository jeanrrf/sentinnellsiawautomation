"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductList } from "@/components/product-list"
import { VideoGenerator } from "@/components/video-generator"
import { ScheduleManager } from "@/components/schedule-manager"
import { Header } from "@/components/header"
import { AnimatedLogo } from "@/components/animated-logo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkflowGuide } from "@/components/workflow-guide"

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [activeTab, setActiveTab] = useState("products")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError("")

        console.log("Fetching products...")

        // Add a timeout to the fetch to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch("/api/products", {
          signal: controller.signal,
        }).catch((err) => {
          if (err.name === "AbortError") {
            throw new Error("Request timed out after 10 seconds")
          }
          throw err
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => "No error details available")
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}. Details: ${errorText}`)
        }

        const data = await response.json()
        console.log("Products API response:", data)

        if (data.success) {
          setProducts(data.products || [])
          console.log(`Loaded ${data.products?.length || 0} products from ${data.source || "unknown source"}`)
        } else {
          setError(data.message || "Failed to fetch products")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching products")
        console.error("Error fetching products:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [retryCount])

  // Verificar se há um produto selecionado no localStorage ao carregar
  useEffect(() => {
    const storedProductId = localStorage.getItem("selectedProductId")
    if (storedProductId) {
      setSelectedProductId(storedProductId)
      setActiveTab("generator")
    }
  }, [])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleFetchProducts = async () => {
    try {
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
      alert(`Error fetching products: ${err.message}`)
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId)
    setActiveTab("generator")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Header />

      <div className="flex justify-center my-8">
        <AnimatedLogo />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <RefreshCw className="h-4 w-4 mr-2" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="generator" disabled={products.length === 0}>
            Gerador de Cards
          </TabsTrigger>
          <TabsTrigger value="scheduler">Agendamento</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="w-full overflow-x-auto">
          <ProductList products={products} isLoading={isLoading} error={error} onSelectProduct={handleSelectProduct} />
        </TabsContent>

        <TabsContent value="generator">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Alert className="mb-6">
                <AlertDescription>
                  Você precisa buscar produtos da Shopee antes de usar o gerador de cards.
                </AlertDescription>
              </Alert>
              <Button onClick={handleFetchProducts}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Buscar Produtos da Shopee
              </Button>
            </div>
          ) : (
            <>
              <VideoGenerator products={products} />
              <WorkflowGuide />
            </>
          )}
        </TabsContent>

        <TabsContent value="scheduler">
          <ScheduleManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
