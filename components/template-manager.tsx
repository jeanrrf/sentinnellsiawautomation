"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Trash, Plus, Copy, RefreshCw, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Tipos de templates disponíveis
const TEMPLATE_TYPES = [
  { id: "modern", name: "Moderno", description: "Design moderno com foco na imagem do produto" },
  { id: "bold", name: "Negrito", description: "Design com elementos visuais fortes e cores contrastantes" },
  { id: "minimal", name: "Minimalista", description: "Design limpo e minimalista com foco no produto" },
  { id: "portrait", name: "Retrato", description: "Design vertical otimizado para TikTok e Instagram Stories" },
  { id: "ageminipara", name: "Agemini", description: "Design especial com estilo Agemini" },
]

// Template padrão
const DEFAULT_TEMPLATE = {
  id: "",
  name: "",
  type: "modern",
  primaryColor: "#FF4D4F",
  secondaryColor: "#000000",
  textColor: "#FFFFFF",
  fontFamily: "Inter",
  showRating: true,
  showSales: true,
  showDiscount: true,
  showPrice: true,
  showOriginalPrice: true,
  showShopName: false,
  showCTA: true,
  ctaText: "COMPRE AGORA • LINK NA BIO",
  descriptionLines: 5,
  imageOpacity: 100,
  addGradient: true,
  addWatermark: false,
  watermarkText: "",
}

