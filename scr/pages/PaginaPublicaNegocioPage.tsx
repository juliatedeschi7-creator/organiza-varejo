import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  MapPin,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProdutoDetalhePage from './ProdutoDetalhePage'

interface PaginaPublicaNegocioPageProps {
  slug?: string
  empresaId?: string
  onVoltar?: () => void
}

interface Empresa {
  id: string
  nome_fantasia: string | null
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  cidade: string | null
  estado: string | null
  descricao_publica: string | null
}

interface Filial {
  id: string
  empresa_id: string
  nome: string | null
  codigo: string | null
  telefone: string | null
  whatsapp: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  latitude: number | null
  longitude: number | null
  ativa: boolean
}

interface Vitrine {
  id: string
  empresa_id: string
  filial_id: string | null
  nome_exibicao: string | null
  descricao: string | null
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  cor_principal: string | null
  cor_secundaria: string | null
  cor_destaque: string | null
  mensagem_boas_vindas: string | null
  mensagem_fechado: string | null
  mostrar_precos: boolean
  permitir_pedidos: boolean
  permitir_favoritos: boolean
  permitir_compartilhamento: boolean
  ativo: boolean
  fuso_horario: string
}

interface VitrineAparencia {
  vitrine_id: string
  fonte: string | null
  estilo_botoes: string | null
  estilo_cards: string | null
  raio_bordas: number | null
  mostrar_logo: boolean
  mostrar_nome_loja: boolean
  layout_inicio: string | null
  tema: string | null
}

interface VitrineSecao {
  id: string
  vitrine_id: string
  tipo: string
  titulo: string | null
  ordem: number
  visivel: boolean
  configuracoes: Record<string, unknown> | null
}

interface Categoria {
  categoria_id: string
  empresa_id: string
  categoria_pai_id: string | null
  nome: string
  slug: string
  descricao: string | null
  imagem_url: string | null
  ordem: number
}

interface Produto {
  id: string
  empresa_id: string
  categoria_id: string | null
  marca_id: string | null
  nome: string
  slug: string
  descricao: string | null
  descricao_curta: string | null
  termos_busca: string[]
  unidade: string
  vendido_por_peso: boolean
  vendido_por_medida: boolean
  preco: number | null
  preco_promocional: number | null
  destaque_vitrine: boolean
  visivel_vitrine: boolean
  ativo: boolean
  controla_estoque: boolean
  vitrine_produto_id: string
  imagem_principal_url: string | null
}

interface FotoProduto {
  foto_id: string
  produto_id: string
  variacao_id: string | null
  url: string
  ordem: number
  principal: boolean
  alt_text: string | null
}

interface ConfiguracaoExtra {
  tipoNegocio: string
  modelo: string
  modoEdicao: 'modelo' | 'livre'
  corTexto: string
  tamanhoNome: number
  pesoNome: 'normal' | 'negrito'
  alinhamentoNome: 'esquerda' | 'centro'
  fonteCorpo: string
  fonteNome: string
  altoContraste: boolean
  textoAmpliado: boolean
  botoesMaiores: boolean
  reduzirAnimacoes: boolean
}

interface PropsTema {
  principal: string
  secundaria: string
  destaque: string
  fundo: string
  texto: string
  textoSecundario: string
  card: string
}

const aparenciaPadrao: VitrineAparencia = {
  vitrine_id: '',
  fonte: null,
  estilo_botoes: 'arredondado',
  estilo_cards: 'suave',
  raio_bordas: 12,
  mostrar_logo: true,
  mostrar_nome_loja: true,
  layout_inicio: 'catalogo',
  tema: 'claro',
}

const CONFIG_EXTRA_PADRAO: ConfiguracaoExtra = {
  tipoNegocio: 'outros',
  modelo: 'natural',
  modoEdicao: 'modelo',
  corTexto: '#202622',
  tamanhoNome: 24,
  pesoNome: 'negrito',
  alinhamentoNome: 'esquerda',
  fonteNome: 'Georgia, serif',
  fonteCorpo: 'Inter, system-ui, sans-serif',
  altoContraste: false,
  textoAmpliado: false,
  botoesMaiores: false,
  reduzirAnimacoes: false,
}

