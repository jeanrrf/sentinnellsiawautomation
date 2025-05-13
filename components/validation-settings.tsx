"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { ValidationProvider } from "@/components/validation-provider"
import { ValidatedInput } from "@/components/ui/validated-input"
import { ValidationSummary } from "@/components/validation-summary"
import { ValidationRulesManager } from "@/components/validation-rules-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { validationSchemas } from "@/lib/validation"
import { z } from "zod"

export function ValidationSettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [formData, setFormData] = useState({
    general: {
      siteName: "TikTok Video Generator",
      siteDescription: "Gerador automático de vídeos para TikTok",
      contactEmail: "contato@example.com",
    },
    api: {
      apiKey: "sk_test_123456789",
      apiUrl: "https://api.example.com/v1",
      timeout: "5000",
      retryAttempts: "3",
    },
    shopee: {
      shopeeAppId: process.env.SHOPEE_APP_ID || "",
      shopeeAppSecret: process.env.SHOPEE_APP_SECRET || "",
      shopeeRedirectUrl: process.env.SHOPEE_REDIRECT_URL || "",
    },
    video: {
      defaultDuration: "10",
      maxDuration: "60",
      defaultFormat: "mp4",
      quality: "high",
    },
    cache: {
      cacheEnabled: true,
      cacheTTL: "3600",
      maxCacheSize: "100",
    },
  })

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  const validateSection = (section: keyof typeof validationSchemas) => {
    try {
      validationSchemas[section].parse(formData[section])
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors)
      }
      return false
    }
  }

  const handleSave = () => {
    const isValid = validateSection(activeTab as keyof typeof validationSchemas)

    if (isValid) {
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Corrija os erros de validação antes de salvar.",
      })
    }
  }

  return (
    <ValidationProvider>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="shopee">Shopee</TabsTrigger>
            <TabsTrigger value="video">Vídeo</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="md:col-span-2 space-y-6">
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>Configure as informações básicas do sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ValidatedInput
                      id="siteName"
                      label="Nome do Site"
                      rules={["requiredField", "minLength"]}
                      value={formData.general.siteName}
                      onChange={(e) => handleInputChange("general", "siteName", e.target.value)}
                      description="Nome que será exibido no cabeçalho do site"
                    />
                    <ValidatedInput
                      id="siteDescription"
                      label="Descrição do Site"
                      rules={["maxLength"]}
                      value={formData.general.siteDescription}
                      onChange={(e) => handleInputChange("general", "siteDescription", e.target.value)}
                      description="Breve descrição do propósito do site"
                    />
                    <ValidatedInput
                      id="contactEmail"
                      label="E-mail de Contato"
                      rules={["requiredField", "emailFormat"]}
                      value={formData.general.contactEmail}
                      onChange={(e) => handleInputChange("general", "contactEmail", e.target.value)}
                      description="E-mail para contato e notificações do sistema"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de API</CardTitle>
                    <CardDescription>Configure as integrações com APIs externas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ValidatedInput
                      id="apiKey"
                      label="Chave de API"
                      rules={["requiredField"]}
                      value={formData.api.apiKey}
                      onChange={(e) => handleInputChange("api", "apiKey", e.target.value)}
                      description="Chave de autenticação para APIs externas"
                    />
                    <ValidatedInput
                      id="apiUrl"
                      label="URL da API"
                      rules={["requiredField", "urlFormat"]}
                      value={formData.api.apiUrl}
                      onChange={(e) => handleInputChange("api", "apiUrl", e.target.value)}
                      description="Endereço base da API externa"
                    />
                    <ValidatedInput
                      id="timeout"
                      label="Timeout (ms)"
                      rules={["numericValue", "positiveNumber"]}
                      value={formData.api.timeout}
                      onChange={(e) => handleInputChange("api", "timeout", e.target.value)}
                      description="Tempo máximo de espera para respostas da API"
                    />
                    <ValidatedInput
                      id="retryAttempts"
                      label="Tentativas de Retry"
                      rules={["numericValue", "integerValue"]}
                      value={formData.api.retryAttempts}
                      onChange={(e) => handleInputChange("api", "retryAttempts", e.target.value)}
                      description="Número de tentativas em caso de falha"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="shopee">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações da Shopee</CardTitle>
                    <CardDescription>Configure a integração com a API da Shopee</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ValidatedInput
                      id="shopeeAppId"
                      label="App ID da Shopee"
                      rules={["requiredField"]}
                      value={formData.shopee.shopeeAppId}
                      onChange={(e) => handleInputChange("shopee", "shopeeAppId", e.target.value)}
                      description="ID da aplicação registrada na Shopee"
                    />
                    <ValidatedInput
                      id="shopeeAppSecret"
                      label="App Secret da Shopee"
                      rules={["requiredField"]}
                      value={formData.shopee.shopeeAppSecret}
                      onChange={(e) => handleInputChange("shopee", "shopeeAppSecret", e.target.value)}
                      type="password"
                      description="Chave secreta da aplicação registrada na Shopee"
                    />
                    <ValidatedInput
                      id="shopeeRedirectUrl"
                      label="URL de Redirecionamento"
                      rules={["requiredField", "urlFormat"]}
                      value={formData.shopee.shopeeRedirectUrl}
                      onChange={(e) => handleInputChange("shopee", "shopeeRedirectUrl", e.target.value)}
                      description="URL de callback para autenticação OAuth"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="video">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Vídeo</CardTitle>
                    <CardDescription>Configure os parâmetros de geração de vídeos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ValidatedInput
                      id="defaultDuration"
                      label="Duração Padrão (segundos)"
                      rules={["numericValue", "positiveNumber"]}
                      value={formData.video.defaultDuration}
                      onChange={(e) => handleInputChange("video", "defaultDuration", e.target.value)}
                      description="Duração padrão dos vídeos gerados"
                    />
                    <ValidatedInput
                      id="maxDuration"
                      label="Duração Máxima (segundos)"
                      rules={["numericValue", "positiveNumber"]}
                      value={formData.video.maxDuration}
                      onChange={(e) => handleInputChange("video", "maxDuration", e.target.value)}
                      description="Duração máxima permitida para vídeos"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="defaultFormat">Formato Padrão</Label>
                      <select
                        id="defaultFormat"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.video.defaultFormat}
                        onChange={(e) => handleInputChange("video", "defaultFormat", e.target.value)}
                      >
                        <option value="mp4">MP4</option>
                        <option value="webm">WebM</option>
                      </select>
                      <p className="text-sm text-muted-foreground">Formato padrão para os vídeos gerados</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quality">Qualidade</Label>
                      <select
                        id="quality"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.video.quality}
                        onChange={(e) => handleInputChange("video", "quality", e.target.value)}
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                      <p className="text-sm text-muted-foreground">Qualidade dos vídeos gerados</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="cache">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Cache</CardTitle>
                    <CardDescription>Configure o comportamento do sistema de cache</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cacheEnabled"
                        checked={formData.cache.cacheEnabled}
                        onChange={(e) => handleInputChange("cache", "cacheEnabled", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="cacheEnabled">Habilitar Cache</Label>
                    </div>
                    <ValidatedInput
                      id="cacheTTL"
                      label="TTL do Cache (segundos)"
                      rules={["numericValue", "positiveNumber"]}
                      value={formData.cache.cacheTTL}
                      onChange={(e) => handleInputChange("cache", "cacheTTL", e.target.value)}
                      description="Tempo de vida das entradas no cache"
                      disabled={!formData.cache.cacheEnabled}
                    />
                    <ValidatedInput
                      id="maxCacheSize"
                      label="Tamanho Máximo do Cache (MB)"
                      rules={["numericValue", "positiveNumber"]}
                      value={formData.cache.maxCacheSize}
                      onChange={(e) => handleInputChange("cache", "maxCacheSize", e.target.value)}
                      description="Tamanho máximo do cache em megabytes"
                      disabled={!formData.cache.cacheEnabled}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </div>

            <div className="space-y-6">
              <ValidationSummary />
              <ValidationRulesManager />
            </div>
          </div>
        </Tabs>
      </div>
    </ValidationProvider>
  )
}