export function TemplateManager() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<any[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<any>(DEFAULT_TEMPLATE)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("design")
  const [showPreview, setShowPreview] = useState(false)

  // Carregar templates salvos
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true)
      try {
        // Simular carregamento de templates do localStorage
        const savedTemplates = localStorage.getItem("cardTemplates")
        if (savedTemplates) {
          setTemplates(JSON.parse(savedTemplates))
        } else {
          // Templates padrão
          const defaultTemplates = [
            {
              id: "default-modern",
              name: "Moderno Padrão",
              type: "modern",
              primaryColor: "#FF4D4F",
              secondaryColor: "#000000",
              textColor: "#FFFFFF",
              fontFamily: "Inter",
              showRating: true,
              showSales: true,
              showDiscount: true,
              showPrice: true,
              showOriginalPrice: true,
              showShopName: false,
              showCTA: true,
              ctaText: "COMPRE AGORA • LINK NA BIO",
              descriptionLines: 5,
              imageOpacity: 100,
              addGradient: true,
              addWatermark: false,
              watermarkText: "",
            },
            {
              id: "default-bold",
              name: "Negrito Padrão",
              type: "bold",
              primaryColor: "#0D0D2B",
              secondaryColor: "#FF4D4F",
              textColor: "#FFFFFF",
              fontFamily: "Montserrat",
              showRating: true,
              showSales: true,
              showDiscount: true,
              showPrice: true,
              showOriginalPrice: true,
              showShopName: true,
              showCTA: true,
              ctaText: "TOQUE PARA COMPRAR",
              descriptionLines: 4,
              imageOpacity: 90,
              addGradient: true,
              addWatermark: false,
              watermarkText: "",
            },
          ]
          setTemplates(defaultTemplates)
          localStorage.setItem("cardTemplates", JSON.stringify(defaultTemplates))
        }

        // Carregar um produto de exemplo para preview
        await loadSampleProduct()
      } catch (error) {
        console.error("Error loading templates:", error)
        toast({
          variant: "destructive",
          title: "Erro ao carregar templates",
          description: "Não foi possível carregar os templates salvos.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [toast])

  // Carregar um produto de exemplo para preview
  const loadSampleProduct = async () => {
    try {
      setPreviewLoading(true)
      const response = await fetch("/api/sample-data")

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.products && data.products.length > 0) {
        setPreviewProduct(data.products[0])
      } else {
        // Produto de exemplo fallback
        setPreviewProduct({
          itemId: "sample-123",
          productName: "Produto de Exemplo para Preview",
          price: "99.90",
          calculatedOriginalPrice: "199.90",
          priceDiscountRate: "50",
          sales: "1234",
          ratingStar: "4.8",
          shopName: "Loja Exemplo",
          imageUrl: "https://via.placeholder.com/500",
          offerLink: "https://example.com",
        })
      }
    } catch (error) {
      console.error("Error loading sample product:", error)
      // Produto de exemplo fallback
      setPreviewProduct({
        itemId: "sample-123",
        productName: "Produto de Exemplo para Preview",
        price: "99.90",
        calculatedOriginalPrice: "199.90",
        priceDiscountRate: "50",
        sales: "1234",
        ratingStar: "4.8",
        shopName: "Loja Exemplo",
        imageUrl: "https://via.placeholder.com/500",
        offerLink: "https://example.com",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  // Selecionar um template para edição
  const selectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setCurrentTemplate({ ...template })
    }
  }

  // Criar um novo template
  const createNewTemplate = () => {
    const newTemplate = {
      ...DEFAULT_TEMPLATE,
      id: `template-${Date.now()}`,
      name: `Novo Template ${templates.length + 1}`,
    }
    setCurrentTemplate(newTemplate)
  }

  // Salvar template atual
  const saveCurrentTemplate = () => {
    if (!currentTemplate.name) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o template.",
      })
      return
    }

    setIsSaving(true)

    try {
      // Verificar se é um novo template ou atualização
      const existingIndex = templates.findIndex((t) => t.id === currentTemplate.id)
      let updatedTemplates

      if (existingIndex >= 0) {
        // Atualizar template existente
        updatedTemplates = [...templates]
        updatedTemplates[existingIndex] = { ...currentTemplate }
      } else {
        // Adicionar novo template
        updatedTemplates = [...templates, { ...currentTemplate }]
      }

      setTemplates(updatedTemplates)
      localStorage.setItem("cardTemplates", JSON.stringify(updatedTemplates))

      toast({
        title: "Template salvo",
        description: "O template foi salvo com sucesso.",
      })
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o template.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Duplicar um template
  const duplicateTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      const duplicatedTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Cópia)`,
      }

      const updatedTemplates = [...templates, duplicatedTemplate]
      setTemplates(updatedTemplates)
      localStorage.setItem("cardTemplates", JSON.stringify(updatedTemplates))
      setCurrentTemplate(duplicatedTemplate)

      toast({
        title: "Template duplicado",
        description: "O template foi duplicado com sucesso.",
      })
    }
  }

  // Excluir um template
  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId)
    setTemplates(updatedTemplates)
    localStorage.setItem("cardTemplates", JSON.stringify(updatedTemplates))

    // Se o template atual foi excluído, selecionar outro
    if (currentTemplate.id === templateId) {
      if (updatedTemplates.length > 0) {
        setCurrentTemplate({ ...updatedTemplates[0] })
      } else {
        setCurrentTemplate({ ...DEFAULT_TEMPLATE })
      }
    }

    toast({
      title: "Template excluído",
      description: "O template foi excluído com sucesso.",
    })
  }

  // Atualizar um campo do template atual
  const updateTemplateField = (field: string, value: any) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Gerar preview do template
  const generatePreview = () => {
    if (!previewProduct) {
      toast({
        variant: "destructive",
        title: "Produto não disponível",
        description: "Não foi possível carregar um produto para preview.",
      })
      return
    }

    setShowPreview(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciador de Templates</CardTitle>
          <CardDescription>Crie e personalize templates para geração de cards de produtos</CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Templates Salvos</h3>
                  <Button variant="outline" size="sm" onClick={createNewTemplate}>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                </div>

                {templates.length === 0 ? (
                  <Alert>
                    <AlertTitle>Nenhum template encontrado</AlertTitle>
                    <AlertDescription>Clique em "Novo" para criar seu primeiro template.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors ${
                          currentTemplate.id === template.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => selectTemplate(template.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {TEMPLATE_TYPES.find((t) => t.id === template.type)?.name || template.type}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateTemplate(template.id)
                              }}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Duplicar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteTemplate(template.id)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: template.primaryColor }} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={loadSampleProduct} disabled={previewLoading}>
                    {previewLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar Produto de Preview
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Nome do Template</Label>
                        <Input
                          id="template-name"
                          value={currentTemplate.name}
                          onChange={(e) => updateTemplateField("name", e.target.value)}
                          placeholder="Nome do template"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-type">Tipo de Template</Label>
                        <Select
                          value={currentTemplate.type}
                          onValueChange={(value) => updateTemplateField("type", value)}
                        >
                          <SelectTrigger id="template-type">
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-description">Descrição</Label>
                      <Input
                        id="template-description"
                        value={currentTemplate.description || ""}
                        onChange={(e) => updateTemplateField("description", e.target.value)}
                        placeholder="Descrição do template (opcional)"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="design" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Cor Primária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={currentTemplate.primaryColor}
                            onChange={(e) => updateTemplateField("primaryColor", e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={currentTemplate.primaryColor}
                            onChange={(e) => updateTemplateField("primaryColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary-color">Cor Secundária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={currentTemplate.secondaryColor}
                            onChange={(e) => updateTemplateField("secondaryColor", e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={currentTemplate.secondaryColor}
                            onChange={(e) => updateTemplateField("secondaryColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="text-color">Cor do Texto</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text-color"
                            type="color"
                            value={currentTemplate.textColor}
                            onChange={(e) => updateTemplateField("textColor", e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={currentTemplate.textColor}
                            onChange={(e) => updateTemplateField("textColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font-family">Fonte</Label>
                        <Select
                          value={currentTemplate.fontFamily}
                          onValueChange={(value) => updateTemplateField("fontFamily", value)}
                        >
                          <SelectTrigger id="font-family">
                            <SelectValue placeholder="Selecione uma fonte" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image-opacity">Opacidade da Imagem ({currentTemplate.imageOpacity}%)</Label>
                      <Slider
                        id="image-opacity"
                        min={50}
                        max={100}
                        step={5}
                        value={[currentTemplate.imageOpacity]}
                        onValueChange={(value) => updateTemplateField("imageOpacity", value[0])}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="add-gradient"
                          checked={currentTemplate.addGradient}
                          onCheckedChange={(checked) => updateTemplateField("addGradient", checked)}
                        />
                        <Label htmlFor="add-gradient">Adicionar Gradiente</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="add-watermark"
                          checked={currentTemplate.addWatermark}
                          onCheckedChange={(checked) => updateTemplateField("addWatermark", checked)}
                        />
                        <Label htmlFor="add-watermark">Adicionar Marca d'água</Label>
                      </div>
                    </div>

                    {currentTemplate.addWatermark && (
                      <div className="space-y-2">
                        <Label htmlFor="watermark-text">Texto da Marca d'água</Label>
                        <Input
                          id="watermark-text"
                          value={currentTemplate.watermarkText}
                          onChange={(e) => updateTemplateField("watermarkText", e.target.value)}
                          placeholder="@seu_perfil"
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-rating"
                          checked={currentTemplate.showRating}
                          onCheckedChange={(checked) => updateTemplateField("showRating", checked)}
                        />
                        <Label htmlFor="show-rating">Mostrar Avaliação</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-sales"
                          checked={currentTemplate.showSales}
                          onCheckedChange={(checked) => updateTemplateField("showSales", checked)}
                        />
                        <Label htmlFor="show-sales">Mostrar Vendas</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-discount"
                          checked={currentTemplate.showDiscount}
                          onCheckedChange={(checked) => updateTemplateField("showDiscount", checked)}
                        />
                        <Label htmlFor="show-discount">Mostrar Desconto</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-price"
                          checked={currentTemplate.showPrice}
                          onCheckedChange={(checked) => updateTemplateField("showPrice", checked)}
                        />
                        <Label htmlFor="show-price">Mostrar Preço</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-original-price"
                          checked={currentTemplate.showOriginalPrice}
                          onCheckedChange={(checked) => updateTemplateField("showOriginalPrice", checked)}
                        />
                        <Label htmlFor="show-original-price">Mostrar Preço Original</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-shop-name"
                          checked={currentTemplate.showShopName}
                          onCheckedChange={(checked) => updateTemplateField("showShopName", checked)}
                        />
                        <Label htmlFor="show-shop-name">Mostrar Nome da Loja</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-cta"
                          checked={currentTemplate.showCTA}
                          onCheckedChange={(checked) => updateTemplateField("showCTA", checked)}
                        />
                        <Label htmlFor="show-cta">Mostrar Botão CTA</Label>
                      </div>

                      {currentTemplate.showCTA && (
                        <Input
                          id="cta-text"
                          value={currentTemplate.ctaText}
                          onChange={(e) => updateTemplateField("ctaText", e.target.value)}
                          placeholder="Texto do botão CTA"
                          className="mt-2"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description-lines">
                        Linhas de Descrição ({currentTemplate.descriptionLines})
                      </Label>
                      <Slider
                        id="description-lines"
                        min={0}
                        max={10}
                        step={1}
                        value={[currentTemplate.descriptionLines]}
                        onValueChange={(value) => updateTemplateField("descriptionLines", value[0])}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={generatePreview}
            disabled={isLoading || !currentTemplate.id || !previewProduct}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>

          <Button onClick={saveCurrentTemplate} disabled={isLoading || isSaving || !currentTemplate.name}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Template
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              Visualização do template {currentTemplate.name} com o produto de exemplo
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center p-4 bg-gray-100 rounded-md">
            <div className="relative w-[300px] h-[533px] bg-black rounded-md overflow-hidden">
              {/* Simulação simplificada do card */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${previewProduct?.imageUrl || "https://via.placeholder.com/500"})`,
                  opacity: currentTemplate.imageOpacity / 100,
                }}
              />

              {currentTemplate.addGradient && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/2"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${currentTemplate.secondaryColor})`,
                  }}
                />
              )}

              <div className="absolute inset-0 flex flex-col justify-end p-4">
                {currentTemplate.showDiscount && previewProduct?.priceDiscountRate > 0 && (
                  <div
                    className="absolute top-4 right-4 px-2 py-1 rounded-md text-sm font-bold"
                    style={{ backgroundColor: currentTemplate.primaryColor, color: currentTemplate.textColor }}
                  >
                    {previewProduct?.priceDiscountRate}% OFF
                  </div>
                )}

                <h2
                  className="text-xl font-bold mb-2 line-clamp-2"
                  style={{ color: currentTemplate.textColor, fontFamily: currentTemplate.fontFamily }}
                >
                  {previewProduct?.productName || "Nome do Produto"}
                </h2>

                {currentTemplate.showPrice && (
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: currentTemplate.primaryColor, fontFamily: currentTemplate.fontFamily }}
                    >
                      R$ {Number(previewProduct?.price || 0).toFixed(2)}
                    </span>

                    {currentTemplate.showOriginalPrice && previewProduct?.calculatedOriginalPrice && (
                      <span
                        className="text-sm line-through"
                        style={{ color: `${currentTemplate.textColor}80`, fontFamily: currentTemplate.fontFamily }}
                      >
                        R$ {previewProduct?.calculatedOriginalPrice}
                      </span>
                    )}
                  </div>
                )}

                {(currentTemplate.showRating || currentTemplate.showSales) && (
                  <div
                    className="flex items-center gap-2 mb-3 text-sm"
                    style={{ color: currentTemplate.textColor, fontFamily: currentTemplate.fontFamily }}
                  >
                    {currentTemplate.showRating && <span>⭐ {previewProduct?.ratingStar || "4.5"}</span>}

                    {currentTemplate.showRating && currentTemplate.showSales && <span>•</span>}

                    {currentTemplate.showSales && <span>{previewProduct?.sales || "1000"}+ vendas</span>}
                  </div>
                )}

                {currentTemplate.showShopName && (
                  <div
                    className="mb-3 text-sm"
                    style={{ color: `${currentTemplate.textColor}CC`, fontFamily: currentTemplate.fontFamily }}
                  >
                    Loja: {previewProduct?.shopName || "Loja Exemplo"}
                  </div>
                )}

                {currentTemplate.descriptionLines > 0 && (
                  <div
                    className="mb-4 text-sm line-clamp-3"
                    style={{ color: currentTemplate.textColor, fontFamily: currentTemplate.fontFamily }}
                  >
                    Descrição do produto gerada pela API Gemini. Este é um exemplo de como a descrição aparecerá no card
                    final.
                  </div>
                )}

                {currentTemplate.showCTA && (
                  <div
                    className="py-2 px-4 rounded-md text-center text-sm font-bold"
                    style={{
                      backgroundColor: currentTemplate.primaryColor,
                      color: currentTemplate.textColor,
                      fontFamily: currentTemplate.fontFamily,
                    }}
                  >
                    {currentTemplate.ctaText || "COMPRE AGORA"}
                  </div>
                )}

                {currentTemplate.addWatermark && currentTemplate.watermarkText && (
                  <div
                    className="absolute bottom-2 right-2 text-xs opacity-70"
                    style={{ color: currentTemplate.textColor, fontFamily: currentTemplate.fontFamily }}
                  >
                    {currentTemplate.watermarkText}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
