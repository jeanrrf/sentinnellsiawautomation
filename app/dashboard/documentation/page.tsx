import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, FileText, Code, Zap, Clock, Palette } from "lucide-react"

export default function DocumentationPage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-2">Documentação do Sistema</h1>
      <p className="text-muted-foreground mb-6">Guia completo para o sistema de geração de cards para TikTok</p>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduler">Agendamento</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Visão Geral do Sistema
              </CardTitle>
              <CardDescription>Entenda como funciona o sistema de geração de cards para TikTok</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema de geração de cards para TikTok é uma solução completa para criar materiais visuais otimizados
                para marketing de afiliados na plataforma Shopee. O sistema permite gerar cards visualmente atraentes
                com informações de produtos, descrições otimizadas por IA e links de afiliados.
              </p>

              <h3 className="text-lg font-medium mt-4">Principais Recursos</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Geração de Cards:</strong> Crie cards visualmente atraentes com informações de produtos da
                  Shopee, incluindo preço, avaliações, vendas e descrições.
                </li>
                <li>
                  <strong>Múltiplos Formatos:</strong> Gere cards em diferentes formatos (PNG, JPEG) e estilos visuais
                  para atender a diferentes necessidades.
                </li>
                <li>
                  <strong>Descrições com IA:</strong> Utilize a API Gemini para gerar descrições otimizadas para SEO e
                  conversão.
                </li>
                <li>
                  <strong>Templates Personalizáveis:</strong> Crie e personalize templates visuais para seus cards,
                  ajustando cores, fontes, elementos e muito mais.
                </li>
                <li>
                  <strong>Agendamento Automático:</strong> Configure agendamentos para geração automática de cards com
                  base em diferentes critérios de busca.
                </li>
                <li>
                  <strong>API Unificada:</strong> Acesse todas as funcionalidades do sistema através de uma API
                  unificada e bem documentada.
                </li>
              </ul>

              <h3 className="text-lg font-medium mt-4">Fluxo de Trabalho</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Busca de Produtos:</strong> O sistema busca produtos na Shopee com base em critérios como mais
                  vendidos, maiores descontos, melhor avaliados, etc.
                </li>
                <li>
                  <strong>Geração de Descrição:</strong> A API Gemini é utilizada para gerar uma descrição otimizada
                  para o produto, com foco em SEO e conversão.
                </li>
                <li>
                  <strong>Renderização de Cards:</strong> O sistema renderiza cards visuais utilizando a API Canvas,
                  aplicando o template selecionado e incluindo informações do produto e a descrição gerada.
                </li>
                <li>
                  <strong>Download e Compartilhamento:</strong> Os cards gerados podem ser baixados em diferentes
                  formatos (PNG, JPEG) e compartilhados diretamente nas redes sociais.
                </li>
              </ol>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Dica</AlertTitle>
                <AlertDescription>
                  Para obter os melhores resultados, recomendamos utilizar produtos com boas avaliações e um número
                  significativo de vendas. Isso aumenta a credibilidade do seu conteúdo e as chances de conversão.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Geração Rápida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gere cards com apenas um clique utilizando o componente de geração rápida. Ideal para criar conteúdo
                  rapidamente sem configurações complexas.
                </p>
                <div className="mt-4">
                  <Link href="/dashboard/one-click" className="text-primary hover:underline">
                    Acessar Geração Rápida →
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Crie e personalize templates visuais para seus cards, ajustando cores, fontes, elementos e muito mais.
                </p>
                <div className="mt-4">
                  <Link href="/dashboard/templates" className="text-primary hover:underline">
                    Gerenciar Templates →
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure agendamentos para geração automática de cards com base em diferentes critérios de busca e
                  frequências.
                </p>
                <div className="mt-4">
                  <Link href="/dashboard/scheduler" className="text-primary hover:underline">
                    Configurar Agendamentos →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Documentação da API
              </CardTitle>
              <CardDescription>Referência completa da API unificada de geração de cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema oferece uma API unificada para geração de cards, permitindo integração com outras aplicações e
                automação de fluxos de trabalho.
              </p>

              <h3 className="text-lg font-medium mt-4">Endpoints Principais</h3>

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium">POST /api/generate-unified-card</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gera cards para um produto específico com base nas opções fornecidas.
                  </p>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Parâmetros:</h5>
                    <pre className="bg-muted p-2 rounded-md text-xs mt-1 overflow-x-auto">
                      {`{
  "productId": "string", // ID do produto (obrigatório)
  "options": {
    "useAI": boolean, // Usar IA para gerar descrição (padrão: true)
    "customDescription": "string", // Descrição personalizada (opcional)
    "template1": "string", // Template principal (padrão: "modern")
    "template2": "string", // Template secundário (padrão: "bold")
    "includeSecondVariation": boolean // Incluir segunda variação (padrão: true)
  }
}`}
                    </pre>
                  </div>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Resposta:</h5>
                    <pre className="bg-muted p-2 rounded-md text-xs mt-1 overflow-x-auto">
                      {`{
  "success": boolean,
  "product": object, // Dados do produto
  "description": "string", // Descrição gerada
  "downloadUrls": {
    "png": "string", // URL para download do PNG (template1)
    "jpeg": "string", // URL para download do JPEG (template1)
    "png2": "string", // URL para download do PNG (template2)
    "jpeg2": "string", // URL para download do JPEG (template2)
    "all": "string", // URL para download de todos os arquivos (ZIP)
    "text": "string" // URL para download da descrição (TXT)
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">GET /api/download-card/:id</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Baixa um card para um produto específico no formato e template especificados.
                  </p>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Parâmetros de URL:</h5>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>
                        <code>id</code>: ID do produto
                      </li>
                    </ul>
                  </div>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Parâmetros de Query:</h5>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>
                        <code>format</code>: Formato do card (png, jpeg)
                      </li>
                      <li>
                        <code>template</code>: Template a ser utilizado (modern, bold, minimal, ageminipara, portrait)
                      </li>
                    </ul>
                  </div>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Resposta:</h5>
                    <p className="text-sm mt-1">Arquivo de imagem no formato especificado.</p>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">GET /api/download-card-package/:id</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Baixa um pacote ZIP contendo todos os cards e a descrição para um produto específico.
                  </p>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Parâmetros de URL:</h5>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>
                        <code>id</code>: ID do produto
                      </li>
                    </ul>
                  </div>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Resposta:</h5>
                    <p className="text-sm mt-1">
                      Arquivo ZIP contendo cards em PNG e JPEG, além de um arquivo de texto com a descrição.
                    </p>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">GET /api/download-description/:id</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Baixa a descrição gerada para um produto específico.
                  </p>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Parâmetros de URL:</h5>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>
                        <code>id</code>: ID do produto
                      </li>
                    </ul>
                  </div>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Resposta:</h5>
                    <p className="text-sm mt-1">Arquivo de texto contendo a descrição gerada.</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Exemplos de Uso</h3>

              <div className="border rounded-md p-4">
                <h4 className="font-medium">Exemplo de Requisição</h4>
                <pre className="bg-muted p-2 rounded-md text-xs mt-2 overflow-x-auto">
                  {`// Gerar cards para um produto específico
fetch('/api/generate-unified-card', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: '12345678',
    options: {
      useAI: true,
      template1: 'modern',
      template2: 'bold',
      includeSecondVariation: true
    }
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    // Baixar o pacote completo
    window.location.href = data.downloadUrls.all;
  }
})
.catch(error => console.error('Erro:', error));`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Sistema de Templates
              </CardTitle>
              <CardDescription>Entenda como funciona o sistema de templates para geração de cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema de templates permite personalizar a aparência visual dos cards gerados, ajustando cores,
                fontes, elementos e muito mais. Os templates são salvos localmente e podem ser reutilizados em
                diferentes gerações de cards.
              </p>

              <h3 className="text-lg font-medium mt-4">Tipos de Templates</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium">Moderno</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Design moderno com foco na imagem do produto. Ideal para destacar produtos visualmente atraentes.
                  </p>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">Negrito</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Design com elementos visuais fortes e cores contrastantes. Perfeito para chamar atenção em feeds
                    movimentados.
                  </p>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">Minimalista</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Design limpo e minimalista com foco no produto. Ideal para produtos premium e sofisticados.
                  </p>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">Retrato</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Design vertical otimizado para TikTok e Instagram Stories. Maximiza o espaço vertical disponível.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Personalizações Disponíveis</h3>

              <div className="space-y-2 mt-2">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Cores</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Personalize as cores primária, secundária e de texto do template.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Fontes</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolha entre diferentes famílias de fontes para o texto do card.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Elementos</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Controle quais elementos são exibidos no card: avaliação, vendas, desconto, preço, preço original,
                    nome da loja, botão CTA.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Efeitos</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione efeitos visuais como gradientes, opacidade da imagem e marca d'água.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Conteúdo</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Controle o número de linhas de descrição e o texto do botão CTA.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/dashboard/templates" className="text-primary hover:underline">
                  Acessar o Gerenciador de Templates →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Sistema de Agendamento
              </CardTitle>
              <CardDescription>
                Entenda como funciona o sistema de agendamento para geração automática de cards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema de agendamento permite configurar a geração automática de cards com base em diferentes
                critérios de busca e frequências. Os agendamentos são executados automaticamente nos horários definidos,
                gerando cards para os produtos encontrados.
              </p>

              <h3 className="text-lg font-medium mt-4">Frequências Disponíveis</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium">Diariamente</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Executa o agendamento todos os dias no horário especificado.
                  </p>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">Semanalmente</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Executa o agendamento nos dias da semana selecionados, no horário especificado.
                  </p>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium">Mensalmente</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Executa o agendamento no dia do mês selecionado, no horário especificado.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Tipos de Busca</h3>

              <div className="space-y-2 mt-2">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Mais Vendidos</h4>
                  <p className="text-sm text-muted-foreground mt-1">Busca produtos com maior volume de vendas.</p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Maiores Descontos</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Busca produtos com os maiores percentuais de desconto.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Melhor Avaliados</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Busca produtos com as melhores avaliações dos clientes.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Melhor Custo-Benefício</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Busca produtos com melhor relação qualidade/preço.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Em Alta</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Busca produtos que estão em tendência de crescimento.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Opções Adicionais</h3>

              <div className="space-y-2 mt-2">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Gerar Descrição com IA</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Utiliza a API Gemini para gerar descrições otimizadas para os produtos.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Incluir Segunda Variação</h4>
                  <p className="text-sm text-muted-foreground mt-1">Gera uma segunda variação visual para cada card.</p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Salvar na Galeria</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Salva os cards gerados na galeria do sistema para acesso posterior.
                  </p>
                </div>

                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Notificar por E-mail</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Envia uma notificação por e-mail quando o agendamento é executado.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/dashboard/scheduler" className="text-primary hover:underline">
                  Acessar o Agendador de Geração Automática →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Exemplos de Uso
              </CardTitle>
              <CardDescription>Exemplos práticos de como utilizar o sistema de geração de cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-medium">Exemplo 1: Geração Rápida</h3>
              <p>Neste exemplo, vamos gerar cards para um produto utilizando o componente de geração rápida.</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Acesse a página de{" "}
                  <Link href="/dashboard/one-click" className="text-primary hover:underline">
                    Geração Rápida
                  </Link>
                  .
                </li>
                <li>Clique no botão "Gerar e Baixar Cards".</li>
                <li>
                  O sistema irá selecionar automaticamente um produto popular e gerar cards em diferentes formatos.
                </li>
                <li>Os cards gerados serão baixados automaticamente em um arquivo ZIP.</li>
              </ol>

              <h3 className="text-lg font-medium mt-6">Exemplo 2: Busca Avançada</h3>
              <p>Neste exemplo, vamos buscar produtos com base em critérios específicos e gerar cards para eles.</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Acesse a página de{" "}
                  <Link href="/dashboard/busca" className="text-primary hover:underline">
                    Busca Avançada
                  </Link>
                  .
                </li>
                <li>Selecione o tipo de busca "Maiores Descontos".</li>
                <li>Defina o limite de resultados para 5.</li>
                <li>Para cada produto encontrado, clique no botão "Gerar Material".</li>
                <li>Após a geração, clique em "Baixar Tudo" para baixar os cards e a descrição.</li>
              </ol>

              <h3 className="text-lg font-medium mt-6">Exemplo 3: Criação de Template Personalizado</h3>
              <p>Neste exemplo, vamos criar um template personalizado para geração de cards.</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Acesse a página de{" "}
                  <Link href="/dashboard/templates" className="text-primary hover:underline">
                    Gerenciador de Templates
                  </Link>
                  .
                </li>
                <li>Clique no botão "Novo" para criar um novo template.</li>
                <li>Defina um nome para o template, por exemplo, "Meu Template Personalizado".</li>
                <li>Na aba "Design", personalize as cores, fontes e efeitos do template.</li>
                <li>Na aba "Conteúdo", defina quais elementos serão exibidos no card.</li>
                <li>Clique em "Visualizar" para ver como o template ficará.</li>
                <li>Clique em "Salvar Template" para salvar o template.</li>
              </ol>

              <h3 className="text-lg font-medium mt-6">Exemplo 4: Configuração de Agendamento</h3>
              <p>Neste exemplo, vamos configurar um agendamento para geração automática de cards.</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Acesse a página de{" "}
                  <Link href="/dashboard/scheduler" className="text-primary hover:underline">
                    Agendador de Geração Automática
                  </Link>
                  .
                </li>
                <li>Clique no botão "Novo" para criar um novo agendamento.</li>
                <li>Defina um nome para o agendamento, por exemplo, "Geração Diária de Cards".</li>
                <li>Na aba "Básico", selecione o tipo de busca "Mais Vendidos" e o limite de produtos.</li>
                <li>Na aba "Agendamento", defina a frequência como "Diariamente" e o horário como "09:00".</li>
                <li>Na aba "Opções", ative as opções desejadas, como geração de descrição com IA.</li>
                <li>Clique em "Salvar Agendamento" para salvar o agendamento.</li>
              </ol>

              <h3 className="text-lg font-medium mt-6">Exemplo 5: Uso da API</h3>
              <p>Neste exemplo, vamos utilizar a API para gerar cards programaticamente.</p>
              <pre className="bg-muted p-4 rounded-md text-xs mt-2 overflow-x-auto">
                {`// Exemplo de código para gerar cards via API
async function generateCards(productId) {
  try {
    const response = await fetch('/api/generate-unified-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        options: {
          useAI: true,
          template1: 'modern',
          template2: 'bold',
          includeSecondVariation: true
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Cards gerados com sucesso!');
      console.log('Descrição:', data.description);
      console.log('URLs de download:', data.downloadUrls);
      
      // Baixar o pacote completo
      window.location.href = data.downloadUrls.all;
    } else {
      console.error('Erro ao gerar cards:', data.message);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

// Chamar a função com o ID do produto
generateCards('12345678');`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
