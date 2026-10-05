import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface ProdutosPageProps {
  empresaId: string
  onVoltar: () => void
}

interface Produto {
  id: string
  empresa_id: string
  categoria_id: string | null
  marca_id: string | null
  nome: string
  slug: string
  descricao: string | null
  preco: number
  preco_promocional: number | null
  sku: string | null
  codigo_barras: string | null
  unidade: string
  vendido_por_peso: boolean
  vendido_por_medida: boolean
  destaque_vitrine: boolean
  visivel_vitrine: boolean
  ativo: boolean
  controla_estoque: boolean
  created_at: string
}

interface Categoria {
  id: string
  nome: string
}

interface Marca {
  id: string
  nome: string
}

interface FormularioProduto {
  nome: string
  descricao: string
  categoria_id: string
  marca_id: string
  preco: string
  preco_promocional: string
  sku: string
  codigo_barras: string
  unidade: string
  vendido_por_peso: boolean
  vendido_por_medida: boolean
  destaque_vitrine: boolean
  visivel_vitrine: boolean
  ativo: boolean
  controla_estoque: boolean
}

const formularioInicial: FormularioProduto = {
  nome: '',
  descricao: '',
  categoria_id: '',
  marca_id: '',
  preco: '',
  preco_promocional: '',
  sku: '',
  codigo_barras: '',
  unidade: 'un',
  vendido_por_peso: false,
  vendido_por_medida: false,
  destaque_vitrine: false,
  visivel_vitrine: true,
  ativo: true,
  controla_estoque: true,
}

