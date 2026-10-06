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
  empresaId: string
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
  sku: string | null
  codigo_barras: string | null
  codigo_interno: string | null
  unidade: string
  vendido_por_peso: boolean
  vendido_por_medida: boolean
  preco: number
  preco_promocional: number | null
  custo: number | null
  destaque_vitrine: boolean
  visivel_vitrine: boolean
  ativo: boolean
  controla_estoque: boolean
  informacoes_adicionais: Record<string, unknown> | null
  meta_titulo: string | null
  meta_descricao: string | null
  created_at: string
  updated_at: string
  promocao_inicio: string | null
  promocao_fim: string | null
  unidade_estoque_id: string | null
  unidade_venda_id: string | null
  unidade_compra_id: string | null
  permite_venda_fracionada: boolean
  permite_compra_fracionada: boolean
  permite_consumo_fracionada: boolean
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
  }, [empresaId])

  async function carregarPagina() {
    try {
      setCarregando(true)
      setErro('')

      const { data: empresaData, error: empresaError } =
        await supabase
          .from('empresas')
          .select(`
            id,
            nome_fantasia,
            slug,
            logo_url,
            banner_url,
            cidade,
            estado,
            descricao_publica
          `)
          .eq('id', empresaId)
          .maybeSingle()

      if (empresaError) throw empresaError

      if (!empresaData) {
        setErro('Negócio não encontrado.')
        return
      }

      setEmpresa(empresaData as Empresa)

      const { data: vitrineData, error: vitrineError } =
        await supabase
          .from('vitrines')
          .select(`
            id,
            empresa_id,
            filial_id,
            nome_exibicao,
            descricao,
            slug,
            logo_url,
            banner_url,
            cor_principal,
            cor_secundaria,
            cor_destaque,
            mensagem_boas_vindas,
            mensagem_fechado,
            mostrar_precos,
            permitir_pedidos,
            permitir_favoritos,
            permitir_compartilhamento,
            ativo,
            fuso_horario
          `)
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .limit(1)
          .maybeSingle()

      if (vitrineError) throw vitrineError

      if (vitrineData) {
        setVitrine(vitrineData as Vitrine)

        const { data: aparenciaData, error: aparenciaError } =
          await supabase
            .from('vitrine_aparencia')
            .select(`
              vitrine_id,
              fonte,
              estilo_botoes,
              estilo_cards,
              raio_bordas,
              mostrar_logo,
              mostrar_nome_loja,
              layout_inicio,
              tema
            `)
            .eq('vitrine_id', vitrineData.id)
            .maybeSingle()

        if (aparenciaError) throw aparenciaError

        if (aparenciaData) {
          setAparencia(
            aparenciaData as VitrineAparencia,
          )
        } else {
          setAparencia({
            ...aparenciaPadrao,
            vitrine_id: vitrineData.id,
          })
        }
      }

      const { data: filiaisData, error: filiaisError } =
        await supabase
          .from('filiais')
          .select(`
            id,
            empresa_id,
            nome,
            codigo,
            telefone,
            whatsapp,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            latitude,
            longitude,
            ativa
          `)
          .eq('empresa_id', empresaId)
          .eq('ativa', true)
          .order('nome')

      if (filiaisError) throw filiaisError

      const filiaisAtivas = (filiaisData || []) as Filial[]

      setFiliais(filiaisAtivas)

      if (filiaisAtivas.length > 0) {
        setFilialSelecionadaId(filiaisAtivas[0].id)
      }

      const { data: categoriasData, error: categoriasError } =
        await supabase
          .from('catalogo_publico_categorias')
          .select(`
            categoria_id,
            empresa_id,
            categoria_pai_id,
            nome,
            slug,
            descricao,
            imagem_url,
            ordem
          `)
          .eq('empresa_id', empresaId)
          .order('ordem')
          .order('nome')

      if (categoriasError) throw categoriasError

      setCategorias((categoriasData || []) as Categoria[])

      const { data: produtosData, error: produtosError } =
        await supabase
          .from('produtos')
          .select(`
            id,
            empresa_id,
            categoria_id,
            marca_id,
            nome,
            slug,
            descricao,
            descricao_curta,
            sku,
            codigo_barras,
            codigo_interno,
            unidade,
            vendido_por_peso,
            vendido_por_medida,
            preco,
            preco_promocional,
            custo,
            destaque_vitrine,
            visivel_vitrine,
            ativo,
            controla_estoque,
            informacoes_adicionais,
            meta_titulo,
            meta_descricao,
            created_at,
            updated_at,
            promocao_inicio,
            promocao_fim,
            unidade_estoque_id,
            unidade_venda_id,
            unidade_compra_id,
            permite_venda_fracionada,
            permite_compra_fracionada,
            permite_consumo_fracionada
          `)
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .eq('visivel_vitrine', true)
          .order('nome')

      if (produtosError) throw produtosError

      const produtosAtivos = (produtosData || []) as Produto[]

      setProdutos(produtosAtivos)

      if (produtosAtivos.length > 0) {
        const ids = produtosAtivos.map(
          (produto) => produto.id,
        )

        const { data: fotosData, error: fotosError } =
          await supabase
            .from('catalogo_publico_fotos')
            .select(`
              foto_id,
              produto_id,
              variacao_id,
              url,
              ordem,
              principal,
              alt_text
            `)
            .in('produto_id', ids)
            .order('ordem')

        if (fotosError) throw fotosError

        setFotos((fotosData || []) as FotoProduto[])
      } else {
        setFotos([])
      }
    } catch (error) {
      console.error('Erro ao carregar página pública:', error)
      setErro(
        'Não foi possível carregar a página do negócio.',
      )
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
    const termo = busca.trim().toLowerCase()

    return produtos.filter((produto) => {
      const correspondeBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        (produto.descricao_curta || '')
          .toLowerCase()
          .includes(termo)

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
    aparencia.fonte || 'Inter, system-ui, sans-serif'

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
        if (a.principal && !b.principal) return -1
        if (!a.principal && b.principal) return 1
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

          {vitrine?.mostrar_precos !== false && (
            <div style={styles.priceArea}>
              {possuiPromocao && (
                <span
                  style={{
                    ...styles.oldPrice,
                    color: tema.textoSecundario,
                  }}
                >
                  {formatarPreco(
                    produto.preco,
                  )}
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
  empresaId={empresaId}
  onVoltar={() => setProdutoSelecionado(null)}
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

  const mensagemFechado =
    vitrine?.mensagem_fechado

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
              /*
               * O carrinho/pedido será conectado
               * aqui posteriormente.
               *
               * O WhatsApp não aparece diretamente
               * na página pública.
               */
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