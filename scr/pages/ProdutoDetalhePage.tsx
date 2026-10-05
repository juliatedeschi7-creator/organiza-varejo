import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface ProdutoDetalhePageProps {
  empresaId: string
  produtoId: string
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
  descricao_curta: string | null
  preco: number
  preco_promocional: number | null
  unidade: string
  vendido_por_peso: boolean
  vendido_por_medida: boolean
  destaque_vitrine: boolean
  visivel_vitrine: boolean
  ativo: boolean
  controla_estoque: boolean
}

interface Foto {
  foto_id: string
  produto_id: string
  variacao_id: string | null
  url: string
  ordem: number
  principal: boolean
  alt_text: string | null
}

interface Categoria {
  categoria_id: string
  nome: string
}

interface Marca {
  id: string
  nome: string
}

interface Variacao {
  id: string
  produto_id: string
  nome: string | null
  sku: string | null
  preco: number | null
  preco_promocional: number | null
  peso: number | null
  imagem_url: string | null
  ativo: boolean
  disponivel_vitrine: boolean
}

interface OpcaoGrupo {
  id: string
  produto_id: string
  nome: string
  obrigatorio: boolean
  minimo_selecoes: number
  maximo_selecoes: number
  permitir_repeticao: boolean
  ordem: number
  ativo: boolean
}

interface Opcao {
  id: string
  grupo_id: string
  nome: string
  descricao: string | null
  preco_adicional: number
  ativo: boolean
  disponivel: boolean
  ordem: number
  imagem_url: string | null
  quantidade_maxima: number
}