function gerarSlug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatarPreco(valor: number | null) {
  if (valor === null || Number.isNaN(valor)) {
    return 'R$ 0,00'
  }

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function converterNumero(valor: string) {
  if (!valor.trim()) return 0

  const normalizado = valor
    .replace(/\./g, '')
    .replace(',', '.')

  const numero = Number(normalizado)

  return Number.isFinite(numero) ? numero : 0
}

export default function ProdutosPage({
  empresaId,
  onVoltar,
}: ProdutosPageProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<
    'todos' | 'ativos' | 'inativos'
  >('todos')

  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] =
    useState<Produto | null>(null)

  const [formulario, setFormulario] =
    useState<FormularioProduto>(formularioInicial)

  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarDados()
  }, [empresaId])

  async function carregarDados() {
    setCarregando(true)
    setErro('')

    try {
      const [
        produtosResponse,
        categoriasResponse,
        marcasResponse,
      ] = await Promise.all([
        supabase
          .from('produtos')
          .select(`
            id,
            empresa_id,
            categoria_id,
            marca_id,
            nome,
            slug,
            descricao,
            preco,
            preco_promocional,
            sku,
            codigo_barras,
            unidade,
            vendido_por_peso,
            vendido_por_medida,
            destaque_vitrine,
            visivel_vitrine,
            ativo,
            controla_estoque,
            created_at
          `)
          .eq('empresa_id', empresaId)
          .order('nome', { ascending: true }),

        supabase
          .from('categorias_produto')
          .select('id, nome')
          .eq('empresa_id', empresaId)
          .eq('ativa', true)
          .order('nome', { ascending: true }),

        supabase
          .from('marcas')
          .select('id, nome')
          .eq('empresa_id', empresaId)
          .eq('ativa', true)
          .order('nome', { ascending: true }),
      ])

      if (produtosResponse.error) {
        throw produtosResponse.error
      }

      if (categoriasResponse.error) {
        throw categoriasResponse.error
      }

      if (marcasResponse.error) {
        throw marcasResponse.error
      }

      setProdutos((produtosResponse.data || []) as Produto[])
      setCategorias((categoriasResponse.data || []) as Categoria[])
      setMarcas((marcasResponse.data || []) as Marca[])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setErro(
        'Não foi possível carregar os produtos. Tente novamente.'
      )
    } finally {
      setCarregando(false)
    }
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return produtos.filter((produto) => {
      const correspondeBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.sku?.toLowerCase().includes(termo) ||
        produto.codigo_barras?.toLowerCase().includes(termo)

      const correspondeStatus =
        filtroStatus === 'todos' ||
        (filtroStatus === 'ativos' && produto.ativo) ||
        (filtroStatus === 'inativos' && !produto.ativo)

      return correspondeBusca && correspondeStatus
    })
  }, [produtos, busca, filtroStatus])

  function abrirNovoProduto() {
    setProdutoEditando(null)
    setFormulario(formularioInicial)
    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function abrirEdicao(produto: Produto) {
    setProdutoEditando(produto)

    setFormulario({
      nome: produto.nome,
      descricao: produto.descricao || '',
      categoria_id: produto.categoria_id || '',
      marca_id: produto.marca_id || '',
      preco:
        produto.preco !== null
          ? String(produto.preco).replace('.', ',')
          : '',
      preco_promocional:
        produto.preco_promocional !== null
          ? String(produto.preco_promocional).replace('.', ',')
          : '',
      sku: produto.sku || '',
      codigo_barras: produto.codigo_barras || '',
      unidade: produto.unidade || 'un',
      vendido_por_peso: produto.vendido_por_peso,
      vendido_por_medida: produto.vendido_por_medida,
      destaque_vitrine: produto.destaque_vitrine,
      visivel_vitrine: produto.visivel_vitrine,
      ativo: produto.ativo,
      controla_estoque: produto.controla_estoque,
    })

    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return

    setModalAberto(false)
    setProdutoEditando(null)
    setFormulario(formularioInicial)
    setErro('')
  }

  async function gerarSlugUnico(nome: string, idAtual?: string) {
    const slugBase = gerarSlug(nome) || `produto-${Date.now()}`

    let slug = slugBase
    let tentativa = 2

    while (tentativa <= 20) {
      const { data, error } = await supabase
        .from('produtos')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data || data.id === idAtual) {
        return slug
      }

      slug = `${slugBase}-${tentativa}`
      tentativa += 1
    }

    return `${slugBase}-${Date.now()}`
  }

  async function salvarProduto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nome = formulario.nome.trim()

    if (!nome) {
      setErro('Informe o nome do produto.')
      return
    }

    const preco = converterNumero(formulario.preco)

    if (preco < 0) {
      setErro('O preço não pode ser negativo.')
      return
    }

    const precoPromocional =
      formulario.preco_promocional.trim()
        ? converterNumero(formulario.preco_promocional)
        : null

    if (
      precoPromocional !== null &&
      precoPromocional < 0
    ) {
      setErro('O preço promocional não pode ser negativo.')
      return
    }

    if (
      precoPromocional !== null &&
      precoPromocional > preco
    ) {
      setErro(
        'O preço promocional não pode ser maior que o preço normal.'
      )
      return
    }

    setSalvando(true)
    setErro('')
    setMensagem('')

    try {
      const slug = await gerarSlugUnico(
        nome,
        produtoEditando?.id
      )

      const dados = {
        empresa_id: empresaId,
        categoria_id:
          formulario.categoria_id || null,
        marca_id:
          formulario.marca_id || null,
        nome,
        slug,
        descricao:
          formulario.descricao.trim() || null,
        preco,
        preco_promocional: precoPromocional,
        sku: formulario.sku.trim() || null,
        codigo_barras:
          formulario.codigo_barras.trim() || null,
        unidade: formulario.unidade.trim() || 'un',
        vendido_por_peso:
          formulario.vendido_por_peso,
        vendido_por_medida:
          formulario.vendido_por_medida,
        destaque_vitrine:
          formulario.destaque_vitrine,
        visivel_vitrine:
          formulario.visivel_vitrine,
        ativo: formulario.ativo,
        controla_estoque:
          formulario.controla_estoque,
      }

      if (produtoEditando) {
        const { error } = await supabase
          .from('produtos')
          .update(dados)
          .eq('id', produtoEditando.id)
          .eq('empresa_id', empresaId)

        if (error) {
          throw error
        }

        setMensagem('Produto atualizado com sucesso.')
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert(dados)

        if (error) {
          throw error
        }

        setMensagem('Produto cadastrado com sucesso.')
      }

      await carregarDados()

      setModalAberto(false)
      setProdutoEditando(null)
      setFormulario(formularioInicial)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)

      setErro(
        'Não foi possível salvar o produto. Verifique os dados e tente novamente.'
      )
    } finally {
      setSalvando(false)
    }
  }

  async function alternarStatus(produto: Produto) {
    setErro('')
    setMensagem('')

    const novoStatus = !produto.ativo

    const { error } = await supabase
      .from('produtos')
      .update({
        ativo: novoStatus,
      })
      .eq('id', produto.id)
      .eq('empresa_id', empresaId)

    if (error) {
      console.error('Erro ao alterar status:', error)
      setErro(
        'Não foi possível alterar o status do produto.'
      )
      return
    }

    setProdutos((anteriores) =>
      anteriores.map((item) =>
        item.id === produto.id
          ? {
              ...item,
              ativo: novoStatus,
            }
          : item
      )
    )

    setMensagem(
      novoStatus
        ? 'Produto ativado.'
        : 'Produto desativado.'
    )
  }

  function categoriaNome(id: string | null) {
    if (!id) return ''

    return (
      categorias.find((categoria) => categoria.id === id)
        ?.nome || ''
    )
  }

  function marcaNome(id: string | null) {
    if (!id) return ''

    return (
      marcas.find((marca) => marca.id === id)?.nome || ''
    )
  }

  function atualizarCampo<K extends keyof FormularioProduto>(
    campo: K,
    valor: FormularioProduto[K]
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }))
  }

  if (carregando) {
    return (
      <div className="produtos-loading">
        <Logo />
        <div className="produtos-spinner" />
        <p>Carregando seus produtos...</p>

        <style>{`
          .produtos-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 24px;
            background: #f7f7f5;
            color: #222;
            font-family: Arial, sans-serif;
          }

          .produtos-loading p {
            margin: 0;
            color: #777;
            font-size: 14px;
          }

          .produtos-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #e7e7e4;
            border-top-color: #222;
            border-radius: 50%;
            animation: produtosSpin .8s linear infinite;
          }

          @keyframes produtosSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="produtos-page">
      <header className="produtos-topbar">
        <div className="produtos-topbar-inner">
          <button
            type="button"
            className="produtos-voltar"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            ←
          </button>

          <div className="produtos-topbar-title">
            <span>Organiza</span>
            <strong>Produtos</strong>
          </div>

          <button
            type="button"
            className="produtos-novo-top"
            onClick={abrirNovoProduto}
          >
            + Novo
          </button>
        </div>
      </header>

      <main className="produtos-main">
        <section className="produtos-heading">
          <div>
            <span className="produtos-eyebrow">
              Seu catálogo
            </span>

            <h1>Produtos</h1>

            <p>
              Cadastre e organize tudo o que seu negócio
              oferece.
            </p>
          </div>

          <button
            type="button"
            className="produtos-primary-button"
            onClick={abrirNovoProduto}
          >
            + Cadastrar produto
          </button>
        </section>

        {erro && !modalAberto && (
          <div className="produtos-alerta produtos-alerta-erro">
            {erro}
          </div>
        )}

        {mensagem && !modalAberto && (
          <div className="produtos-alerta produtos-alerta-sucesso">
            {mensagem}
          </div>
        )}

        <section className="produtos-resumo">
          <div className="produtos-resumo-card">
            <span>Total</span>
            <strong>{produtos.length}</strong>
          </div>

          <div className="produtos-resumo-card">
            <span>Ativos</span>
            <strong>
              {produtos.filter((produto) => produto.ativo).length}
            </strong>
          </div>

          <div className="produtos-resumo-card">
            <span>Na vitrine</span>
            <strong>
              {
                produtos.filter(
                  (produto) =>
                    produto.ativo &&
                    produto.visivel_vitrine
                ).length
              }
            </strong>
          </div>
        </section>

        <section className="produtos-filtros">
          <div className="produtos-busca">
            <span>⌕</span>

            <input
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="Buscar produto, código ou SKU"
            />
          </div>

          <div className="produtos-status-filtros">
            <button
              type="button"
              className={
                filtroStatus === 'todos'
                  ? 'produto-filtro ativo'
                  : 'produto-filtro'
              }
              onClick={() => setFiltroStatus('todos')}
            >
              Todos
            </button>

            <button
              type="button"
              className={
                filtroStatus === 'ativos'
                  ? 'produto-filtro ativo'
                  : 'produto-filtro'
              }
              onClick={() => setFiltroStatus('ativos')}
            >
              Ativos
            </button>

            <button
              type="button"
              className={
                filtroStatus === 'inativos'
                  ? 'produto-filtro ativo'
                  : 'produto-filtro'
              }
              onClick={() => setFiltroStatus('inativos')}
            >
              Inativos
            </button>
          </div>
        </section>

        {produtosFiltrados.length === 0 ? (
          <section className="produtos-vazio">
            <div className="produtos-vazio-icon">▦</div>

            <h2>
              {produtos.length === 0
                ? 'Seu catálogo começa aqui'
                : 'Nenhum produto encontrado'}
            </h2>

            <p>
              {produtos.length === 0
                ? 'Cadastre seu primeiro produto para começar a montar sua vitrine.'
                : 'Tente mudar a busca ou o filtro selecionado.'}
            </p>

            {produtos.length === 0 && (
              <button
                type="button"
                className="produtos-primary-button"
                onClick={abrirNovoProduto}
              >
                Cadastrar primeiro produto
              </button>
            )}
          </section>
        ) : (
          <section className="produtos-lista">
            {produtosFiltrados.map((produto) => (
              <article
                key={produto.id}
                className={
                  produto.ativo
                    ? 'produto-card'
                    : 'produto-card produto-card-inativo'
                }
              >
                <div className="produto-card-principal">
                  <div className="produto-placeholder">
                    {produto.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="produto-info">
                    <div className="produto-titulo-linha">
                      <h2>{produto.nome}</h2>

                      {!produto.ativo && (
                        <span className="produto-status-inativo">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="produto-meta">
                      {categoriaNome(
                        produto.categoria_id
                      ) && (
                        <span>
                          {categoriaNome(
                            produto.categoria_id
                          )}
                        </span>
                      )}

                      {marcaNome(produto.marca_id) && (
                        <span>
                          {marcaNome(produto.marca_id)}
                        </span>
                      )}

                      {produto.sku && (
                        <span>SKU: {produto.sku}</span>
                      )}
                    </div>

                    <div className="produto-preco">
                      {produto.preco_promocional !== null ? (
                        <>
                          <strong>
                            {formatarPreco(
                              produto.preco_promocional
                            )}
                          </strong>

                          <span>
                            {formatarPreco(produto.preco)}
                          </span>
                        </>
                      ) : (
                        <strong>
                          {formatarPreco(produto.preco)}
                        </strong>
                      )}

                      <small>
                        / {produto.unidade || 'un'}
                      </small>
                    </div>

                    <div className="produto-badges">
                      {produto.vendido_por_peso && (
                        <span>Por peso</span>
                      )}

                      {produto.vendido_por_medida && (
                        <span>Por medida</span>
                      )}

                      {produto.destaque_vitrine && (
                        <span>Destaque</span>
                      )}

                      {produto.visivel_vitrine && (
                        <span>Vitrine</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="produto-card-acoes">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(produto)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      alternarStatus(produto)
                    }
                  >
                    {produto.ativo
                      ? 'Desativar'
                      : 'Ativar'}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {modalAberto && (
        <div
          className="produto-modal-overlay"
          onClick={fecharModal}
        >
          <div
            className="produto-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="produto-modal-header">
              <div>
                <span className="produtos-eyebrow">
                  {produtoEditando
                    ? 'Editar produto'
                    : 'Novo produto'}
                </span>

                <h2>
                  {produtoEditando
                    ? 'Atualize as informações'
                    : 'Cadastre um produto'}
                </h2>
              </div>

              <button
                type="button"
                className="produto-modal-fechar"
                onClick={fecharModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {erro && (
              <div className="produtos-alerta produtos-alerta-erro">
                {erro}
              </div>
            )}

            <form
              className="produto-form"
              onSubmit={salvarProduto}
            >
              <div className="produto-form-section">
                <div className="produto-form-section-title">
                  <strong>Informações principais</strong>
                  <span>O básico para identificar o produto</span>
                </div>

                <label>
                  Nome do produto
                  <input
                    type="text"
                    value={formulario.nome}
                    onChange={(event) =>
                      atualizarCampo(
                        'nome',
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Camiseta básica"
                    required
                  />
                </label>

                <label>
                  Descrição
                  <textarea
                    value={formulario.descricao}
                    onChange={(event) =>
                      atualizarCampo(
                        'descricao',
                        event.target.value
                      )
                    }
                    placeholder="Descreva o produto para seus clientes"
                    rows={4}
                  />
                </label>

                <div className="produto-form-grid">
                  <label>
                    Categoria
                    <select
                      value={formulario.categoria_id}
                      onChange={(event) =>
                        atualizarCampo(
                          'categoria_id',
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Sem categoria
                      </option>

                      {categorias.map((categoria) => (
                        <option
                          key={categoria.id}
                          value={categoria.id}
                        >
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Marca
                    <select
                      value={formulario.marca_id}
                      onChange={(event) =>
                        atualizarCampo(
                          'marca_id',
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Sem marca
                      </option>

                      {marcas.map((marca) => (
                        <option
                          key={marca.id}
                          value={marca.id}
                        >
                          {marca.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="produto-form-section">
                <div className="produto-form-section-title">
                  <strong>Preço e identificação</strong>
                  <span>
                    Informações usadas nas vendas e na vitrine
                  </span>
                </div>

                <div className="produto-form-grid">
                  <label>
                    Preço
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formulario.preco}
                      onChange={(event) =>
                        atualizarCampo(
                          'preco',
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                      required
                    />
                  </label>

                  <label>
                    Preço promocional
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        formulario.preco_promocional
                      }
                      onChange={(event) =>
                        atualizarCampo(
                          'preco_promocional',
                          event.target.value
                        )
                      }
                      placeholder="Opcional"
                    />
                  </label>
                </div>

                <div className="produto-form-grid">
                  <label>
                    Unidade de venda
                    <input
                      type="text"
                      value={formulario.unidade}
                      onChange={(event) =>
                        atualizarCampo(
                          'unidade',
                          event.target.value
                        )
                      }
                      placeholder="un"
                    />
                  </label>

                  <label>
                    SKU
                    <input
                      type="text"
                      value={formulario.sku}
                      onChange={(event) =>
                        atualizarCampo(
                          'sku',
                          event.target.value
                        )
                      }
                      placeholder="Opcional"
                    />
                  </label>
                </div>

                <label>
                  Código de barras
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      formulario.codigo_barras
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'codigo_barras',
                        event.target.value
                      )
                    }
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="produto-form-section">
                <div className="produto-form-section-title">
                  <strong>Como o produto funciona</strong>
                  <span>
                    Deixamos preparado para diferentes tipos de varejo
                  </span>
                </div>

                <label className="produto-switch-row">
                  <span>
                    <strong>Vendido por peso</strong>
                    <small>
                      Ex.: frutas, carnes, frios e produtos a granel
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      formulario.vendido_por_peso
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'vendido_por_peso',
                        event.target.checked
                      )
                    }
                  />
                </label>

                <label className="produto-switch-row">
                  <span>
                    <strong>Vendido por medida</strong>
                    <small>
                      Ex.: metros, litros ou outras medidas
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      formulario.vendido_por_medida
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'vendido_por_medida',
                        event.target.checked
                      )
                    }
                  />
                </label>

                <label className="produto-switch-row">
                  <span>
                    <strong>Controlar estoque</strong>
                    <small>
                      O produto participa do controle de estoque
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      formulario.controla_estoque
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'controla_estoque',
                        event.target.checked
                      )
                    }
                  />
                </label>
              </div>

              <div className="produto-form-section">
                <div className="produto-form-section-title">
                  <strong>Vitrine</strong>
                  <span>
                    Defina como o produto aparece para seus clientes
                  </span>
                </div>

                <label className="produto-switch-row">
                  <span>
                    <strong>Mostrar na vitrine</strong>
                    <small>
                      Permite que o produto apareça no catálogo público
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      formulario.visivel_vitrine
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'visivel_vitrine',
                        event.target.checked
                      )
                    }
                  />
                </label>

                <label className="produto-switch-row">
                  <span>
                    <strong>Destacar na vitrine</strong>
                    <small>
                      Produto poderá aparecer entre os destaques
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      formulario.destaque_vitrine
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'destaque_vitrine',
                        event.target.checked
                      )
                    }
                  />
                </label>

                <label className="produto-switch-row">
                  <span>
                    <strong>Produto ativo</strong>
                    <small>
                      Produtos inativos não ficam disponíveis para venda
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(event) =>
                      atualizarCampo(
                        'ativo',
                        event.target.checked
                      )
                    }
                  />
                </label>
              </div>

              <div className="produto-form-acoes">
                <button
                  type="button"
                  className="produto-cancelar"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="produtos-primary-button"
                  disabled={salvando}
                >
                  {salvando
                    ? 'Salvando...'
                    : produtoEditando
                      ? 'Salvar alterações'
                      : 'Cadastrar produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .produtos-page {
          min-height: 100vh;
          padding-bottom: 40px;
          background: #f7f7f5;
          color: #222;
          font-family: Arial, sans-serif;
        }

        .produtos-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(255, 255, 255, .96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e8e8e5;
        }

        .produtos-topbar-inner {
          width: 100%;
          max-width: 1180px;
          min-height: 72px;
          margin: 0 auto;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .produtos-voltar,
        .produtos-novo-top {
          border: 1px solid #e4e4e1;
          background: #fff;
          color: #222;
          cursor: pointer;
          border-radius: 12px;
          min-width: 44px;
          height: 44px;
          font-weight: 700;
        }

        .produtos-voltar {
          font-size: 20px;
        }

        .produtos-novo-top {
          padding: 0 15px;
          margin-left: auto;
        }

        .produtos-topbar-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .produtos-topbar-title span {
          color: #999;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-weight: 800;
        }

        .produtos-topbar-title strong {
          font-size: 16px;
        }

        .produtos-main {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 30px 20px 60px;
        }

        .produtos-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 24px;
        }

        .produtos-eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #999;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .produtos-heading h1 {
          margin: 0;
          font-size: clamp(30px, 5vw, 42px);
          letter-spacing: -1px;
        }

        .produtos-heading p {
          margin: 9px 0 0;
          color: #777;
          font-size: 14px;
        }

        .produtos-primary-button {
          border: 0;
          border-radius: 14px;
          padding: 13px 18px;
          background: #222;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .produtos-primary-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .produtos-alerta {
          margin-bottom: 16px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.4;
        }

        .produtos-alerta-erro {
          background: #fff0f0;
          border: 1px solid #f0d2d2;
          color: #9b3333;
        }

        .produtos-alerta-sucesso {
          background: #eef9f1;
          border: 1px solid #d4ead8;
          color: #347343;
        }

        .produtos-resumo {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .produtos-resumo-card {
          padding: 18px;
          background: #fff;
          border: 1px solid #e7e7e4;
          border-radius: 18px;
        }

        .produtos-resumo-card span {
          display: block;
          color: #999;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .produtos-resumo-card strong {
          font-size: 25px;
        }

        .produtos-filtros {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .produtos-busca {
          min-width: 0;
          flex: 1;
          height: 48px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 15px;
          background: #fff;
          border: 1px solid #e7e7e4;
          border-radius: 15px;
        }

        .produtos-busca span {
          color: #999;
          font-size: 21px;
        }

        .produtos-busca input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14px;
          color: #222;
        }

        .produtos-status-filtros {
          display: flex;
          gap: 5px;
          padding: 4px;
          background: #ededeb;
          border-radius: 14px;
        }

        .produto-filtro {
          border: 0;
          background: transparent;
          color: #888;
          padding: 9px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .produto-filtro.ativo {
          background: #fff;
          color: #222;
          box-shadow: 0 2px 7px rgba(0,0,0,.05);
        }

        .produtos-lista {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .produto-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px;
          background: #fff;
          border: 1px solid #e7e7e4;
          border-radius: 20px;
        }

        .produto-card-inativo {
          opacity: .65;
        }

        .produto-card-principal {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .produto-placeholder {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: #f0f0ed;
          color: #777;
          font-size: 22px;
          font-weight: 800;
        }

        .produto-info {
          min-width: 0;
        }

        .produto-titulo-linha {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .produto-titulo-linha h2 {
          margin: 0;
          font-size: 16px;
        }

        .produto-status-inativo {
          padding: 4px 7px;
          border-radius: 999px;
          background: #f3eeee;
          color: #a66;
          font-size: 10px;
          font-weight: 700;
        }

        .produto-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 10px;
          margin-top: 6px;
        }

        .produto-meta span {
          color: #999;
          font-size: 11px;
        }

        .produto-preco {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 8px;
        }

        .produto-preco strong {
          font-size: 15px;
        }

        .produto-preco > span {
          color: #aaa;
          font-size: 11px;
          text-decoration: line-through;
        }

        .produto-preco small {
          color: #aaa;
          font-size: 10px;
        }

        .produto-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 7px;
        }

        .produto-badges span {
          padding: 4px 7px;
          border-radius: 999px;
          background: #f5f5f2;
          color: #777;
          font-size: 10px;
          font-weight: 700;
        }

        .produto-card-acoes {
          display: flex;
          gap: 7px;
          flex-shrink: 0;
        }

        .produto-card-acoes button {
          border: 1px solid #e1e1de;
          border-radius: 11px;
          background: #fff;
          color: #333;
          padding: 9px 11px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .produtos-vazio {
          padding: 55px 24px;
          text-align: center;
          background: #fff;
          border: 1px solid #e7e7e4;
          border-radius: 24px;
        }

        .produtos-vazio-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: #f0f0ed;
          font-size: 25px;
        }

        .produtos-vazio h2 {
          margin: 0;
          font-size: 21px;
        }

        .produtos-vazio p {
          max-width: 440px;
          margin: 8px auto 20px;
          color: #888;
          line-height: 1.5;
          font-size: 13px;
        }

        .produto-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 30px 18px;
          background: rgba(0,0,0,.42);
          overflow-y: auto;
        }

        .produto-modal {
          width: min(680px, 100%);
          margin: auto 0;
          background: #fff;
          border-radius: 24px;
          padding: 25px;
          box-shadow: 0 25px 80px rgba(0,0,0,.2);
        }

        .produto-modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .produto-modal-header h2 {
          margin: 0;
          font-size: 23px;
        }

        .produto-modal-fechar {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border: 1px solid #e4e4e1;
          border-radius: 12px;
          background: #fff;
          color: #222;
          font-size: 23px;
          cursor: pointer;
        }

        .produto-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .produto-form-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eeeeeb;
        }

        .produto-form-section-title {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 2px;
        }

        .produto-form-section-title strong {
          font-size: 14px;
        }

        .produto-form-section-title span {
          color: #999;
          font-size: 11px;
        }

        .produto-form label:not(.produto-switch-row) {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #555;
          font-size: 12px;
          font-weight: 700;
        }

        .produto-form input:not([type="checkbox"]),
        .produto-form textarea,
        .produto-form select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfdfdc;
          border-radius: 12px;
          outline: 0;
          background: #fff;
          color: #222;
          padding: 12px;
          font: inherit;
          font-size: 13px;
        }

        .produto-form textarea {
          resize: vertical;
          min-height: 90px;
        }

        .produto-form input:not([type="checkbox"]):focus,
        .produto-form textarea:focus,
        .produto-form select:focus {
          border-color: #999;
        }

        .produto-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .produto-switch-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 12px 0;
          cursor: pointer;
        }

        .produto-switch-row span {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .produto-switch-row strong {
          color: #333;
          font-size: 13px;
        }

        .produto-switch-row small {
          color: #999;
          font-size: 11px;
          line-height: 1.4;
        }

        .produto-switch-row input[type="checkbox"] {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          accent-color: #222;
        }

        .produto-form-acoes {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .produto-cancelar {
          border: 1px solid #dfdfdc;
          border-radius: 14px;
          padding: 13px 18px;
          background: #fff;
          color: #444;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 760px) {
          .produtos-main {
            padding: 22px 14px 40px;
          }

          .produtos-heading {
            align-items: stretch;
            flex-direction: column;
          }

          .produtos-heading .produtos-primary-button {
            width: 100%;
          }

          .produtos-resumo {
            gap: 7px;
          }

          .produtos-resumo-card {
            padding: 13px;
          }

          .produtos-resumo-card strong {
            font-size: 21px;
          }

          .produtos-filtros {
            flex-direction: column;
            align-items: stretch;
          }

          .produtos-status-filtros {
            width: fit-content;
          }

          .produto-card {
            align-items: stretch;
            flex-direction: column;
          }

          .produto-card-acoes {
            border-top: 1px solid #eeeeeb;
            padding-top: 12px;
          }

          .produto-card-acoes button {
            flex: 1;
          }
        }

        @media (max-width: 520px) {
          .produtos-topbar-inner {
            padding: 10px 14px;
          }

          .produtos-novo-top {
            font-size: 11px;
            padding: 0 11px;
          }

          .produtos-heading h1 {
            font-size: 32px;
          }

          .produto-form-grid {
            grid-template-columns: 1fr;
          }

          .produto-modal {
            padding: 20px 16px;
            border-radius: 20px;
          }

          .produto-form-acoes {
            flex-direction: column-reverse;
          }

          .produto-form-acoes button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}