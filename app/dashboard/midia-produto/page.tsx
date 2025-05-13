import { ProductMediaGallery } from "@/components/product-media-gallery"
import { DashboardWithNav } from "@/components/dashboard-with-nav"

export default function ProductMediaPage() {
  return (
    <DashboardWithNav title="Mídia do Produto" description="Acesse imagens e vídeos dos produtos da Shopee">
      <ProductMediaGallery />
    </DashboardWithNav>
  )
}
