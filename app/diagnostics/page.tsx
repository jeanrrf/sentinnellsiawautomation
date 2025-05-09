"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envVars, setEnvVars] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])

  const checkEnvironmentVariables = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/env-check")

      if (!response.ok) {
        throw new Error(`Failed to check environment variables: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setEnvVars(data)
    } catch (err: any) {
      setError(err.message || "Failed to check environment variables")
      console.error(err)
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

      if (data.success) {
        setProducts(data.products || [])
      } else {
        throw new Error(data.message || "Failed to fetch products")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch products")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkEnvironmentVariables()
  }, [])

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="env" className="w-full">
        <TabsList>
          <TabsTrigger value="env">Environment</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="env">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Check if all required environment variables are set</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : envVars ? (
                <div className="space-y-4">
                  {Object.entries(envVars).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">{key}</span>
                      <span className="flex items-center">
                        {value ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        {value ? "Set" : "Not Set"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Button onClick={checkEnvironmentVariables}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Environment Variables
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products API Test</CardTitle>
              <CardDescription>Test if the products API is working correctly</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchProducts} disabled={isLoading} className="mb-6">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Products...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Fetch Products
                  </>
                )}
              </Button>

              {products.length > 0 ? (
                <div>
                  <p className="mb-4 text-green-500 font-medium">
                    <CheckCircle2 className="inline-block h-5 w-5 mr-2" />
                    Successfully fetched {products.length} products
                  </p>
                  <div className="border rounded-md p-4 bg-muted/50">
                    <h3 className="font-medium mb-2">First Product:</h3>
                    <pre className="text-xs overflow-auto">{JSON.stringify(products[0], null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Click the button above to test the products API</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
