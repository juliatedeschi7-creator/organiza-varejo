import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface ProdutosVitrinePageProps {
  empresaId: string
  onVoltar: () => void
}

interface Vitrine {
  id: string
  empresa_id: string
  ativo: boolean
  filial_id: string | null
}

interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  preco_promocional: number | null
  sku: string | null
  codigo_barras: string | null
  ativo: boolean
  visivel_vitrine: boolean
  destaque_vitrine: boolean
}

interface ProdutoVitrine {
  id: string
  vitrine_id: string
  produto_id: string
  nome_exibicao: string | null
  descricao_exibicao: string | null
  imagem_principal_url: string | null
  ordem: number
  destaque: boolean
  disponivel: boolean
  mostrar_preco: boolean
  mostrar_estoque: boolean
  estoque_exibido_texto: string | null
  ativo: boolean
  publicado_at: string | null
  mostrar_quantidade_estoque: boolean
}

type Filtro = 'todos' | 'publicados' | 'pausados' | 'nao-publicados'

function formatarPreco(valor: number | null) {
  if (valor === null || Number.isNaN(Number(valor))) {
    return 'Preço não informado'
  }

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function ProdutosVitrinePage({
  empresaId,
  onVoltar,
}: ProdutosVitrinePageProps) {
  const [vitrines, setVitrines] = useState<Vitrine[]>([])
  const [vitrineSelecionada, setVitrineSelecionada] =
    useState('')

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [publicacoes, setPublicacoes] = useState<ProdutoVitrine[]>([])

  const [carregando, setCarregando] = useState(true)
  const [salvandoId, setSalvandoId] = useState('')
  const [publicandoId, setPublicandoId] = useState('')

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarVitrines()
  }, [empresaId])

  useEffect(() => {
    if (vitrineSelecionada) {
      carregarDadosVitrine(vitrineSelecionada)
    }
  }, [vitrineSelecionada])

  async function carregarVitrines() {
    setCarregando(true)
    setErro('')

    try {
      const { data, error } = await supabase
        .from('vitrines')
        .select('id, empresa_id, ativo, filial_id')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('created_at', { ascending: true })

      if (error) throw error

      const lista = (data || []) as Vitrine[]

      setVitrines(lista)

      if (lista.length > 0) {
        setVitrineSelecionada(lista[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar vitrines:', error)
      setErro(
        'Não foi possível carregar as vitrines da empresa. Tente novamente.'
      )
    } finally {
      setCarregando(false)
    }
  }

  async function carregarDadosVitrine(vitrineId: string) {
    setCarregando(true)
    setErro('')
    setMensagem('')

    try {
      const [produtosResponse, publicacoesResponse] =
        await Promise.all([
          supabase
            .from('produtos')
            .select(`
              id,
              nome,
              descricao,
              preco,
              preco_promocional,
              sku,
              codigo_barras,
              ativo,
              visivel_vitrine,
              destaque_vitrine
            `)
            .eq('empresa_id', empresaId)
            .order('nome', { ascending: true }),

          supabase
            .from('vitrine_produtos')
            .select(`
              id,
              vitrine_id,
              produto_id,
              nome_exibicao,
              descricao_exibicao,
              imagem_principal_url,
              ordem,
              destaque,
              disponivel,
              mostrar_preco,
              mostrar_estoque,
              estoque_exibido_texto,
              ativo,
              publicado_at,
              mostrar_quantidade_estoque
            `)
            .eq('vitrine_id', vitrineId)
            .order('ordem', { ascending: true }),
        ])

      if (produtosResponse.error) {
        throw produtosResponse.error
      }

      if (publicacoesResponse.error) {
        throw publicacoesResponse.error
      }

      setProdutos((produtosResponse.data || []) as Produto[])
      setPublicacoes(
        (publicacoesResponse.data || []) as ProdutoVitrine[]
      )
    } catch (error) {
      console.error('Erro ao carregar produtos da vitrine:', error)
      setErro(
        'Não foi possível carregar os produtos desta vitrine.'
      )
    } finally {
      setCarregando(false)
    }
  }

  const publicacoesPorProduto = useMemo(() => {
    const mapa = new Map<string, ProdutoVitrine>()

    publicacoes.forEach((publicacao) => {
      mapa.set(publicacao.produto_id, publicacao)
    })

    return mapa
  }, [publicacoes])

  const produtosFiltrados = useMemo(() => {
    const normalizar = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .trim()

    const termo = normalizar(busca)

    return produtos.filter((produto) => {
      const publicacao = publicacoesPorProduto.get(produto.id)

      const correspondeBusca =
        !termo ||
        normalizar(produto.nome).includes(termo) ||
        normalizar(produto.sku || '').includes(termo) ||
        normalizar(produto.codigo_barras || '').includes(termo)

      let correspondeFiltro = true

      if (filtro === 'publicados') {
        correspondeFiltro = Boolean(publicacao?.ativo)
      }

      if (filtro === 'pausados') {
        correspondeFiltro = Boolean(
          publicacao && !publicacao.ativo
        )
      }

      if (filtro === 'nao-publicados') {
        correspondeFiltro = !publicacao
      }

      return correspondeBusca && correspondeFiltro
    })
  }, [produtos, publicacoesPorProduto, busca, filtro])

  async function publicarProduto(produto: Produto) {
    if (!vitrineSelecionada) return

    if (!produto.ativo) {
      setErro('Este produto está inativo no cadastro de produtos.')
      return
    }

    if (!produto.visivel_vitrine) {
      setErro(
        'Este produto está configurado como não visível na vitrine. Altere essa opção no cadastro do produto antes de publicá-lo.'
      )
      return
    }

    setPublicandoId(produto.id)
    setErro('')
    setMensagem('')

    try {
      const ordem = publicacoes.length

      const { error } = await supabase
        .from('vitrine_produtos')
        .insert({
          vitrine_id: vitrineSelecionada,
          produto_id: produto.id,
          nome_exibicao: produto.nome,
          descricao_exibicao: produto.descricao,
          ordem,
          destaque: produto.destaque_vitrine,
          disponivel: true,
          mostrar_preco: true,
          mostrar_estoque: false,
          mostrar_quantidade_estoque: false,
          ativo: true,
          publicado_at: new Date().toISOString(),
        })

      if (error) throw error

      setMensagem('Produto publicado na vitrine com sucesso.')

      await carregarDadosVitrine(vitrineSelecionada)
    } catch (error) {
      console.error('Erro ao publicar produto:', error)
      setErro(
        'Não foi possível publicar o produto. Verifique se ele já está publicado nesta vitrine.'
      )
    } finally {
      setPublicandoId('')
    }
  }

  async function atualizarPublicacao(
    publicacao: ProdutoVitrine,
    alteracoes: Partial<ProdutoVitrine>,
    mensagemSucesso: string
  ) {
    setSalvandoId(publicacao.id)
    setErro('')
    setMensagem('')

    try {
      const { error } = await supabase
        .from('vitrine_produtos')
        .update(alteracoes)
        .eq('id', publicacao.id)
        .eq('vitrine_id', vitrineSelecionada)

      if (error) throw error

      setPublicacoes((anteriores) =>
        anteriores.map((item) =>
          item.id === publicacao.id
            ? { ...item, ...alteracoes }
            : item
        )
      )

      setMensagem(mensagemSucesso)
    } catch (error) {
      console.error('Erro ao atualizar publicação:', error)
      setErro(
        'Não foi possível atualizar a publicação. Tente novamente.'
      )
    } finally {
      setSalvandoId('')
    }
  }

  function alternarPublicacao(publicacao: ProdutoVitrine) {
    const novoStatus = !publicacao.ativo

    atualizarPublicacao(
      publicacao,
      { ativo: novoStatus },
      novoStatus
        ? 'Produto reativado na vitrine.'
        : 'Produto pausado na vitrine.'
    )
  }

  function alternarDisponibilidade(publicacao: ProdutoVitrine) {
    const novaDisponibilidade = !publicacao.disponivel

    atualizarPublicacao(
      publicacao,
      { disponivel: novaDisponibilidade },
      novaDisponibilidade
        ? 'Produto marcado como disponível.'
        : 'Produto marcado como indisponível.'
    )
  }

  function alternarPreco(publicacao: ProdutoVitrine) {
    const novoValor = !publicacao.mostrar_preco

    atualizarPublicacao(
      publicacao,
      { mostrar_preco: novoValor },
      novoValor
        ? 'Preço agora aparece na vitrine.'
        : 'Preço ocultado na vitrine.'
    )
  }

  function alternarDestaque(publicacao: ProdutoVitrine) {
    const novoValor = !publicacao.destaque

    atualizarPublicacao(
      publicacao,
      { destaque: novoValor },
      novoValor
        ? 'Produto destacado na vitrine.'
        : 'Destaque removido.'
    )
  }

  const totalPublicados = publicacoes.filter(
    (item) => item.ativo
  ).length

  const totalPausados = publicacoes.filter(
    (item) => !item.ativo
  ).length

  if (carregando && vitrines.length === 0) {
    return (
      <main className="pv-loading">
        <Logo />
        <div className="pv-spinner" />
        <p>Carregando sua vitrine...</p>

        <style>{estilos}</style>
      </main>
    )
  }

  return (
    <div className="pv-page">
      <style>{estilos}</style>

      <header className="pv-header">
        <div className="pv-header-inner">
          <button
            type="button"
            className="pv-back"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            ←
          </button>

          <div className="pv-brand">
            <span>Organiza</span>
            <strong>Produtos da vitrine</strong>
          </div>
        </div>
      </header>

      <main className="pv-main">
        <section className="pv-intro">
          <span className="pv-eyebrow">Sua vitrine digital</span>
          <h1>Produtos da vitrine</h1>
          <p>
            Escolha quais produtos do seu catálogo serão exibidos
            para seus clientes.
          </p>
        </section>

        {erro && (
          <div className="pv-alert pv-error">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="pv-alert pv-success">
            {mensagem}
          </div>
        )}

        {vitrines.length === 0 ? (
          <section className="pv-empty">
            <div className="pv-empty-icon">▧</div>
            <h2>Nenhuma vitrine ativa</h2>
            <p>
              Para gerenciar os produtos publicados, sua empresa
              precisa ter uma vitrine ativa.
            </p>
            <button
              type="button"
              className="pv-secondary-button"
              onClick={onVoltar}
            >
              Voltar ao negócio
            </button>
          </section>
        ) : (
          <>
            {vitrines.length > 1 && (
              <section className="pv-vitrine-selector">
                <label htmlFor="pv-vitrine">
                  Selecione a vitrine
                </label>

                <select
                  id="pv-vitrine"
                  value={vitrineSelecionada}
                  onChange={(event) =>
                    setVitrineSelecionada(event.target.value)
                  }
                >
                  {vitrines.map((vitrine, index) => (
                    <option key={vitrine.id} value={vitrine.id}>
                      {vitrine.filial_id
                        ? `Vitrine ${index + 1}`
                        : 'Vitrine principal'}
                    </option>
                  ))}
                </select>
              </section>
            )}

            <section className="pv-stats">
              <div className="pv-stat">
                <strong>{produtos.length}</strong>
                <span>Produtos no catálogo</span>
              </div>

              <div className="pv-stat">
                <strong>{totalPublicados}</strong>
                <span>Publicados</span>
              </div>

              <div className="pv-stat">
                <strong>{totalPausados}</strong>
                <span>Pausados</span>
              </div>
            </section>

            <section className="pv-toolbar">
              <div className="pv-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Buscar produto por nome, SKU ou código..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                />
              </div>

              <div className="pv-filters">
                {(
                  [
                    ['todos', 'Todos'],
                    ['publicados', 'Publicados'],
                    ['pausados', 'Pausados'],
                    ['nao-publicados', 'Não publicados'],
                  ] as [Filtro, string][]
                ).map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    className={
                      filtro === valor
                        ? 'pv-filter active'
                        : 'pv-filter'
                    }
                    onClick={() => setFiltro(valor)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </section>

            {carregando ? (
              <div className="pv-loading-inline">
                <div className="pv-spinner" />
                <span>Atualizando produtos...</span>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <section className="pv-empty">
                <div className="pv-empty-icon">⌕</div>
                <h2>Nenhum produto encontrado</h2>
                <p>
                  Não encontramos produtos com os filtros selecionados.
                </p>
              </section>
            ) : (
              <section className="pv-list">
                {produtosFiltrados.map((produto) => {
                  const publicacao =
                    publicacoesPorProduto.get(produto.id)

                  const estaPublicado = Boolean(
                    publicacao?.ativo
                  )

                  const estaPausado = Boolean(
                    publicacao && !publicacao.ativo
                  )

                  const podePublicar =
                    produto.ativo && produto.visivel_vitrine

                  return (
                    <article
                      className="pv-product"
                      key={produto.id}
                    >
                      <div className="pv-product-info">
                        <div className="pv-product-title">
                          <h2>{produto.nome}</h2>

                          {estaPublicado && (
                            <span className="pv-status published">
                              Publicado
                            </span>
                          )}

                          {estaPausado && (
                            <span className="pv-status paused">
                              Pausado
                            </span>
                          )}

                          {!publicacao && (
                            <span className="pv-status unpublished">
                              Não publicado
                            </span>
                          )}
                        </div>

                        {produto.descricao && (
                          <p className="pv-description">
                            {produto.descricao}
                          </p>
                        )}

                        <div className="pv-product-meta">
                          <strong>
                            {formatarPreco(
                              produto.preco_promocional ??
                                produto.preco
                            )}
                          </strong>

                          {produto.sku && (
                            <span>SKU: {produto.sku}</span>
                          )}
                        </div>

                        {!produto.ativo && (
                          <p className="pv-warning">
                            Este produto está inativo no catálogo.
                          </p>
                        )}

                        {produto.ativo && !produto.visivel_vitrine && (
                          <p className="pv-warning">
                            A visibilidade deste produto está desativada
                            no cadastro.
                          </p>
                        )}
                      </div>

                      <div className="pv-product-actions">
                        {!publicacao ? (
                          <button
                            type="button"
                            className="pv-primary-button"
                            disabled={
                              !podePublicar ||
                              publicandoId === produto.id
                            }
                            onClick={() => publicarProduto(produto)}
                          >
                            {publicandoId === produto.id
                              ? 'Publicando...'
                              : 'Publicar na vitrine'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={
                                publicacao.ativo
                                  ? 'pv-secondary-button'
                                  : 'pv-primary-button'
                              }
                              disabled={salvandoId === publicacao.id}
                              onClick={() =>
                                alternarPublicacao(publicacao)
                              }
                            >
                              {salvandoId === publicacao.id
                                ? 'Salvando...'
                                : publicacao.ativo
                                  ? 'Pausar publicação'
                                  : 'Reativar publicação'}
                            </button>

                            {publicacao.ativo && (
                              <div className="pv-options">
                                <button
                                  type="button"
                                  disabled={
                                    salvandoId === publicacao.id
                                  }
                                  onClick={() =>
                                    alternarDisponibilidade(publicacao)
                                  }
                                >
                                  {publicacao.disponivel
                                    ? 'Marcar indisponível'
                                    : 'Marcar disponível'}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    salvandoId === publicacao.id
                                  }
                                  onClick={() =>
                                    alternarPreco(publicacao)
                                  }
                                >
                                  {publicacao.mostrar_preco
                                    ? 'Ocultar preço'
                                    : 'Mostrar preço'}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    salvandoId === publicacao.id
                                  }
                                  onClick={() =>
                                    alternarDestaque(publicacao)
                                  }
                                >
                                  {publicacao.destaque
                                    ? 'Remover destaque'
                                    : 'Destacar produto'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </section>
            )}

            <section className="pv-note">
              <strong>Importante sobre o estoque</strong>
              <p>
                Publicar, pausar ou alterar a disponibilidade de um
                produto nesta página não movimenta o estoque. O estoque
                continua sendo controlado pelo cadastro e pelas operações
                de venda do negócio.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

const estilos = `
  .pv-page,
  .pv-loading {
    min-height: 100vh;
    background: #f7f6f2;
    color: #242824;
    font-family: Inter, Arial, sans-serif;
  }

  .pv-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 24px;
  }

  .pv-loading p {
    color: #777;
    font-size: 14px;
  }

  .pv-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e3e9e3;
    border-top-color: #159447;
    border-radius: 50%;
    animation: pvSpin .8s linear infinite;
  }

  @keyframes pvSpin {
    to { transform: rotate(360deg); }
  }

  .pv-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(255,255,255,.96);
    border-bottom: 1px solid #e9ece7;
  }

  .pv-header-inner {
    max-width: 1080px;
    min-height: 66px;
    margin: 0 auto;
    padding: 0 22px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .pv-back {
    width: 38px;
    height: 38px;
    border: 1px solid #e4e8e2;
    border-radius: 12px;
    background: white;
    color: #333;
    font-size: 23px;
    cursor: pointer;
  }

  .pv-brand {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pv-brand span {
    color: #159447;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .pv-brand strong {
    font-size: 15px;
    font-weight: 700;
  }

  .pv-main {
    width: min(100% - 36px, 980px);
    margin: 0 auto;
    padding: 34px 0 64px;
  }

  .pv-intro {
    margin-bottom: 26px;
  }

  .pv-eyebrow {
    color: #159447;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .pv-intro h1 {
    margin: 8px 0;
    font-size: clamp(26px, 5vw, 34px);
    letter-spacing: -.04em;
  }

  .pv-intro p {
    max-width: 580px;
    margin: 0;
    color: #707970;
    font-size: 14px;
    line-height: 1.6;
  }

  .pv-alert {
    padding: 13px 15px;
    margin: 16px 0;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
  }

  .pv-error {
    background: #fff0ed;
    color: #a33424;
    border: 1px solid #f3d1ca;
  }

  .pv-success {
    background: #eaf7ef;
    color: #176b39;
    border: 1px solid #cce9d5;
  }

  .pv-vitrine-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
    margin-bottom: 20px;
  }

  .pv-vitrine-selector label {
    font-size: 12px;
    font-weight: 700;
  }

  .pv-vitrine-selector select {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid #dfe5dd;
    border-radius: 10px;
    background: white;
    color: #242824;
    font-size: 14px;
  }

  .pv-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .pv-stat {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 17px;
    background: white;
    border: 1px solid #e8ece6;
    border-radius: 14px;
  }

  .pv-stat strong {
    font-size: 24px;
    letter-spacing: -.04em;
  }

  .pv-stat span {
    color: #7b837b;
    font-size: 11px;
  }

  .pv-toolbar {
    margin-bottom: 18px;
  }

  .pv-search {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 14px;
    background: white;
    border: 1px solid #e1e7df;
    border-radius: 12px;
  }

  .pv-search span {
    color: #7d887e;
    font-size: 23px;
  }

  .pv-search input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #242824;
    font-size: 14px;
  }

  .pv-filters {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 13px 0 3px;
  }

  .pv-filter {
    flex: 0 0 auto;
    padding: 8px 13px;
    border: 1px solid #e0e6de;
    border-radius: 30px;
    background: white;
    color: #667066;
    font-size: 12px;
    cursor: pointer;
  }

  .pv-filter.active {
    border-color: #159447;
    background: #eaf7ef;
    color: #126c36;
    font-weight: 700;
  }

  .pv-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pv-product {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 22px;
    padding: 19px;
    background: white;
    border: 1px solid #e8ece6;
    border-radius: 15px;
  }

  .pv-product-info {
    flex: 1;
    min-width: 0;
  }

  .pv-product-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px;
  }

  .pv-product-title h2 {
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
  }

  .pv-status {
    padding: 4px 8px;
    border-radius: 30px;
    font-size: 10px;
    font-weight: 700;
  }

  .pv-status.published {
    background: #eaf7ef;
    color: #176b39;
  }

  .pv-status.paused {
    background: #fff4df;
    color: #93600c;
  }

  .pv-status.unpublished {
    background: #f0f1ee;
    color: #6d756d;
  }

  .pv-description {
    margin: 8px 0;
    color: #7a827a;
    font-size: 12px;
    line-height: 1.5;
  }

  .pv-product-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }

  .pv-product-meta strong {
    color: #176b39;
    font-size: 14px;
  }

  .pv-product-meta span {
    color: #899089;
    font-size: 11px;
  }

  .pv-warning {
    margin: 10px 0 0;
    color: #a66c13;
    font-size: 11px;
    line-height: 1.5;
  }

  .pv-product-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 9px;
    min-width: 180px;
  }

  .pv-primary-button,
  .pv-secondary-button {
    min-height: 38px;
    padding: 0 13px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .pv-primary-button {
    border: 1px solid #159447;
    background: #159447;
    color: white;
  }

  .pv-secondary-button {
    border: 1px solid #dce4db;
    background: white;
    color: #465046;
  }

  .pv-primary-button:disabled,
  .pv-secondary-button:disabled,
  .pv-options button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .pv-options {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .pv-options button {
    padding: 6px 8px;
    border: 1px solid #e5e9e3;
    border-radius: 7px;
    background: #fafbf9;
    color: #667066;
    font-size: 10px;
    cursor: pointer;
  }

  .pv-empty {
    padding: 42px 22px;
    text-align: center;
    background: white;
    border: 1px solid #e8ece6;
    border-radius: 16px;
  }

  .pv-empty-icon {
    color: #159447;
    font-size: 34px;
  }

  .pv-empty h2 {
    margin: 12px 0 7px;
    font-size: 18px;
  }

  .pv-empty p {
    max-width: 420px;
    margin: 0 auto 18px;
    color: #7a827a;
    font-size: 13px;
    line-height: 1.6;
  }

  .pv-loading-inline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: #788078;
    font-size: 13px;
  }

  .pv-note {
    margin-top: 24px;
    padding: 17px;
    background: #eef5ee;
    border: 1px solid #dcebdd;
    border-radius: 13px;
  }

  .pv-note strong {
    color: #27623a;
    font-size: 12px;
  }

  .pv-note p {
    margin: 6px 0 0;
    color: #647264;
    font-size: 12px;
    line-height: 1.6;
  }

  @media (max-width: 650px) {
    .pv-main {
      width: min(100% - 26px, 980px);
      padding-top: 25px;
    }

    .pv-header-inner {
      padding: 0 13px;
    }

    .pv-stats {
      gap: 7px;
    }

    .pv-stat {
      padding: 13px 10px;
    }

    .pv-stat strong {
      font-size: 21px;
    }

    .pv-stat span {
      font-size: 10px;
      line-height: 1.35;
    }

    .pv-product {
      flex-direction: column;
      gap: 15px;
      padding: 15px;
    }

    .pv-product-actions {
      width: 100%;
      min-width: 0;
      align-items: stretch;
    }

    .pv-product-actions > button {
      width: 100%;
    }

    .pv-options {
      justify-content: flex-start;
    }
  }
`