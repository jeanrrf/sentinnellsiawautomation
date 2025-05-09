"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductList } from "@/components/product-list"

export function AutoSearch() {
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<any>(null)
  const [products, setProducts] = useState([])
  const [error, setError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useState({
    limit: "20",
    sortType: "2",
    category: "",
  })

  const fetchCacheStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/cache/status")

      if (!response.ok) {
        throw new Error(`Failed to fetch cache status: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setCacheStatus(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch cache status")
      console.error("Error fetching cache status:", err)
      // Set default empty cache status
      setCacheStatus({ stats: { info: {}, keys: {} }, timestamp: new Date().toISOString() })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/products")

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch products")
      console.error("Error fetching products:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchProducts = async () => {
    try {
      setIsFetching(true)
      setError(null)

      const response = await fetch("/api/fetch-shopee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: Number.parseInt(searchParams.limit),
          sortType: Number.parseInt(searchParams.sortType),
          category: searchParams.category || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products from Shopee: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        await fetchProducts()
        await fetchCacheStatus()
        setError(null)
      } else {
        throw new Error(data.message || "Failed to fetch products from Shopee")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch products from Shopee")
      console.error("Error fetching products from Shopee:", err)
    } finally {
      setIsFetching(false)
    }
  }

  const cleanupCache = async () => {
    try {
      setIsCleaning(true)
      setError(null)

      const response = await fetch("/api/cache/cleanup", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to clean up cache: ${response.status} ${response.statusText}`)
      }

      await fetchCacheStatus()
    } catch (err: any) {
      setError(err.message || "Failed to clean up cache")
      console.error("Error cleaning up cache:", err)
    } finally {
      setIsCleaning(false)
    }
  }

  useEffect(() => {
    fetchCacheStatus()
    fetchProducts()
  }, [])

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Search Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de Busca</CardTitle>
            <CardDescription>Configure os parâmetros para busca de produtos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Input
                id="category"
                placeholder="ID da categoria (deixe em branco para todas)"
                value={searchParams.category}
                onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleFetchProducts} disabled={isFetching} className="w-full">
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando Produtos...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Buscar Produtos
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Cache Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Cache</CardTitle>
            <CardDescription>Informações sobre o cache</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Produtos em Cache:</span>
                  <span className="font-medium">{cacheStatus?.stats?.keys?.products ? "Sim" : "Não"}</span>
                </div>
                <div className="flex justify-between">
                  <span>IDs Processados:</span>
                  <span className="font-medium">{cacheStatus?.stats?.keys?.processedIds || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descrições em Cache:</span>
                  <span className="font-medium">{cacheStatus?.descriptionKeys || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Chaves:</span>
                  <span className="font-medium">{cacheStatus?.stats?.totalKeys || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última Atualização:</span>
                  <span className="font-medium">
                    {cacheStatus?.timestamp ? new Date(cacheStatus.timestamp).toLocaleTimeString() : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={fetchCacheStatus} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="destructive" onClick={cleanupCache} disabled={isCleaning}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Cache
            </Button>
          </CardFooter>
        </Card>

        {/* Redis Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Servidor</CardTitle>
            <CardDescription>Estatísticas básicas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[200px]">
                  {cacheStatus?.stats?.info && typeof cacheStatus.stats.info === "object" ? (
                    <pre>{JSON.stringify(cacheStatus.stats.info, null, 2)}</pre>
                  ) : (
                    <p className="text-muted-foreground">Informações não disponíveis</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Encontrados</CardTitle>
          <CardDescription>
            {products.length > 0
              ? `${products.length} produtos encontrados`
              : "Nenhum produto encontrado. Use os parâmetros acima para buscar produtos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductList products={products} isLoading={isLoading} error={error || ""} onSelectProduct={() => {}} />
        </CardContent>
      </Card>

      {/* Cache Samples */}
      {cacheStatus?.descriptionSamples && Object.keys(cacheStatus.descriptionSamples).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Amostras de Descrições</CardTitle>
            <CardDescription>Exemplos de descrições armazenadas no cache</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(cacheStatus.descriptionSamples).map(([productId, description]) => (
                <div key={productId} className="border-b pb-4">
                  <h3 className="font-medium mb-2">ID do Produto: {productId}</h3>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">{description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
