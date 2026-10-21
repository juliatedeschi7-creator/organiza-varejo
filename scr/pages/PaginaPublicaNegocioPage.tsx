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

export default function PaginaPublicaNegocioPage({
  slug,
  empresaId,
  onVoltar,
}: PaginaPublicaNegocioPageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [vitrine, setVitrine] = useState<Vitrine | null>(null)
  const [aparencia, setAparencia] =
    useState<VitrineAparencia>(aparenciaPadrao)

  const [filiais, setFiliais] = useState<Filial[]>([])
  const [filialSelecionadaId, setFilialSelecionadaId] =
    useState<string | null>(null)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fotos, setFotos] = useState<FotoProduto[]>([])

  const [busca, setBusca] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string | null>(null)

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<Produto | null>(null)

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarPagina()
  }, [slug, empresaId])

  async function carregarPagina() {
    let etapa = 'dados públicos do negócio'

    try {
      setCarregando(true)
      setErro('')
      setEmpresa(null)
      setVitrine(null)
      setAparencia(aparenciaPadrao)
      setFiliais([])
      setCategorias([])
      setProdutos([])
      setFotos([])

      let slugResolvido = typeof slug === 'string' ? slug.trim().toLowerCase() : ''

      // A navegação interna do aplicativo ainda abre esta página por empresaId.
      // Nesse caso, resolvemos o slug com a sessão autenticada e depois usamos
      // a mesma função pública controlada para carregar os dados da vitrine.
      if (!slugResolvido && empresaId) {
        const { data: empresaSlug, error: empresaSlugError } = await supabase
          .from('empresas')
          .select('slug')
          .eq('id', empresaId)
          .maybeSingle()

        if (empresaSlugError) throw empresaSlugError
        slugResolvido = String(empresaSlug?.slug || '').trim().toLowerCase()
      }

      if (!slugResolvido) {
        setErro('Negócio não encontrado.')
        return
      }

      const { data: dados, error: dadosError } = await supabase.rpc(
        'obter_dados_vitrine_publica',
        { p_slug: slugResolvido },
      )

      if (dadosError) throw dadosError
      if (!dados?.empresa || !dados?.vitrine) {
        setErro('Negócio não encontrado ou vitrine indisponível.')
        return
      }

      const empresaData = dados.empresa as Empresa
      const vitrineData = dados.vitrine as Vitrine
      const aparenciaData = dados.aparencia as VitrineAparencia | null
      const filiaisData = (dados.filiais || []) as Filial[]
      const categoriasData = (dados.categorias || []) as Categoria[]

      setEmpresa(empresaData)
      setVitrine(vitrineData)
      setAparencia(
        aparenciaData || {
          ...aparenciaPadrao,
          vitrine_id: vitrineData.id,
        },
      )
      setFiliais(filiaisData)
      setFilialSelecionadaId(filiaisData[0]?.id || null)
      setCategorias(categoriasData)

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

      if (!resultado?.vitrine) {
        throw new Error('Vitrine pública não encontrada ou indisponível.')
      }

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
      setProdutos(produtosAtivos)

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
      setFotos(fotosPublicas)
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
      setErro(`Erro na etapa "${etapa}". ${mensagem || 'Não foi possível carregar os dados públicos.'}`)
    } finally {
      setCarregando(false)
    }
  }

  const filialSelecionada = useMemo(
    () =>
      filiais.find(
        (filial) =>
          filial.id === filialSelecionadaId,
      ) || null,
    [filiais, filialSelecionadaId],
  )

  const produtosFiltrados = useMemo(() => {
    const normalizarBusca = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .trim()
    const termo = normalizarBusca(busca)

    return produtos.filter((produto) => {
      const termosAlternativos = Array.isArray(produto.termos_busca)
        ? produto.termos_busca
        : []
      const correspondeBusca =
        !termo ||
        normalizarBusca(produto.nome).includes(termo) ||
        normalizarBusca(produto.descricao || '').includes(termo) ||
        normalizarBusca(produto.descricao_curta || '').includes(termo) ||
        termosAlternativos.some((item) =>
          normalizarBusca(item).includes(termo)
        )

      const correspondeCategoria =
        !categoriaSelecionada ||
        produto.categoria_id === categoriaSelecionada

      return (
        correspondeBusca &&
        correspondeCategoria
      )
    })
  }, [
    produtos,
    busca,
    categoriaSelecionada,
  ])

  const produtosDestaque = useMemo(
    () =>
      produtos.filter(
        (produto) =>
          produto.destaque_vitrine,
      ),
    [produtos],
  )

  const tema = useMemo<PropsTema>(() => {
    const principal =
      vitrine?.cor_principal || '#159447'

    const secundaria =
      vitrine?.cor_secundaria || '#EAF7EF'

    const destaque =
      vitrine?.cor_destaque || '#0F6F38'

    const escuro =
      aparencia.tema === 'escuro'

    return {
      principal,
      secundaria,
      destaque,
      fundo: escuro ? '#121714' : '#F7F9F7',
      texto: escuro ? '#F5F8F6' : '#202622',
      textoSecundario: escuro
        ? '#AEB9B2'
        : '#66706A',
      card: escuro ? '#1B211E' : '#FFFFFF',
    }
  }, [
    vitrine,
    aparencia.tema,
  ])

  const raio =
    aparencia.raio_bordas ?? 12

  const fonte =
    aparencia.fonte ||
    'Inter, system-ui, sans-serif'

  const estiloBotao =
    aparencia.estilo_botoes === 'quadrado'
      ? 4
      : raio

  const estiloCard =
    aparencia.estilo_cards === 'destacado'
      ? {
          border: `1px solid ${tema.principal}33`,
          boxShadow:
            '0 5px 18px rgba(0,0,0,0.08)',
        }
      : {
          border: `1px solid ${
            aparencia.tema === 'escuro'
              ? '#2B342F'
              : '#E3EAE5'
          }`,
          boxShadow:
            '0 2px 9px rgba(0,0,0,0.035)',
        }

  function fotoPrincipal(produtoId: string) {
    const fotosProduto = fotos
      .filter(
        (foto) =>
          foto.produto_id === produtoId,
      )
      .sort((a, b) => {
        if (a.principal && !b.principal) {
          return -1
        }

        if (!a.principal && b.principal) {
          return 1
        }

        return a.ordem - b.ordem
      })

    return fotosProduto[0] || null
  }

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function renderProduto(produto: Produto) {
    const foto = fotoPrincipal(produto.id)

    const preco =
      produto.preco_promocional ??
      produto.preco

    const possuiPromocao =
      produto.preco !== null &&
      produto.preco_promocional !== null &&
      produto.preco_promocional < produto.preco

    return (
      <button
        key={produto.id}
        type="button"
        onClick={() =>
          setProdutoSelecionado(produto)
        }
        style={{
          ...styles.productCard,
          ...estiloCard,
          borderRadius: raio,
          background: tema.card,
          color: tema.texto,
        }}
      >
        <div
          style={{
            ...styles.productImage,
            borderRadius: Math.max(
              0,
              raio - 3,
            ),
            background: tema.secundaria,
          }}
        >
          {foto ? (
            <img
              src={foto.url}
              alt={
                foto.alt_text ||
                produto.nome
              }
              style={styles.productImageImg}
            />
          ) : (
            <div
              style={{
                ...styles.noImage,
                color: tema.textoSecundario,
              }}
            >
              Sem foto
            </div>
          )}
        </div>

        <div style={styles.productInfo}>
          <h3
            style={{
              ...styles.productName,
              color: tema.texto,
            }}
          >
            {produto.nome}
          </h3>

          {produto.descricao_curta && (
            <p
              style={{
                ...styles.productDescription,
                color: tema.textoSecundario,
              }}
            >
              {produto.descricao_curta}
            </p>
          )}

          {vitrine?.mostrar_precos !== false && preco !== null && (
            <div style={styles.priceArea}>
              {possuiPromocao && produto.preco !== null && (
                <span
                  style={{
                    ...styles.oldPrice,
                    color: tema.textoSecundario,
                  }}
                >
                  {formatarPreco(produto.preco)}
                </span>
              )}

              <strong
                style={{
                  ...styles.price,
                  color: tema.principal,
                }}
              >
                {formatarPreco(preco)}
              </strong>
            </div>
          )}
        </div>
      </button>
    )
  }

  if (produtoSelecionado) {
    return (
      <ProdutoDetalhePage
        produtoId={produtoSelecionado.id}
        empresaId={empresa?.id || ''}
        vitrineSlug={vitrine?.slug || ''}
        onVoltar={() =>
          setProdutoSelecionado(null)
        }
      />
    )
  }

  if (carregando) {
    return (
      <div
        style={{
          ...styles.page,
          background: '#F7F9F7',
        }}
      >
        <div style={styles.loading}>
          Carregando vitrine...
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div
        style={{
          ...styles.page,
          background: '#F7F9F7',
        }}
      >
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>
            Não foi possível abrir a vitrine
          </h1>

          <p style={styles.errorText}>
            {erro}
          </p>

          {onVoltar && (
            <button
              onClick={onVoltar}
              style={{
                ...styles.backButton,
                background: '#FFFFFF',
              }}
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
          )}
        </div>
      </div>
    )
  }

  const nomeLoja =
    vitrine?.nome_exibicao ||
    empresa?.nome_fantasia ||
    'Meu negócio'

  const logo =
    vitrine?.logo_url ||
    empresa?.logo_url

  const banner =
    vitrine?.banner_url ||
    empresa?.banner_url

  const descricao =
    vitrine?.descricao ||
    empresa?.descricao_publica

  const mostrarNome =
    aparencia.mostrar_nome_loja

  const mostrarLogo =
    aparencia.mostrar_logo

  const mensagemBoasVindas =
    vitrine?.mensagem_boas_vindas

  const cidade =
    filialSelecionada?.cidade ||
    empresa?.cidade

  const estado =
    filialSelecionada?.estado ||
    empresa?.estado

  return (
    <div
      style={{
        ...styles.page,
        background: tema.fundo,
        color: tema.texto,
        fontFamily: fonte,
      }}
    >
      <header
        style={{
          ...styles.topBar,
          background: tema.card,
          borderBottom: `1px solid ${
            aparencia.tema === 'escuro'
              ? '#2B342F'
              : '#E3EAE5'
          }`,
        }}
      >
        <div style={styles.topBarInner}>
          {onVoltar && (
            <button
              onClick={onVoltar}
              style={{
                ...styles.backButton,
                color: tema.texto,
                background: 'transparent',
              }}
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
          )}

          <div style={styles.organizaLabel}>
            organiza
          </div>
        </div>
      </header>

      {banner && (
        <div
          style={{
            ...styles.banner,
            borderRadius: 0,
          }}
        >
          <img
            src={banner}
            alt=""
            style={styles.bannerImage}
          />
        </div>
      )}

      <main style={styles.main}>
        <section
          style={{
            ...styles.businessHeader,
            background: tema.card,
            borderRadius: raio,
            ...estiloCard,
          }}
        >
          {mostrarLogo && logo && (
            <div
              style={{
                ...styles.logoWrapper,
                borderRadius: raio,
                background: tema.secundaria,
              }}
            >
              <img
                src={logo}
                alt={`Logo de ${nomeLoja}`}
                style={styles.logo}
              />
            </div>
          )}

          {mostrarNome && (
            <h1
              style={{
                ...styles.businessName,
                color: tema.texto,
              }}
            >
              {nomeLoja}
            </h1>
          )}

          {descricao && (
            <p
              style={{
                ...styles.businessDescription,
                color: tema.textoSecundario,
              }}
            >
              {descricao}
            </p>
          )}

          {mensagemBoasVindas && (
            <div
              style={{
                ...styles.welcome,
                background: tema.secundaria,
                color: tema.destaque,
                borderRadius: estiloBotao,
              }}
            >
              {mensagemBoasVindas}
            </div>
          )}
        </section>

        {filiais.length > 1 && (
          <section style={styles.branchSection}>
            <label
              style={{
                ...styles.fieldLabel,
                color: tema.texto,
              }}
            >
              Escolha a unidade
            </label>

            <div style={styles.selectWrapper}>
              <select
                value={
                  filialSelecionadaId || ''
                }
                onChange={(e) =>
                  setFilialSelecionadaId(
                    e.target.value,
                  )
                }
                style={{
                  ...styles.select,
                  background: tema.card,
                  color: tema.texto,
                  borderColor:
                    aparencia.tema === 'escuro'
                      ? '#38423C'
                      : '#DCE5DF',
                  borderRadius: estiloBotao,
                }}
              >
                {filiais.map((filial) => (
                  <option
                    key={filial.id}
                    value={filial.id}
                  >
                    {filial.nome ||
                      filial.codigo ||
                      'Unidade'}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                style={styles.selectIcon}
              />
            </div>
          </section>
        )}

        <section style={styles.searchSection}>
          <div
            style={{
              ...styles.searchBox,
              background: tema.card,
              borderColor:
                aparencia.tema === 'escuro'
                  ? '#38423C'
                  : '#DCE5DF',
              borderRadius: estiloBotao,
            }}
          >
            <Search
              size={19}
              color={tema.textoSecundario}
            />

            <input
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              placeholder="Buscar produtos"
              style={{
                ...styles.searchInput,
                color: tema.texto,
              }}
            />
          </div>
        </section>

        {categorias.length > 0 && (
          <section style={styles.categoriesSection}>
            <div
              style={styles.categoryScroll}
            >
              <button
                type="button"
                onClick={() =>
                  setCategoriaSelecionada(null)
                }
                style={{
                  ...styles.categoryButton,
                  borderRadius: estiloBotao,
                  background:
                    !categoriaSelecionada
                      ? tema.principal
                      : tema.card,
                  color:
                    !categoriaSelecionada
                      ? '#FFFFFF'
                      : tema.texto,
                  borderColor:
                    !categoriaSelecionada
                      ? tema.principal
                      : '#DCE5DF',
                }}
              >
                Todos
              </button>

              {categorias.map((categoria) => (
                <button
                  key={categoria.categoria_id}
                  type="button"
                  onClick={() =>
                    setCategoriaSelecionada(
                      categoria.categoria_id,
                    )
                  }
                  style={{
                    ...styles.categoryButton,
                    borderRadius: estiloBotao,
                    background:
                      categoriaSelecionada ===
                      categoria.categoria_id
                        ? tema.principal
                        : tema.card,
                    color:
                      categoriaSelecionada ===
                      categoria.categoria_id
                        ? '#FFFFFF'
                        : tema.texto,
                    borderColor:
                      categoriaSelecionada ===
                      categoria.categoria_id
                        ? tema.principal
                        : '#DCE5DF',
                  }}
                >
                  {categoria.nome}
                </button>
              ))}
            </div>
          </section>
        )}

        {aparencia.layout_inicio !== 'inicio' &&
          produtosDestaque.length > 0 &&
          !busca &&
          !categoriaSelecionada && (
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2
                    style={{
                      ...styles.sectionTitle,
                      color: tema.texto,
                    }}
                  >
                    Destaques
                  </h2>

                  <p
                    style={{
                      ...styles.sectionSubtitle,
                      color: tema.textoSecundario,
                    }}
                  >
                    Produtos escolhidos pelo negócio
                  </p>
                </div>
              </div>

              <div style={styles.productGrid}>
                {produtosDestaque.map(
                  renderProduto,
                )}
              </div>
            </section>
          )}

        {aparencia.layout_inicio === 'inicio' &&
          (descricao || mensagemBoasVindas) && (
            <section style={styles.section}>
              <div
                style={{
                  ...styles.aboutCard,
                  ...estiloCard,
                  background: tema.card,
                  borderRadius: raio,
                }}
              >
                <h2
                  style={{
                    ...styles.aboutTitle,
                    color: tema.texto,
                  }}
                >
                  Sobre o negócio
                </h2>

                {descricao && (
                  <p
                    style={{
                      ...styles.aboutText,
                      color: tema.textoSecundario,
                    }}
                  >
                    {descricao}
                  </p>
                )}

                {mensagemBoasVindas && (
                  <p
                    style={{
                      ...styles.aboutText,
                      color: tema.textoSecundario,
                    }}
                  >
                    {mensagemBoasVindas}
                  </p>
                )}
              </div>
            </section>
          )}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2
                style={{
                  ...styles.sectionTitle,
                  color: tema.texto,
                }}
              >
                Produtos
              </h2>

              <p
                style={{
                  ...styles.sectionSubtitle,
                  color: tema.textoSecundario,
                }}
              >
                {produtosFiltrados.length}{' '}
                {produtosFiltrados.length === 1
                  ? 'produto'
                  : 'produtos'}
              </p>
            </div>
          </div>

          {produtosFiltrados.length > 0 ? (
            <div style={styles.productGrid}>
              {produtosFiltrados.map(
                renderProduto,
              )}
            </div>
          ) : (
            <div
              style={{
                ...styles.emptyProducts,
                background: tema.card,
                borderRadius: raio,
                color: tema.textoSecundario,
              }}
            >
              Nenhum produto encontrado.
            </div>
          )}
        </section>

        {(filialSelecionada ||
          cidade ||
          estado) && (
          <section style={styles.section}>
            <div
              style={{
                ...styles.locationCard,
                ...estiloCard,
                background: tema.card,
                borderRadius: raio,
              }}
            >
              <div
                style={{
                  ...styles.locationIcon,
                  background: tema.secundaria,
                  color: tema.principal,
                }}
              >
                <MapPin size={22} />
              </div>

              <div>
                <h2
                  style={{
                    ...styles.locationTitle,
                    color: tema.texto,
                  }}
                >
                  Onde estamos
                </h2>

                {filialSelecionada?.nome && (
                  <strong
                    style={{
                      ...styles.locationLine,
                      color: tema.texto,
                    }}
                  >
                    {filialSelecionada.nome}
                  </strong>
                )}

                {filialSelecionada?.logradouro && (
                  <span
                    style={{
                      ...styles.locationLine,
                      color: tema.textoSecundario,
                    }}
                  >
                    {filialSelecionada.logradouro}
                    {filialSelecionada.numero
                      ? `, ${filialSelecionada.numero}`
                      : ''}
                    {filialSelecionada.complemento
                      ? ` - ${filialSelecionada.complemento}`
                      : ''}
                  </span>
                )}

                {filialSelecionada?.bairro && (
                  <span
                    style={{
                      ...styles.locationLine,
                      color: tema.textoSecundario,
                    }}
                  >
                    {filialSelecionada.bairro}
                  </span>
                )}

                {(cidade || estado) && (
                  <span
                    style={{
                      ...styles.locationLine,
                      color: tema.textoSecundario,
                    }}
                  >
                    {cidade}
                    {cidade && estado
                      ? ' - '
                      : ''}
                    {estado}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {vitrine?.permitir_pedidos && (
        <div
          style={{
            ...styles.bottomOrderBar,
            background: tema.card,
            borderTop: `1px solid ${
              aparencia.tema === 'escuro'
                ? '#2B342F'
                : '#E3EAE5'
            }`,
          }}
        >
          <button
            type="button"
            onClick={() => {
              console.log(
                'Abrir carrinho/pedido',
              )
            }}
            style={{
              ...styles.orderButton,
              background: tema.principal,
              borderRadius: estiloBotao,
            }}
          >
            <ShoppingBag size={19} />
            Fazer pedido
          </button>
        </div>
      )}

      <footer
        style={{
          ...styles.footer,
          background: tema.card,
          borderTop: `1px solid ${
            aparencia.tema === 'escuro'
              ? '#2B342F'
              : '#E3EAE5'
          }`,
        }}
      >
        <strong style={styles.footerBrand}>
          organiza
        </strong>

        <span
          style={{
            ...styles.footerText,
            color: tema.textoSecundario,
          }}
        >
          Tecnologia para quem empreende
        </span>
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
  },

  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#66706A',
    fontSize: 16,
  },

  errorContainer: {
    maxWidth: 560,
    margin: '0 auto',
    padding: '80px 24px',
    textAlign: 'center',
  },

  errorTitle: {
    margin: '0 0 10px',
    fontSize: 25,
    color: '#202622',
  },

  errorText: {
    margin: '0 0 25px',
    color: '#66706A',
    lineHeight: 1.5,
  },

  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },

  topBarInner: {
    maxWidth: 1180,
    margin: '0 auto',
    minHeight: 58,
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  organizaLabel: {
    marginLeft: 'auto',
    fontWeight: 800,
    fontSize: 17,
    color: '#159447',
    letterSpacing: '-0.3px',
  },

  backButton: {
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 0',
    fontSize: 14,
    cursor: 'pointer',
  },

  banner: {
    width: '100%',
    maxHeight: 360,
    overflow: 'hidden',
  },

  bannerImage: {
    width: '100%',
    height: '100%',
    maxHeight: 360,
    objectFit: 'cover',
    display: 'block',
  },

  main: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '24px 20px 110px',
    boxSizing: 'border-box',
  },

  businessHeader: {
    padding: 24,
    textAlign: 'center',
    marginBottom: 22,
  },

  logoWrapper: {
    width: 92,
    height: 92,
    margin: '0 auto 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  businessName: {
    margin: 0,
    fontSize: 29,
    lineHeight: 1.15,
    fontWeight: 750,
    letterSpacing: '-0.6px',
  },

  businessDescription: {
    maxWidth: 680,
    margin: '10px auto 0',
    fontSize: 15,
    lineHeight: 1.6,
  },

  welcome: {
    maxWidth: 680,
    margin: '17px auto 0',
    padding: '11px 15px',
    fontSize: 14,
    lineHeight: 1.5,
  },

  branchSection: {
    marginBottom: 18,
  },

  fieldLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 650,
    marginBottom: 7,
  },

  selectWrapper: {
    position: 'relative',
  },

  select: {
    width: '100%',
    appearance: 'none',
    padding: '12px 42px 12px 13px',
    fontSize: 14,
    border: '1px solid',
    outline: 'none',
  },

  selectIcon: {
    position: 'absolute',
    right: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },

  searchSection: {
    marginBottom: 18,
  },

  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    border: '1px solid',
  },

  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 15,
    minWidth: 0,
  },

  categoriesSection: {
    marginBottom: 25,
    overflow: 'hidden',
  },

  categoryScroll: {
    display: 'flex',
    gap: 9,
    overflowX: 'auto',
    paddingBottom: 4,
  },

  categoryButton: {
    flexShrink: 0,
    padding: '9px 14px',
    border: '1px solid',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  section: {
    marginBottom: 30,
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 21,
    letterSpacing: '-0.3px',
  },

  sectionSubtitle: {
    margin: '4px 0 0',
    fontSize: 13,
  },

  productGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 14,
  },

  productCard: {
    padding: 9,
    textAlign: 'left',
    cursor: 'pointer',
    overflow: 'hidden',
    transition:
      'transform 0.15s ease, box-shadow 0.15s ease',
  },

  productImage: {
    width: '100%',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
  },

  productImageImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
  },

  productInfo: {
    padding: '12px 5px 6px',
  },

  productName: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.3,
    fontWeight: 700,
  },

  productDescription: {
    margin: '6px 0 0',
    fontSize: 12.5,
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  priceArea: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  oldPrice: {
    fontSize: 12,
    textDecoration: 'line-through',
  },

  price: {
    fontSize: 17,
    marginTop: 2,
  },

  aboutCard: {
    padding: 21,
  },

  aboutTitle: {
    margin: 0,
    fontSize: 19,
  },

  aboutText: {
    margin: '10px 0 0',
    fontSize: 14,
    lineHeight: 1.65,
  },

  emptyProducts: {
    padding: 35,
    textAlign: 'center',
    fontSize: 14,
  },

  locationCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: 20,
  },

  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  locationTitle: {
    margin: '0 0 7px',
    fontSize: 18,
  },

  locationLine: {
    display: 'block',
    fontSize: 13.5,
    lineHeight: 1.55,
  },

  bottomOrderBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    padding: '11px 20px',
  },

  orderButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 520,
    margin: '0 auto',
    border: 'none',
    color: '#FFFFFF',
    padding: '13px 18px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },

  footer: {
    padding: '25px 20px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    textAlign: 'center',
  },

  footerBrand: {
    fontSize: 18,
    color: '#159447',
  },

  footerText: {
    fontSize: 12.5,
  },
}