function formatarPreco(
  valor: number | null | undefined
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return ''
  }

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function ProdutoDetalhePage({
  empresaId,
  produtoId,
  onVoltar,
}: ProdutoDetalhePageProps) {
  const [produto, setProduto] =
    useState<Produto | null>(null)

  const [fotos, setFotos] =
    useState<Foto[]>([])

  const [categoria, setCategoria] =
    useState<Categoria | null>(null)

  const [marca, setMarca] =
    useState<Marca | null>(null)

  const [variacoes, setVariacoes] =
    useState<Variacao[]>([])

  const [grupos, setGrupos] =
    useState<OpcaoGrupo[]>([])

  const [opcoes, setOpcoes] =
    useState<Opcao[]>([])

  const [fotoSelecionada, setFotoSelecionada] =
    useState<string | null>(null)

  const [variacaoSelecionada, setVariacaoSelecionada] =
    useState<string | null>(null)

  const [quantidade, setQuantidade] =
    useState(1)

  const [selecoes, setSelecoes] =
    useState<Record<string, string[]>>({})

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState<string | null>(null)

  useEffect(() => {
    async function carregarProduto() {
      setCarregando(true)
      setErro(null)

      try {
        const produtoResult =
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
              preco,
              preco_promocional,
              unidade,
              vendido_por_peso,
              vendido_por_medida,
              destaque_vitrine,
              visivel_vitrine,
              ativo,
              controla_estoque
            `)
            .eq('id', produtoId)
            .eq('empresa_id', empresaId)
            .eq('ativo', true)
            .eq('visivel_vitrine', true)
            .single()

        if (produtoResult.error) {
          throw produtoResult.error
        }

        const produtoData =
          produtoResult.data as Produto

        setProduto(produtoData)

        const [
          fotosResult,
          variacoesResult,
          gruposResult,
        ] = await Promise.all([
          supabase
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
            .eq('produto_id', produtoId)
            .order('principal', {
              ascending: false,
            })
            .order('ordem', {
              ascending: true,
            }),

          supabase
            .from('produto_variacoes')
            .select(`
              id,
              produto_id,
              nome,
              sku,
              preco,
              preco_promocional,
              peso,
              imagem_url,
              ativo,
              disponivel_vitrine
            `)
            .eq('produto_id', produtoId)
            .eq('ativo', true)
            .eq('disponivel_vitrine', true)
            .order('created_at', {
              ascending: true,
            }),

          supabase
            .from('produto_opcao_grupos')
            .select(`
              id,
              produto_id,
              nome,
              obrigatorio,
              minimo_selecoes,
              maximo_selecoes,
              permitir_repeticao,
              ordem,
              ativo
            `)
            .eq('produto_id', produtoId)
            .eq('ativo', true)
            .order('ordem', {
              ascending: true,
            }),
        ])

        if (fotosResult.error) {
          console.error(
            'Erro ao carregar fotos:',
            fotosResult.error
          )
        }

        if (variacoesResult.error) {
          console.error(
            'Erro ao carregar variações:',
            variacoesResult.error
          )
        }

        if (gruposResult.error) {
          console.error(
            'Erro ao carregar opções:',
            gruposResult.error
          )
        }

        const fotosData =
          (fotosResult.data ?? []) as Foto[]

        const variacoesData =
          (variacoesResult.data ?? []) as Variacao[]

        const gruposData =
          (gruposResult.data ?? []) as OpcaoGrupo[]

        setFotos(fotosData)
        setVariacoes(variacoesData)
        setGrupos(gruposData)

        const fotoInicial =
          fotosData.find(
            (foto) => foto.principal
          ) ??
          fotosData[0]

        if (fotoInicial) {
          setFotoSelecionada(
            fotoInicial.url
          )
        } else if (
          variacoesData[0]?.imagem_url
        ) {
          setFotoSelecionada(
            variacoesData[0].imagem_url
          )
        }

        if (variacoesData.length > 0) {
          setVariacaoSelecionada(
            variacoesData[0].id
          )
        }

        if (
          produtoData.categoria_id
        ) {
          const categoriaResult =
            await supabase
              .from('catalogo_publico_categorias')
              .select(`
                categoria_id,
                nome
              `)
              .eq(
                'categoria_id',
                produtoData.categoria_id
              )
              .maybeSingle()

          if (!categoriaResult.error) {
            setCategoria(
              categoriaResult.data as
                | Categoria
                | null
            )
          }
        }

        if (produtoData.marca_id) {
          const marcaResult =
            await supabase
              .from('marcas')
              .select(`
                id,
                nome
              `)
              .eq(
                'id',
                produtoData.marca_id
              )
              .maybeSingle()

          if (!marcaResult.error) {
            setMarca(
              marcaResult.data as
                | Marca
                | null
            )
          }
        }

        if (gruposData.length > 0) {
          const grupoIds =
            gruposData.map(
              (grupo) => grupo.id
            )

          const opcoesResult =
            await supabase
              .from('produto_opcoes')
              .select(`
                id,
                grupo_id,
                nome,
                descricao,
                preco_adicional,
                ativo,
                disponivel,
                ordem,
                imagem_url,
                quantidade_maxima
              `)
              .in('grupo_id', grupoIds)
              .eq('ativo', true)
              .eq('disponivel', true)
              .order('ordem', {
                ascending: true,
              })

          if (opcoesResult.error) {
            console.error(
              'Erro ao carregar opções do produto:',
              opcoesResult.error
            )
          } else {
            setOpcoes(
              (opcoesResult.data ??
                []) as Opcao[]
            )
          }
        }
      } catch (error) {
        console.error(
          'Erro ao carregar produto:',
          error
        )

        setErro(
          'Não foi possível carregar este produto.'
        )
      } finally {
        setCarregando(false)
      }
    }

    carregarProduto()
  }, [
    empresaId,
    produtoId,
  ])

  const variacaoAtual =
    variacoes.find(
      (variacao) =>
        variacao.id ===
        variacaoSelecionada
    ) ?? null

  const fotosDisponiveis = useMemo(() => {
    const resultado = [
      ...fotos.map((foto) => ({
        id: foto.foto_id,
        url: foto.url,
        alt:
          foto.alt_text ||
          produto?.nome ||
          '',
      })),
    ]

    for (const variacao of variacoes) {
      if (
        variacao.imagem_url &&
        !resultado.some(
          (foto) =>
            foto.url ===
            variacao.imagem_url
        )
      ) {
        resultado.push({
          id: `variacao-${variacao.id}`,
          url: variacao.imagem_url,
          alt:
            variacao.nome ||
            produto?.nome ||
            '',
        })
      }
    }

    return resultado
  }, [
    fotos,
    variacoes,
    produto,
  ])

  const precoBase =
    variacaoAtual?.preco ??
    produto?.preco ??
    0

  const precoPromocional =
    variacaoAtual?.preco_promocional ??
    produto?.preco_promocional ??
    null

  const precoUnitario =
    precoPromocional !== null &&
    precoPromocional < precoBase
      ? precoPromocional
      : precoBase

  const adicionalOpcoes = useMemo(() => {
    return Object.values(selecoes)
      .flat()
      .map((opcaoId) =>
        opcoes.find(
          (opcao) =>
            opcao.id === opcaoId
        )
      )
      .filter(Boolean)
      .reduce(
        (
          total,
          opcao
        ) =>
          total +
          Number(
            opcao?.preco_adicional ??
              0
          ),
        0
      )
  }, [selecoes, opcoes])

  const totalUnitario =
    precoUnitario +
    adicionalOpcoes

  const total =
    totalUnitario * quantidade

  function alternarOpcao(
    grupo: OpcaoGrupo,
    opcaoId: string
  ) {
    const atuais =
      selecoes[grupo.id] ?? []

    const jaSelecionada =
      atuais.includes(opcaoId)

    if (jaSelecionada) {
      setSelecoes({
        ...selecoes,
        [grupo.id]: atuais.filter(
          (id) => id !== opcaoId
        ),
      })

      return
    }

    if (
      grupo.maximo_selecoes === 1
    ) {
      setSelecoes({
        ...selecoes,
        [grupo.id]: [opcaoId],
      })

      return
    }

    if (
      grupo.maximo_selecoes > 0 &&
      atuais.length >=
        grupo.maximo_selecoes
    ) {
      return
    }

    setSelecoes({
      ...selecoes,
      [grupo.id]: [
        ...atuais,
        opcaoId,
      ],
    })
  }

  function grupoValido(
    grupo: OpcaoGrupo
  ) {
    const selecionadas =
      selecoes[grupo.id]?.length ?? 0

    if (
      grupo.obrigatorio &&
      selecionadas <
        grupo.minimo_selecoes
    ) {
      return false
    }

    return true
  }

  const todasOpcoesValidas =
    grupos.every(grupo =>
      grupoValido(grupo)
    )

  function adicionarAoPedido() {
    if (!produto) return

    if (!todasOpcoesValidas) {
      alert(
        'Escolha as opções obrigatórias antes de continuar.'
      )
      return
    }

    /*
     * Nesta etapa ainda não estamos enviando
     * o produto para a sacola/pedido.
     *
     * Primeiro estamos deixando toda a estrutura
     * do produto funcionando na vitrine.
     *
     * A próxima etapa será criar a sacola usando
     * pedido_itens + pedido_item_opcoes.
     */
    alert(
      `${produto.nome} foi preparado para ser adicionado à sacola.`
    )
  }

  if (carregando) {
    return (
      <div className="produto-loading">
        <div>
          <Logo />

          <div className="produto-spinner" />

          <p>
            Carregando produto...
          </p>
        </div>

        <style>{`
          .produto-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            font-family: Arial, sans-serif;
            text-align: center;
          }

          .produto-loading p {
            color: #888;
            font-size: 14px;
          }

          .produto-spinner {
            width: 28px;
            height: 28px;
            margin: 22px auto 0;
            border: 3px solid #e8e8e8;
            border-top-color: #222;
            border-radius: 50%;
            animation: produtoSpin .8s linear infinite;
          }

          @keyframes produtoSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  if (erro || !produto) {
    return (
      <div className="produto-error">
        <Logo />

        <h1>
          Produto indisponível
        </h1>

        <p>
          {erro ||
            'Este produto não está disponível na vitrine.'}
        </p>

        <button
          type="button"
          onClick={onVoltar}
        >
          Voltar para a vitrine
        </button>

        <style>{`
          .produto-error {
            min-height: 100vh;
            padding: 30px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            background: #f8f8f6;
            font-family: Arial, sans-serif;
          }

          .produto-error h1 {
            margin: 24px 0 8px;
            font-size: 24px;
          }

          .produto-error p {
            max-width: 420px;
            margin: 0 0 22px;
            color: #777;
            line-height: 1.5;
          }

          .produto-error button {
            border: 0;
            border-radius: 13px;
            padding: 13px 18px;
            background: #222;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
      </div>
    )
  }

  const fotoPrincipal =
    fotoSelecionada ||
    fotosDisponiveis[0]?.url ||
    null

  return (
    <div className="produto-page">
      <header className="produto-topbar">
        <button
          type="button"
          className="produto-back"
          onClick={onVoltar}
        >
          ‹
          <span>
            Voltar
          </span>
        </button>

        <strong>
          Produto
        </strong>

        <div className="produto-topbar-spacer" />
      </header>

      <main className="produto-main">
        <section className="produto-gallery">
          <div className="produto-main-image">
            {fotoPrincipal ? (
              <img
                src={fotoPrincipal}
                alt={produto.nome}
              />
            ) : (
              <div className="produto-image-empty">
                <span>
                  {produto.nome
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {fotosDisponiveis.length >
            1 && (
            <div className="produto-thumbnails">
              {fotosDisponiveis.map(
                (foto) => (
                  <button
                    type="button"
                    key={foto.id}
                    className={
                      foto.url ===
                      fotoSelecionada
                        ? 'produto-thumbnail active'
                        : 'produto-thumbnail'
                    }
                    onClick={() =>
                      setFotoSelecionada(
                        foto.url
                      )
                    }
                  >
                    <img
                      src={foto.url}
                      alt={foto.alt}
                    />
                  </button>
                )
              )}
            </div>
          )}
        </section>

        <section className="produto-info">
          <div className="produto-tags">
            {categoria && (
              <span>
                {categoria.nome}
              </span>
            )}

            {marca && (
              <span>
                {marca.nome}
              </span>
            )}
          </div>

          <h1>
            {produto.nome}
          </h1>

          {produto.descricao_curta && (
            <p className="produto-descricao-curta">
              {produto.descricao_curta}
            </p>
          )}

          <div className="produto-price">
            {precoPromocional !== null &&
            precoPromocional <
              precoBase ? (
              <>
                <small>
                  {formatarPreco(
                    precoBase
                  )}
                </small>

                <strong>
                  {formatarPreco(
                    precoPromocional
                  )}
                </strong>
              </>
            ) : (
              <strong>
                {formatarPreco(
                  precoBase
                )}
              </strong>
            )}

            {produto.unidade &&
              produto.unidade !==
                'un' && (
                <span>
                  / {produto.unidade}
                </span>
              )}
          </div>

          {variacoes.length > 0 && (
            <section className="produto-option-section">
              <div className="produto-option-heading">
                <h2>
                  Escolha uma opção
                </h2>

                <small>
                  {variacaoAtual?.nome ||
                    'Selecione'}
                </small>
              </div>

              <div className="produto-variacoes">
                {variacoes.map(
                  (variacao) => (
                    <button
                      type="button"
                      key={variacao.id}
                      className={
                        variacao.id ===
                        variacaoSelecionada
                          ? 'produto-variacao active'
                          : 'produto-variacao'
                      }
                      onClick={() => {
                        setVariacaoSelecionada(
                          variacao.id
                        )

                        if (
                          variacao.imagem_url
                        ) {
                          setFotoSelecionada(
                            variacao.imagem_url
                          )
                        }
                      }}
                    >
                      <strong>
                        {variacao.nome ||
                          'Opção'}
                      </strong>

                      {variacao.preco !==
                        null && (
                        <small>
                          {formatarPreco(
                            variacao.preco
                          )}
                        </small>
                      )}
                    </button>
                  )
                )}
              </div>
            </section>
          )}

          {grupos.length > 0 && (
            <section className="produto-opcoes">
              {grupos.map(
                (grupo) => {
                  const grupoOpcoes =
                    opcoes.filter(
                      (opcao) =>
                        opcao.grupo_id ===
                        grupo.id
                    )

                  if (
                    grupoOpcoes.length ===
                    0
                  ) {
                    return null
                  }

                  return (
                    <div
                      className="produto-option-section"
                      key={grupo.id}
                    >
                      <div className="produto-option-heading">
                        <div>
                          <h2>
                            {grupo.nome}
                          </h2>

                          <small>
                            {grupo.obrigatorio
                              ? 'Obrigatório'
                              : 'Opcional'}
                          </small>
                        </div>

                        {grupo.maximo_selecoes >
                          1 && (
                          <span>
                            até{' '}
                            {
                              grupo.maximo_selecoes
                            }
                          </span>
                        )}
                      </div>

                      <div className="produto-opcao-lista">
                        {grupoOpcoes.map(
                          (opcao) => {
                            const selecionada =
                              (
                                selecoes[
                                  grupo.id
                                ] ?? []
                              ).includes(
                                opcao.id
                              )

                            return (
                              <button
                                type="button"
                                key={opcao.id}
                                className={
                                  selecionada
                                    ? 'produto-opcao active'
                                    : 'produto-opcao'
                                }
                                onClick={() =>
                                  alternarOpcao(
                                    grupo,
                                    opcao.id
                                  )
                                }
                              >
                                <span className="produto-opcao-check">
                                  {selecionada
                                    ? '✓'
                                    : ''}
                                </span>

                                <span className="produto-opcao-text">
                                  <strong>
                                    {
                                      opcao.nome
                                    }
                                  </strong>

                                  {opcao.descricao && (
                                    <small>
                                      {
                                        opcao.descricao
                                      }
                                    </small>
                                  )}
                                </span>

                                {Number(
                                  opcao.preco_adicional
                                ) >
                                  0 && (
                                  <b>
                                    +
                                    {formatarPreco(
                                      opcao.preco_adicional
                                    )}
                                  </b>
                                )}
                              </button>
                            )
                          }
                        )}
                      </div>
                    </div>
                  )
                }
              )}
            </section>
          )}

          {produto.descricao && (
            <section className="produto-description">
              <span>
                Sobre o produto
              </span>

              <p>
                {produto.descricao}
              </p>
            </section>
          )}

          <section className="produto-purchase">
            <div className="produto-quantity">
              <button
                type="button"
                onClick={() =>
                  setQuantidade(
                    Math.max(
                      1,
                      quantidade - 1
                    )
                  )
                }
              >
                −
              </button>

              <strong>
                {quantidade}
              </strong>

              <button
                type="button"
                onClick={() =>
                  setQuantidade(
                    quantidade + 1
                  )
                }
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="produto-add-button"
              onClick={
                adicionarAoPedido
              }
              disabled={
                !todasOpcoesValidas
              }
            >
              <span>
                Adicionar à sacola
              </span>

              <strong>
                {formatarPreco(total)}
              </strong>
            </button>
          </section>

          {produto.vendido_por_peso && (
            <p className="produto-notice">
              Este produto é vendido por peso.
            </p>
          )}

          {produto.vendido_por_medida && (
            <p className="produto-notice">
              Este produto é vendido por medida.
            </p>
          )}
        </section>
      </main>

      <style>{`
        .produto-page {
          min-height: 100vh;
          background: #fff;
          color: #222;
          font-family: Arial, sans-serif;
          padding-bottom: 50px;
        }

        .produto-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: rgba(255,255,255,.96);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #ededeb;
        }

        .produto-topbar > strong {
          font-size: 14px;
        }

        .produto-topbar-spacer {
          width: 75px;
        }

        .produto-back {
          width: 75px;
          display: flex;
          align-items: center;
          gap: 5px;
          border: 0;
          padding: 0;
          background: transparent;
          color: #333;
          cursor: pointer;
          font-size: 25px;
          text-align: left;
        }

        .produto-back span {
          font-size: 11px;
          font-weight: 700;
        }

        .produto-main {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px 20px 60px;
          display: grid;
          grid-template-columns: minmax(0,1.05fr) minmax(360px,.95fr);
          gap: 55px;
          align-items: start;
        }

        .produto-gallery {
          position: sticky;
          top: 90px;
        }

        .produto-main-image {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 28px;
          background: #f1f1ee;
        }

        .produto-main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .produto-image-empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            #eeeeeb,
            #dededb
          );
        }

        .produto-image-empty span {
          font-size: 90px;
          color: #aaa;
          font-weight: 800;
        }

        .produto-thumbnails {
          display: flex;
          gap: 9px;
          margin-top: 12px;
          overflow-x: auto;
        }

        .produto-thumbnail {
          width: 68px;
          height: 68px;
          flex-shrink: 0;
          padding: 0;
          overflow: hidden;
          border: 2px solid transparent;
          border-radius: 13px;
          background: #f1f1ee;
          cursor: pointer;
        }

        .produto-thumbnail.active {
          border-color: #222;
        }

        .produto-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .produto-info {
          min-width: 0;
        }

        .produto-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .produto-tags span {
          padding: 6px 9px;
          border-radius: 999px;
          background: #f3f3f0;
          color: #777;
          font-size: 10px;
          font-weight: 700;
        }

        .produto-info h1 {
          margin: 0;
          font-size: clamp(28px,4vw,42px);
          line-height: 1.08;
          letter-spacing: -1px;
        }

        .produto-descricao-curta {
          margin: 13px 0 0;
          color: #777;
          font-size: 14px;
          line-height: 1.55;
        }

        .produto-price {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 8px;
          margin: 22px 0 30px;
        }

        .produto-price small {
          color: #aaa;
          text-decoration: line-through;
          font-size: 12px;
        }

        .produto-price strong {
          font-size: 28px;
          letter-spacing: -.5px;
        }

        .produto-price span {
          color: #999;
          font-size: 11px;
        }

        .produto-option-section {
          padding: 20px 0;
          border-top: 1px solid #ededeb;
        }

        .produto-option-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 13px;
        }

        .produto-option-heading h2 {
          margin: 0;
          font-size: 15px;
        }

        .produto-option-heading small,
        .produto-option-heading > span {
          color: #999;
          font-size: 11px;
        }

        .produto-variacoes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .produto-variacao {
          min-width: 90px;
          padding: 12px;
          border: 1px solid #dededb;
          border-radius: 12px;
          background: #fff;
          text-align: left;
          cursor: pointer;
        }

        .produto-variacao.active {
          border-color: #222;
          background: #f5f5f2;
        }

        .produto-variacao strong,
        .produto-variacao small {
          display: block;
        }

        .produto-variacao strong {
          font-size: 12px;
        }

        .produto-variacao small {
          margin-top: 4px;
          color: #999;
          font-size: 10px;
        }

        .produto-opcao-lista {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .produto-opcao {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border: 1px solid #e3e3e0;
          border-radius: 14px;
          background: #fff;
          text-align: left;
          cursor: pointer;
        }

        .produto-opcao.active {
          border-color: #222;
          background: #fafaf8;
        }

        .produto-opcao-check {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d4d4d1;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 800;
        }

        .produto-opcao.active
          .produto-opcao-check {
          background: #222;
          color: #fff;
          border-color: #222;
        }

        .produto-opcao-text {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .produto-opcao-text strong {
          font-size: 12px;
        }

        .produto-opcao-text small {
          color: #999;
          font-size: 10px;
          line-height: 1.35;
        }

        .produto-opcao > b {
          white-space: nowrap;
          font-size: 11px;
        }

        .produto-description {
          padding: 20px 0;
          border-top: 1px solid #ededeb;
        }

        .produto-description > span {
          display: block;
          margin-bottom: 9px;
          color: #999;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .produto-description p {
          margin: 0;
          color: #666;
          font-size: 13px;
          line-height: 1.7;
          white-space: pre-line;
        }

        .produto-purchase {
          display: flex;
          gap: 10px;
          padding-top: 22px;
          border-top: 1px solid #ededeb;
        }

        .produto-quantity {
          height: 52px;
          display: flex;
          align-items: center;
          border: 1px solid #ddd;
          border-radius: 14px;
          overflow: hidden;
        }

        .produto-quantity button {
          width: 42px;
          height: 100%;
          border: 0;
          background: #fff;
          color: #333;
          font-size: 20px;
          cursor: pointer;
        }

        .produto-quantity strong {
          min-width: 28px;
          text-align: center;
          font-size: 13px;
        }

        .produto-add-button {
          flex: 1;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 17px;
          border: 0;
          border-radius: 14px;
          background: #222;
          color: #fff;
          cursor: pointer;
        }

        .produto-add-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .produto-add-button span {
          font-size: 12px;
          font-weight: 700;
        }

        .produto-add-button strong {
          font-size: 13px;
        }

        .produto-notice {
          margin: 10px 0 0;
          color: #999;
          font-size: 10px;
          text-align: center;
        }

        @media (max-width:850px) {
          .produto-main {
            grid-template-columns: 1fr;
            gap: 30px;
            padding: 20px 14px 45px;
          }

          .produto-gallery {
            position: static;
          }

          .produto-main-image {
            border-radius: 22px;
          }
        }

        @media (max-width:500px) {
          .produto-topbar {
            padding: 0 14px;
          }

          .produto-main {
            padding-top: 14px;
          }

          .produto-info h1 {
            font-size: 29px;
          }

          .produto-price strong {
            font-size: 25px;
          }

          .produto-purchase {
            position: sticky;
            bottom: 0;
            z-index: 20;
            margin: 0 -14px;
            padding: 10px 14px;
            background: rgba(255,255,255,.96);
            backdrop-filter: blur(12px);
          }

          .produto-quantity button {
            width: 36px;
          }

          .produto-add-button {
            padding: 0 13px;
          }
        }
      `}</style>
    </div>
  )
}