const SECOES_PADRAO = [
  { id: 'padrao-banner', tipo: 'banner', titulo: 'Apresentação', ordem: 1, visivel: true },
  { id: 'padrao-categorias', tipo: 'categorias', titulo: 'Categorias', ordem: 2, visivel: true },
  { id: 'padrao-destaques', tipo: 'destaques', titulo: 'Destaques', ordem: 3, visivel: true },
  { id: 'padrao-produtos', tipo: 'produtos', titulo: 'Produtos', ordem: 4, visivel: true },
  { id: 'padrao-onde-estamos', tipo: 'onde_estamos', titulo: 'Onde estamos', ordem: 5, visivel: true },
]

export default function PaginaPublicaNegocioPage({
  slug,
  empresaId,
  onVoltar,
}: PaginaPublicaNegocioPageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [vitrine, setVitrine] = useState<Vitrine | null>(null)
  const [aparencia, setAparencia] = useState<VitrineAparencia>(aparenciaPadrao)
  const [secoes, setSecoes] = useState<VitrineSecao[]>([])
  const [extra, setExtra] = useState<ConfiguracaoExtra>(CONFIG_EXTRA_PADRAO)

  const [filiais, setFiliais] = useState<Filial[]>([])
  const [filialSelecionadaId, setFilialSelecionadaId] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fotos, setFotos] = useState<FotoProduto[]>([])
  const [busca, setBusca] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarPagina() {
      let etapa = 'dados públicos do negócio'
      try {
        setCarregando(true)
        setErro('')
        setEmpresa(null)
        setVitrine(null)
        setAparencia(aparenciaPadrao)
        setSecoes([])
        setExtra(CONFIG_EXTRA_PADRAO)
        setFiliais([])
        setCategorias([])
        setProdutos([])
        setFotos([])

        let slugResolvido = typeof slug === 'string' ? slug.trim().toLowerCase() : ''

        if (!slugResolvido && empresaId) {
          const { data, error } = await supabase
            .from('empresas')
            .select('slug')
            .eq('id', empresaId)
            .maybeSingle()
          if (error) throw error
          slugResolvido = String(data?.slug || '').trim().toLowerCase()
        }

        if (!slugResolvido) {
          if (ativo) setErro('Negócio não encontrado.')
          return
        }

        const { data: dados, error: dadosError } = await supabase.rpc(
          'obter_dados_vitrine_publica',
          { p_slug: slugResolvido },
        )
        if (dadosError) throw dadosError
        if (!dados?.empresa || !dados?.vitrine) {
          if (ativo) setErro('Negócio não encontrado ou vitrine indisponível.')
          return
        }

        const empresaData = dados.empresa as Empresa
        const vitrineData = dados.vitrine as Vitrine
        const aparenciaData = dados.aparencia as VitrineAparencia | null
        const filiaisData = (dados.filiais || []) as Filial[]
        const categoriasData = (dados.categorias || []) as Categoria[]

        if (ativo) {
          setEmpresa(empresaData)
          setVitrine(vitrineData)
          setAparencia(aparenciaData || { ...aparenciaPadrao, vitrine_id: vitrineData.id })
          setFiliais(filiaisData)
          setFilialSelecionadaId(filiaisData[0]?.id || null)
          setCategorias(categoriasData)
        }

        etapa = 'seções da vitrine'
        const { data: secoesData, error: secoesError } = await supabase
          .from('vitrine_secoes')
          .select('id, vitrine_id, tipo, titulo, ordem, visivel, configuracoes')
          .eq('vitrine_id', vitrineData.id)
          .order('ordem', { ascending: true })
        if (secoesError) throw secoesError

        const secoesCarregadas = (secoesData || []) as VitrineSecao[]
        const configSalva = secoesCarregadas
          .map((secao) => secao.configuracoes || {})
          .map((config) => config.__organiza_personalizacao)
          .find((config) => config && typeof config === 'object')

        if (ativo) {
          setSecoes(secoesCarregadas)
          setExtra({
            ...CONFIG_EXTRA_PADRAO,
            ...(configSalva as Partial<ConfiguracaoExtra> | undefined),
          })
        }

        etapa = 'produtos da vitrine'
        const { data: resposta, error: produtosError } = await supabase.rpc(
          'vitrine_produtos_publicos',
          { p_slug: vitrineData.slug },
        )
        if (produtosError) throw produtosError

        const resultado = resposta as {
          vitrine: { id: string } | null
          produtos: Array<{
            id: string
            vitrine_produto_id: string
            nome: string
            slug: string
            descricao: string | null
            descricao_curta: string | null
            termos_busca: string[]
            preco: number | null
            preco_promocional: number | null
            unidade: string | null
            vendido_por_peso: boolean
            vendido_por_medida: boolean
            destaque_vitrine: boolean
            categoria: { id: string; nome: string; slug: string } | null
            imagem_principal_url: string | null
            fotos: Array<{
              id: string
              url: string
              ordem: number
              principal: boolean
              alt_text: string | null
            }>
          }>
        }

        if (!resultado?.vitrine) throw new Error('Vitrine pública não encontrada ou indisponível.')

        const produtosPublicos = resultado.produtos ?? []
        const produtosAtivos: Produto[] = produtosPublicos.map((produto) => ({
          id: produto.id,
          empresa_id: empresaData.id,
          categoria_id: produto.categoria?.id ?? null,
          marca_id: null,
          nome: produto.nome,
          slug: produto.slug,
          descricao: produto.descricao,
          descricao_curta: produto.descricao_curta,
          termos_busca: produto.termos_busca ?? [],
          unidade: produto.unidade ?? 'un',
          vendido_por_peso: produto.vendido_por_peso,
          vendido_por_medida: produto.vendido_por_medida,
          preco: produto.preco,
          preco_promocional: produto.preco_promocional,
          destaque_vitrine: produto.destaque_vitrine,
          visivel_vitrine: true,
          ativo: true,
          controla_estoque: false,
          vitrine_produto_id: produto.vitrine_produto_id,
          imagem_principal_url: produto.imagem_principal_url,
        }))
        const fotosPublicas: FotoProduto[] = produtosPublicos.flatMap((produto) =>
          (produto.fotos ?? []).map((foto) => ({
            foto_id: foto.id,
            produto_id: produto.id,
            variacao_id: null,
            url: foto.url,
            ordem: foto.ordem,
            principal: foto.principal,
            alt_text: foto.alt_text,
          })),
        )

        if (ativo) {
          setProdutos(produtosAtivos)
          setFotos(fotosPublicas)
        }
      } catch (error) {
        console.error('Erro ao carregar página pública:', { etapa, error })
        const detalhe = error && typeof error === 'object'
          ? error as { message?: string; details?: string; hint?: string; code?: string }
          : {}
        const mensagem = [
          detalhe.message,
          detalhe.details,
          detalhe.hint,
          detalhe.code ? `Código: ${detalhe.code}` : '',
        ].filter(Boolean).join(' | ')
        if (ativo) setErro(`Erro na etapa "${etapa}". ${mensagem || 'Não foi possível carregar os dados públicos.'}`)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarPagina()
    return () => {
      ativo = false
    }
  }, [slug, empresaId])

  const secoesOrdenadas = useMemo(() => {
    const origem = secoes.length > 0
      ? secoes
      : SECOES_PADRAO.map((secao) => ({
          ...secao,
          vitrine_id: vitrine?.id || '',
          configuracoes: {},
        } as VitrineSecao))
    return [...origem]
      .filter((secao) => secao.visivel !== false)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  }, [secoes, vitrine?.id])

  const filialSelecionada = useMemo(
    () => filiais.find((filial) => filial.id === filialSelecionadaId) || null,
    [filiais, filialSelecionadaId],
  )

  const produtosFiltrados = useMemo(() => {
    const normalizarBusca = (texto: string) =>
      texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
    const termo = normalizarBusca(busca)
    return produtos.filter((produto) => {
      const termosAlternativos = Array.isArray(produto.termos_busca) ? produto.termos_busca : []
      const correspondeBusca =
        !termo ||
        normalizarBusca(produto.nome).includes(termo) ||
        normalizarBusca(produto.descricao || '').includes(termo) ||
        normalizarBusca(produto.descricao_curta || '').includes(termo) ||
        termosAlternativos.some((item) => normalizarBusca(item).includes(termo))
      const correspondeCategoria = !categoriaSelecionada || produto.categoria_id === categoriaSelecionada
      return correspondeBusca && correspondeCategoria
    })
  }, [produtos, busca, categoriaSelecionada])

  const produtosDestaque = useMemo(
    () => produtos.filter((produto) => produto.destaque_vitrine),
    [produtos],
  )

  const tema = useMemo<PropsTema>(() => {
    const principal = vitrine?.cor_principal || '#159447'
    const secundaria = vitrine?.cor_secundaria || '#EAF7EF'
    const destaque = vitrine?.cor_destaque || '#0F6F38'
    const escuro = aparencia.tema === 'escuro'
    const altoContraste = extra.altoContraste
    return {
      principal,
      secundaria,
      destaque,
      fundo: escuro ? '#101310' : '#F7F9F7',
      texto: altoContraste ? (escuro ? '#FFFFFF' : '#000000') : escuro ? '#F5F8F6' : extra.corTexto || '#202622',
      textoSecundario: altoContraste ? (escuro ? '#FFFFFF' : '#222222') : escuro ? '#C5CEC8' : '#66706A',
      card: escuro ? '#1B211E' : '#FFFFFF',
    }
  }, [vitrine, aparencia.tema, extra.altoContraste, extra.corTexto])

  const raio = aparencia.raio_bordas ?? 12
  const fonte = extra.fonteCorpo || aparencia.fonte || 'Inter, system-ui, sans-serif'
  const estiloBotao = aparencia.estilo_botoes === 'quadrado' ? 4 : raio
  const estiloCard: React.CSSProperties = aparencia.estilo_cards === 'destacado'
    ? { border: `1px solid ${tema.principal}55`, boxShadow: '0 5px 18px rgba(0,0,0,0.10)' }
    : { border: `1px solid ${aparencia.tema === 'escuro' ? '#354039' : '#E3EAE5'}`, boxShadow: '0 2px 9px rgba(0,0,0,0.035)' }

  const nomeLoja = vitrine?.nome_exibicao || empresa?.nome_fantasia || 'Meu negócio'
  const logo = vitrine?.logo_url || empresa?.logo_url
  const banner = vitrine?.banner_url || empresa?.banner_url
  const descricao = vitrine?.descricao || empresa?.descricao_publica
  const mensagemBoasVindas = vitrine?.mensagem_boas_vindas
  const cidade = filialSelecionada?.cidade || empresa?.cidade
  const estado = filialSelecionada?.estado || empresa?.estado
  const mostrarNome = aparencia.mostrar_nome_loja
  const mostrarLogo = aparencia.mostrar_logo
  const aumentarTexto = extra.textoAmpliado
  const paddingBotao = extra.botoesMaiores ? '16px 20px' : '13px 18px'

  function tituloSecao(secao: VitrineSecao, padrao: string) {
    return secao.titulo?.trim() || padrao
  }

  function fotoPrincipal(produtoId: string) {
    const fotosProduto = fotos
      .filter((foto) => foto.produto_id === produtoId)
      .sort((a, b) => {
        if (a.principal && !b.principal) return -1
        if (!a.principal && b.principal) return 1
        return a.ordem - b.ordem
      })
    return fotosProduto[0] || null
  }

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function renderProduto(produto: Produto) {
    const foto = fotoPrincipal(produto.id)
    const preco = produto.preco_promocional ?? produto.preco
    const possuiPromocao =
      produto.preco !== null &&
      produto.preco_promocional !== null &&
      produto.preco_promocional < produto.preco

    return (
      <button
        key={produto.id}
        type="button"
        onClick={() => setProdutoSelecionado(produto)}
        style={{
          ...styles.productCard,
          ...estiloCard,
          borderRadius: raio,
          background: tema.card,
          color: tema.texto,
          fontSize: aumentarTexto ? 16 : undefined,
          animation: extra.reduzirAnimacoes ? 'none' : undefined,
        }}
      >
        <div style={{ ...styles.productImage, borderRadius: Math.max(0, raio - 3), background: tema.secundaria }}>
          {foto ? (
            <img src={foto.url} alt={foto.alt_text || produto.nome} style={styles.productImageImg} />
          ) : (
            <div style={{ ...styles.noImage, color: tema.textoSecundario }}>Sem foto</div>
          )}
        </div>
        <div style={styles.productInfo}>
          <h3 style={{ ...styles.productName, color: tema.texto, fontSize: aumentarTexto ? 17 : 15 }}>
            {produto.nome}
          </h3>
          {produto.descricao_curta && (
            <p style={{ ...styles.productDescription, color: tema.textoSecundario, fontSize: aumentarTexto ? 14 : 12.5 }}>
              {produto.descricao_curta}
            </p>
          )}
          {vitrine?.mostrar_precos !== false && preco !== null && (
            <div style={styles.priceArea}>
              {possuiPromocao && produto.preco !== null && (
                <span style={{ ...styles.oldPrice, color: tema.textoSecundario }}>
                  {formatarPreco(produto.preco)}
                </span>
              )}
              <strong style={{ ...styles.price, color: tema.principal }}>{formatarPreco(preco)}</strong>
            </div>
          )}
        </div>
      </button>
    )
  }

  function renderBanner(secao: VitrineSecao) {
    return (
      <section key={secao.id} style={styles.presentationSection}>
        {banner && (
          <div style={styles.banner}>
            <img src={banner} alt="" style={styles.bannerImage} />
          </div>
        )}
        <div style={{
          ...styles.businessHeader,
          background: tema.card,
          borderRadius: raio,
          ...estiloCard,
          textAlign: extra.alinhamentoNome === 'centro' ? 'center' : 'left',
        }}>
          {mostrarLogo && logo && (
            <div style={{ ...styles.logoWrapper, borderRadius: raio, background: tema.secundaria, margin: extra.alinhamentoNome === 'centro' ? '0 auto 14px' : '0 0 14px' }}>
              <img src={logo} alt={`Logo de ${nomeLoja}`} style={styles.logo} />
            </div>
          )}
          {mostrarNome && (
            <h1 style={{
              ...styles.businessName,
              color: tema.texto,
              fontFamily: extra.fonteNome || fonte,
              fontSize: Math.min(48, Math.max(16, Number(extra.tamanhoNome) || 24)),
              fontWeight: extra.pesoNome === 'normal' ? 500 : 800,
              textAlign: extra.alinhamentoNome === 'centro' ? 'center' : 'left',
            }}>
              {nomeLoja}
            </h1>
          )}
          {descricao && (
            <p style={{
              ...styles.businessDescription,
              color: tema.textoSecundario,
              fontSize: aumentarTexto ? 17 : 15,
              margin: extra.alinhamentoNome === 'centro' ? '10px auto 0' : '10px 0 0',
            }}>
              {descricao}
            </p>
          )}
          {mensagemBoasVindas && (
            <div style={{
              ...styles.welcome,
              background: tema.secundaria,
              color: tema.destaque,
              borderRadius: estiloBotao,
              margin: extra.alinhamentoNome === 'centro' ? '17px auto 0' : '17px 0 0',
            }}>
              {mensagemBoasVindas}
            </div>
          )}
        </div>
      </section>
    )
  }

  function renderCategorias(secao: VitrineSecao) {
    if (categorias.length === 0) return null
    return (
      <section key={secao.id} style={styles.categoriesSection}>
        <div style={styles.sectionHeader}>
          <h2 style={{ ...styles.sectionTitle, color: tema.texto }}>{tituloSecao(secao, 'Categorias')}</h2>
        </div>
        <div style={styles.categoryScroll}>
          <button
            type="button"
            onClick={() => setCategoriaSelecionada(null)}
            style={{
              ...styles.categoryButton,
              borderRadius: estiloBotao,
              background: !categoriaSelecionada ? tema.principal : tema.card,
              color: !categoriaSelecionada ? '#FFFFFF' : tema.texto,
              borderColor: !categoriaSelecionada ? tema.principal : tema.textoSecundario,
              minHeight: extra.botoesMaiores ? 46 : 38,
              fontSize: aumentarTexto ? 15 : 13,
            }}
          >
            Todos
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.categoria_id}
              type="button"
              onClick={() => setCategoriaSelecionada(categoria.categoria_id)}
              style={{
                ...styles.categoryButton,
                borderRadius: estiloBotao,
                background: categoriaSelecionada === categoria.categoria_id ? tema.principal : tema.card,
                color: categoriaSelecionada === categoria.categoria_id ? '#FFFFFF' : tema.texto,
                borderColor: categoriaSelecionada === categoria.categoria_id ? tema.principal : tema.textoSecundario,
                minHeight: extra.botoesMaiores ? 46 : 38,
                fontSize: aumentarTexto ? 15 : 13,
              }}
            >
              {categoria.nome}
            </button>
          ))}
        </div>
      </section>
    )
  }

  function renderDestaques(secao: VitrineSecao) {
    if (produtosDestaque.length === 0 || busca || categoriaSelecionada) return null
    return (
      <section key={secao.id} style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={{ ...styles.sectionTitle, color: tema.texto }}>{tituloSecao(secao, 'Destaques')}</h2>
            <p style={{ ...styles.sectionSubtitle, color: tema.textoSecundario }}>Produtos escolhidos pelo negócio</p>
          </div>
        </div>
        <div style={styles.productGrid}>{produtosDestaque.map(renderProduto)}</div>
      </section>
    )
  }

  function renderProdutos(secao: VitrineSecao) {
    return (
      <section key={secao.id} style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={{ ...styles.sectionTitle, color: tema.texto }}>{tituloSecao(secao, 'Produtos')}</h2>
            <p style={{ ...styles.sectionSubtitle, color: tema.textoSecundario }}>
              {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto' : 'produtos'}
            </p>
          </div>
        </div>
        {produtosFiltrados.length > 0 ? (
          <div style={styles.productGrid}>{produtosFiltrados.map(renderProduto)}</div>
        ) : (
          <div style={{ ...styles.emptyProducts, background: tema.card, borderRadius: raio, color: tema.textoSecundario }}>
            Nenhum produto encontrado.
          </div>
        )}
      </section>
    )
  }

  function renderOndeEstamos(secao: VitrineSecao) {
    if (!filialSelecionada && !cidade && !estado) return null
    return (
      <section key={secao.id} style={styles.section}>
        <div style={{ ...styles.locationCard, ...estiloCard, background: tema.card, borderRadius: raio }}>
          <div style={{ ...styles.locationIcon, background: tema.secundaria, color: tema.principal }}>
            <MapPin size={22} />
          </div>
          <div>
            <h2 style={{ ...styles.locationTitle, color: tema.texto }}>{tituloSecao(secao, 'Onde estamos')}</h2>
            {filialSelecionada?.nome && <strong style={{ ...styles.locationLine, color: tema.texto }}>{filialSelecionada.nome}</strong>}
            {filialSelecionada?.logradouro && (
              <span style={{ ...styles.locationLine, color: tema.textoSecundario }}>
                {filialSelecionada.logradouro}
                {filialSelecionada.numero ? `, ${filialSelecionada.numero}` : ''}
                {filialSelecionada.complemento ? ` - ${filialSelecionada.complemento}` : ''}
              </span>
            )}
            {filialSelecionada?.bairro && <span style={{ ...styles.locationLine, color: tema.textoSecundario }}>{filialSelecionada.bairro}</span>}
            {(cidade || estado) && (
              <span style={{ ...styles.locationLine, color: tema.textoSecundario }}>
                {cidade}{cidade && estado ? ' - ' : ''}{estado}
              </span>
            )}
          </div>
        </div>
      </section>
    )
  }

  function renderSecao(secao: VitrineSecao) {
    switch (secao.tipo) {
      case 'banner':
        return renderBanner(secao)
      case 'categorias':
        return renderCategorias(secao)
      case 'destaques':
        return renderDestaques(secao)
      case 'produtos':
        return renderProdutos(secao)
      case 'onde_estamos':
        return renderOndeEstamos(secao)
      default:
        return null
    }
  }

  if (produtoSelecionado) {
    return (
      <ProdutoDetalhePage
        produtoId={produtoSelecionado.id}
        empresaId={empresa?.id || ''}
        vitrineSlug={vitrine?.slug || ''}
        onVoltar={() => setProdutoSelecionado(null)}
      />
    )
  }

  if (carregando) {
    return <div style={{ ...styles.page, background: '#F7F9F7' }}><div style={styles.loading}>Carregando vitrine...</div></div>
  }

  if (erro) {
    return (
      <div style={{ ...styles.page, background: '#F7F9F7' }}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>Não foi possível abrir a vitrine</h1>
          <p style={styles.errorText}>{erro}</p>
          {onVoltar && (
            <button onClick={onVoltar} style={{ ...styles.backButton, background: '#FFFFFF' }}>
              <ArrowLeft size={18} /> Voltar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      ...styles.page,
      background: tema.fundo,
      color: tema.texto,
      fontFamily: fonte,
      fontSize: aumentarTexto ? 17 : 16,
    }}>
      <header style={{
        ...styles.topBar,
        background: tema.card,
        borderBottom: `1px solid ${aparencia.tema === 'escuro' ? '#2B342F' : '#E3EAE5'}`,
      }}>
        <div style={styles.topBarInner}>
          {onVoltar && (
            <button onClick={onVoltar} style={{ ...styles.backButton, color: tema.texto, background: 'transparent' }}>
              <ArrowLeft size={18} /> Voltar
            </button>
          )}
          <img src="/logo-organiza-transparente.png" alt="Organiza" style={styles.organizaLogo} />
        </div>
      </header>

      <main style={styles.main}>
        {filiais.length > 1 && (
          <section style={styles.branchSection}>
            <label style={{ ...styles.fieldLabel, color: tema.texto }}>Escolha a unidade</label>
            <div style={styles.selectWrapper}>
              <select
                value={filialSelecionadaId || ''}
                onChange={(event) => setFilialSelecionadaId(event.target.value)}
                style={{
                  ...styles.select,
                  background: tema.card,
                  color: tema.texto,
                  borderColor: aparencia.tema === 'escuro' ? '#38423C' : '#DCE5DF',
                  borderRadius: estiloBotao,
                  minHeight: extra.botoesMaiores ? 52 : 44,
                }}
              >
                {filiais.map((filial) => (
                  <option key={filial.id} value={filial.id}>
                    {filial.nome || filial.codigo || 'Unidade'}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} style={styles.selectIcon} />
            </div>
          </section>
        )}

        <section style={styles.searchSection}>
          <div style={{
            ...styles.searchBox,
            background: tema.card,
            borderColor: aparencia.tema === 'escuro' ? '#38423C' : '#DCE5DF',
            borderRadius: estiloBotao,
          }}>
            <Search size={19} color={tema.textoSecundario} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar produtos"
              aria-label="Buscar produtos"
              style={{ ...styles.searchInput, color: tema.texto, fontSize: aumentarTexto ? 17 : 15 }}
            />
          </div>
        </section>

        {secoesOrdenadas.map((secao) => renderSecao(secao))}
      </main>

      {vitrine?.permitir_pedidos && (
        <div style={{
          ...styles.bottomOrderBar,
          background: tema.card,
          borderTop: `1px solid ${aparencia.tema === 'escuro' ? '#2B342F' : '#E3EAE5'}`,
        }}>
          <button
            type="button"
            onClick={() => console.warn('O carrinho precisa ser conectado ao fluxo de pedidos existente.')}
            style={{
              ...styles.orderButton,
              background: tema.principal,
              borderRadius: estiloBotao,
              padding: paddingBotao,
              fontSize: aumentarTexto ? 17 : 15,
            }}
          >
            <ShoppingBag size={19} /> Fazer pedido
          </button>
        </div>
      )}

      <footer style={{
        ...styles.footer,
        background: tema.card,
        borderTop: `1px solid ${aparencia.tema === 'escuro' ? '#2B342F' : '#E3EAE5'}`,
      }}>
        <strong style={styles.footerBrand}>Organiza</strong>
        <span style={{ ...styles.footerText, color: tema.textoSecundario }}>Tecnologia para quem empreende</span>
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', width: '100%', boxSizing: 'border-box' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#66706A', fontSize: 16 },
  errorContainer: { maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' },
  errorTitle: { margin: '0 0 10px', fontSize: 25, color: '#202622' },
  errorText: { margin: '0 0 25px', color: '#66706A', lineHeight: 1.5 },
  topBar: { position: 'sticky', top: 0, zIndex: 20 },
  topBarInner: { maxWidth: 1180, margin: '0 auto', minHeight: 58, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  organizaLogo: { width: 36, height: 36, objectFit: 'contain', marginLeft: 'auto', display: 'block' },
  backButton: { border: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 0', fontSize: 14, cursor: 'pointer' },
  main: { maxWidth: 1180, margin: '0 auto', padding: '24px 20px 110px', boxSizing: 'border-box' },
  presentationSection: { marginBottom: 22 },
  banner: { width: '100%', maxHeight: 360, overflow: 'hidden', borderRadius: 0 },
  bannerImage: { width: '100%', height: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' },
  businessHeader: { padding: 24, marginTop: 18, marginBottom: 0 },
  logoWrapper: { width: 92, height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: '100%', objectFit: 'contain' },
  businessName: { margin: 0, lineHeight: 1.15, letterSpacing: '-0.4px', overflowWrap: 'anywhere' },
  businessDescription: { maxWidth: 680, lineHeight: 1.6 },
  welcome: { maxWidth: 680, padding: '11px 15px', fontSize: 14, lineHeight: 1.5 },
  branchSection: { marginBottom: 18 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 650, marginBottom: 7 },
  selectWrapper: { position: 'relative' },
  select: { width: '100%', appearance: 'none', padding: '12px 42px 12px 13px', fontSize: 14, border: '1px solid', outline: 'none' },
  selectIcon: { position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  searchSection: { marginBottom: 22 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1px solid' },
  searchInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', minWidth: 0 },
  categoriesSection: { marginBottom: 25, overflow: 'hidden' },
  categoryScroll: { display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4 },
  categoryButton: { flexShrink: 0, padding: '9px 14px', border: '1px solid', fontWeight: 600, cursor: 'pointer' },
  section: { marginBottom: 30 },
  sectionHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { margin: 0, fontSize: 21, letterSpacing: '-0.3px' },
  sectionSubtitle: { margin: '4px 0 0', fontSize: 13 },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 },
  productCard: { padding: 9, textAlign: 'left', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.15s ease, box-shadow 0.15s ease' },
  productImage: { width: '100%', aspectRatio: '1 / 1', overflow: 'hidden' },
  productImageImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  noImage: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 },
  productInfo: { padding: '12px 5px 6px' },
  productName: { margin: 0, lineHeight: 1.3, fontWeight: 700 },
  productDescription: { margin: '6px 0 0', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  priceArea: { marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  oldPrice: { fontSize: 12, textDecoration: 'line-through' },
  price: { fontSize: 17, marginTop: 2 },
  emptyProducts: { padding: 35, textAlign: 'center', fontSize: 14 },
  locationCard: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: 20 },
  locationIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  locationTitle: { margin: '0 0 7px', fontSize: 18 },
  locationLine: { display: 'block', fontSize: 13.5, lineHeight: 1.55 },
  bottomOrderBar: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, padding: '11px 20px' },
  orderButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', maxWidth: 520, margin: '0 auto', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' },
  footer: { padding: '25px 20px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' },
  footerBrand: { fontSize: 18, color: '#000000', fontWeight: 800 },
  footerText: { fontSize: 12.5 },
}
