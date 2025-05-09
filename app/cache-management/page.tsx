"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Header } from "@/components/header"

export default function CacheManagementPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaning, setIsCleaning] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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
      console.error(err)
    } finally {
      setIsLoading(false)
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
      console.error(err)
    } finally {
      setIsCleaning(false)
    }
  }

  useEffect(() => {
    fetchCacheStatus()
  }, [])

  return (
    <div className="container mx-auto px-4 py-6">
      <Header />

      <h1 className="text-3xl font-bold mb-6">Cache Management</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Cache Status</CardTitle>
            <CardDescription>Current Redis cache status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Products Cached:</span>
                  <span className="font-medium">{cacheStatus?.stats?.keys?.products ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processed IDs:</span>
                  <span className="font-medium">{cacheStatus?.stats?.keys?.processedIds || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cached Descriptions:</span>
                  <span className="font-medium">{cacheStatus?.descriptionKeys || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium">
                    {cacheStatus?.timestamp ? new Date(cacheStatus.timestamp).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fetchCacheStatus} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache Management</CardTitle>
            <CardDescription>Manage your Redis cache</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You can clean up the cache to remove expired entries and free up space.
              </p>
              <Button
                variant="destructive"
                onClick={cleanupCache}
                disabled={isCleaning || isLoading}
                className="w-full"
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clean Up Cache
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache Statistics</CardTitle>
            <CardDescription>Redis server information</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">Redis server information and statistics.</p>
                <div className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[200px]">
                  <pre>{JSON.stringify(cacheStatus?.stats?.info || {}, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {cacheStatus?.descriptionSamples && Object.keys(cacheStatus.descriptionSamples).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description Samples</CardTitle>
            <CardDescription>Sample of cached product descriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(cacheStatus.descriptionSamples).map(([productId, description]) => (
                <div key={productId} className="border-b pb-4">
                  <h3 className="font-medium mb-2">Product ID: {productId}</h3>
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
