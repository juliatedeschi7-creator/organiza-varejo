import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import ProdutoDetalhePage from './ProdutoDetalhePage'

interface PaginaPublicaNegocioPageProps {
  empresaId: string
  onVoltar?: () => void
}

interface Empresa {
  id: string
  nome_fantasia: string
  logo_url: string | null
  banner_url: string | null
  cidade: string | null
  estado: string | null
  whatsapp: string | null
  telefone: string | null
  email: string | null
  status: string
}

interface Filial {
  id: string
  nome: string
  telefone: string | null
  whatsapp: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  ativa: boolean
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
  preco: number
  preco_promocional: number | null
  unidade: string
  vendido_por_peso: boolean
  vendido_por_medida: boolean
  destaque_vitrine: boolean
  visivel_vitrine: boolean
  ativo: boolean
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

interface ProdutoCard extends Produto {
  foto_url: string | null
}

function formatarPreco(valor: number | null | undefined) {
  if (valor === null || valor === undefined) {
    return ''
  }

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarWhatsApp(numero: string | null) {
  if (!numero) return null

  const somenteNumeros = numero.replace(/\D/g, '')

  if (!somenteNumeros) return null

  return somenteNumeros.startsWith('55')
    ? somenteNumeros
    : `55${somenteNumeros}`
}

export default function PaginaPublicaNegocioPage({
  empresaId,
  onVoltar,
}: PaginaPublicaNegocioPageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fotos, setFotos] = useState<Foto[]>([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string | null>(null)

  const [produtoSelecionado, setProdutoSelecionado] =
    useState<string | null>(null)

  useEffect(() => {
    async function carregarVitrine() {
      setCarregando(true)
      setErro(null)

      try {
        const [
          empresaResult,
          filiaisResult,
          categoriasResult,
          produtosResult,
          fotosResult,
        ] = await Promise.all([
          supabase
            .from('empresas')
            .select(`
              id,
              nome_fantasia,
              logo_url,
              banner_url,
              cidade,
              estado,
              whatsapp,
              telefone,
              email,
              status
            `)
            .eq('id', empresaId)
            .single(),

          supabase
            .from('filiais')
            .select(`
              id,
              nome,
              telefone,
              whatsapp,
              cep,
              logradouro,
              numero,
              complemento,
              bairro,
              cidade,
              estado,
              ativa
            `)
            .eq('empresa_id', empresaId)
            .eq('ativa', true)
            .order('created_at', {
              ascending: true,
            }),

          supabase
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
            .order('ordem', {
              ascending: true,
            }),

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
              descricao_curta,
              preco,
              preco_promocional,
              unidade,
              vendido_por_peso,
              vendido_por_medida,
              destaque_vitrine,
              visivel_vitrine,
              ativo
            `)
            .eq('empresa_id', empresaId)
            .eq('ativo', true)
            .eq('visivel_vitrine', true)
            .order('nome', {
              ascending: true,
            }),

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
            .order('principal', {
              ascending: false,
            })
            .order('ordem', {
              ascending: true,
            }),
        ])

        if (empresaResult.error) {
          throw empresaResult.error
        }

        if (categoriasResult.error) {
          console.error(
            'Erro ao carregar categorias:',
            categoriasResult.error
          )
        }

        if (produtosResult.error) {
          throw produtosResult.error
        }

        if (fotosResult.error) {
          console.error(
            'Erro ao carregar fotos:',
            fotosResult.error
          )
        }

        setEmpresa(
          empresaResult.data as Empresa
        )

        setFiliais(
          (filiaisResult.data ?? []) as Filial[]
        )

        setCategorias(
          (categoriasResult.data ?? []) as Categoria[]
        )

        setProdutos(
          (produtosResult.data ?? []) as Produto[]
        )

        setFotos(
          (fotosResult.data ?? []) as Foto[]
        )
      } catch (error) {
        console.error(
          'Erro ao carregar vitrine:',
          error
        )

        setErro(
          'Não foi possível carregar a vitrine deste negócio.'
        )
      } finally {
        setCarregando(false)
      }
    }

    carregarVitrine()
  }, [empresaId])

  const produtosComFoto = useMemo<ProdutoCard[]>(() => {
    return produtos.map((produto) => {
      const fotoPrincipal =
        fotos.find(
          (foto) =>
            foto.produto_id === produto.id &&
            foto.principal
        ) ??
        fotos.find(
          (foto) =>
            foto.produto_id === produto.id
        )

      return {
        ...produto,
        foto_url: fotoPrincipal?.url ?? null,
      }
    })
  }, [produtos, fotos])

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase()

    return produtosComFoto.filter((produto) => {
      const pertenceCategoria =
        !categoriaSelecionada ||
        produto.categoria_id === categoriaSelecionada

      if (!pertenceCategoria) {
        return false
      }

      if (!termo) {
        return true
      }

      const texto = [
        produto.nome,
        produto.descricao,
        produto.descricao_curta,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()

      return texto.includes(termo)
    })
  }, [
    produtosComFoto,
    busca,
    categoriaSelecionada,
  ])

  const produtosDestaque = useMemo(() => {
    return produtosFiltrados.filter(
      (produto) => produto.destaque_vitrine
    )
  }, [produtosFiltrados])

  const categoriasVisiveis = useMemo(() => {
    return categorias.filter(
      (categoria) =>
        !categoria.categoria_pai_id
    )
  }, [categorias])

  const filialPrincipal =
    filiais.length > 0
      ? filiais[0]
      : null

  function obterFotoProduto(produtoId: string) {
    const foto =
      fotos.find(
        (item) =>
          item.produto_id === produtoId &&
          item.principal
      ) ??
      fotos.find(
        (item) =>
          item.produto_id === produtoId
      )

    return foto?.url ?? null
  }

  function abrirWhatsApp(
    mensagem?: string
  ) {
    const numero =
      formatarWhatsApp(
        filialPrincipal?.whatsapp ?? null
      ) ||
      formatarWhatsApp(
        empresa?.whatsapp ?? null
      )

    if (!numero) return

    const texto =
      mensagem ||
      `Olá! Vim pela vitrine do ${empresa?.nome_fantasia ?? 'negócio'}.`

    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(
        texto
      )}`,
      '_blank'
    )
  }

  function selecionarCategoria(
    categoriaId: string | null
  ) {
    setCategoriaSelecionada(
      categoriaId
    )

    window.setTimeout(() => {
      document
        .getElementById('catalogo')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 50)
  }

  if (produtoSelecionado) {
    return (
      <ProdutoDetalhePage
        empresaId={empresaId}
        produtoId={produtoSelecionado}
        onVoltar={() =>
          setProdutoSelecionado(null)
        }
      />
    )
  }

  if (carregando) {
    return (
      <div className="vitrine-loading">
        <div className="vitrine-loading-card">
          <Logo />

          <div className="vitrine-spinner" />

          <p>
            Carregando vitrine...
          </p>
        </div>

        <style>{`
          .vitrine-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #fff;
            color: #222;
            font-family: Arial, sans-serif;
          }

          .vitrine-loading-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .vitrine-loading-card p {
            margin: 0;
            color: #888;
            font-size: 14px;
          }

          .vitrine-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #e8e8e8;
            border-top-color: #222;
            border-radius: 50%;
            animation: vitrineSpin .8s linear infinite;
          }

          @keyframes vitrineSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  if (erro || !empresa) {
    return (
      <div className="vitrine-error">
        <div className="vitrine-error-card">
          <Logo />

          <h1>
            Vitrine indisponível
          </h1>

          <p>
            {erro ||
              'Não encontramos este negócio.'}
          </p>

          {onVoltar && (
            <button
              type="button"
              onClick={onVoltar}
            >
              Voltar
            </button>
          )}
        </div>

        <style>{`
          .vitrine-error {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f8f8f6;
            font-family: Arial, sans-serif;
          }

          .vitrine-error-card {
            width: 100%;
            max-width: 400px;
            padding: 32px 24px;
            border-radius: 24px;
            background: #fff;
            text-align: center;
            box-shadow: 0 15px 40px rgba(0,0,0,.06);
          }

          .vitrine-error-card h1 {
            margin: 24px 0 8px;
            font-size: 24px;
          }

          .vitrine-error-card p {
            margin: 0 0 22px;
            color: #777;
            line-height: 1.5;
          }

          .vitrine-error-card button {
            border: 0;
            border-radius: 12px;
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

  return (
    <div className="vitrine-page">
      <header className="vitrine-topbar">
        <div className="vitrine-topbar-inner">
          <div className="vitrine-brand">
            {empresa.logo_url ? (
              <img
                src={empresa.logo_url}
                alt={`Logo de ${empresa.nome_fantasia}`}
              />
            ) : (
              <Logo />
            )}

            <div>
              <strong>
                {empresa.nome_fantasia}
              </strong>

              {empresa.cidade && (
                <small>
                  {empresa.cidade}
                  {empresa.estado
                    ? `, ${empresa.estado}`
                    : ''}
                </small>
              )}
            </div>
          </div>

          {onVoltar && (
            <button
              type="button"
              className="vitrine-back"
              onClick={onVoltar}
            >
              Voltar
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="vitrine-cover">
          {empresa.banner_url ? (
            <img
              src={empresa.banner_url}
              alt=""
            />
          ) : (
            <div className="vitrine-cover-empty" />
          )}

          <div className="vitrine-cover-overlay" />

          <div className="vitrine-cover-content">
            <div className="vitrine-logo">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={`Logo de ${empresa.nome_fantasia}`}
                />
              ) : (
                <Logo />
              )}
            </div>

            <h1>
              {empresa.nome_fantasia}
            </h1>

            <p>
              {empresa.cidade
                ? `${empresa.cidade}${
                    empresa.estado
                      ? `, ${empresa.estado}`
                      : ''
                  }`
                : 'Vitrine digital'}
            </p>

            <div className="vitrine-status">
              <span />
              Negócio ativo
            </div>
          </div>
        </section>

        <div className="vitrine-container">
          <section className="vitrine-intro">
            <div>
              <span>
                Vitrine digital
              </span>

              <h2>
                Encontre o que você procura
              </h2>
            </div>

            <button
              type="button"
              className="vitrine-whatsapp"
              onClick={() => abrirWhatsApp()}
            >
              Falar pelo WhatsApp
            </button>
          </section>

          <section className="vitrine-search">
            <span>⌕</span>

            <input
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="O que você está procurando?"
            />

            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
              >
                ×
              </button>
            )}
          </section>

          {categoriasVisiveis.length > 0 && (
            <section className="vitrine-categorias">
              <div className="vitrine-section-heading">
                <div>
                  <span>
                    Explore
                  </span>

                  <h2>
                    Categorias
                  </h2>
                </div>
              </div>

              <div className="vitrine-category-list">
                <button
                  type="button"
                  className={
                    categoriaSelecionada === null
                      ? 'vitrine-category active'
                      : 'vitrine-category'
                  }
                  onClick={() =>
                    selecionarCategoria(null)
                  }
                >
                  <div className="vitrine-category-image">
                    <span>Todos</span>
                  </div>

                  <strong>
                    Todos
                  </strong>
                </button>

                {categoriasVisiveis.map(
                  (categoria) => (
                    <button
                      type="button"
                      key={categoria.categoria_id}
                      className={
                        categoriaSelecionada ===
                        categoria.categoria_id
                          ? 'vitrine-category active'
                          : 'vitrine-category'
                      }
                      onClick={() =>
                        selecionarCategoria(
                          categoria.categoria_id
                        )
                      }
                    >
                      <div className="vitrine-category-image">
                        {categoria.imagem_url ? (
                          <img
                            src={
                              categoria.imagem_url
                            }
                            alt=""
                          />
                        ) : (
                          <span>
                            {categoria.nome
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <strong>
                        {categoria.nome}
                      </strong>
                    </button>
                  )
                )}
              </div>
            </section>
          )}

          {produtosDestaque.length > 0 &&
            !busca &&
            !categoriaSelecionada && (
              <section className="vitrine-section">
                <div className="vitrine-section-heading">
                  <div>
                    <span>
                      Para você
                    </span>

                    <h2>
                      Destaques
                    </h2>
                  </div>
                </div>

                <div className="vitrine-product-grid">
                  {produtosDestaque.map(
                    (produto) => (
                      <button
                        type="button"
                        key={produto.id}
                        className="vitrine-product-card"
                        onClick={() =>
                          setProdutoSelecionado(
                            produto.id
                          )
                        }
                      >
                        <div className="vitrine-product-image">
                          {produto.foto_url ? (
                            <img
                              src={produto.foto_url}
                              alt={produto.nome}
                            />
                          ) : (
                            <div className="vitrine-product-placeholder">
                              <span>
                                {produto.nome
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="vitrine-product-info">
                          <strong>
                            {produto.nome}
                          </strong>

                          {produto.descricao_curta && (
                            <p>
                              {
                                produto.descricao_curta
                              }
                            </p>
                          )}

                          <div className="vitrine-product-price">
                            {produto.preco_promocional !==
                              null &&
                            produto.preco_promocional <
                              produto.preco ? (
                              <>
                                <small>
                                  {formatarPreco(
                                    produto.preco
                                  )}
                                </small>

                                <strong>
                                  {formatarPreco(
                                    produto.preco_promocional
                                  )}
                                </strong>
                              </>
                            ) : (
                              <strong>
                                {formatarPreco(
                                  produto.preco
                                )}
                              </strong>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </section>
            )}

          <section
            className="vitrine-section"
            id="catalogo"
          >
            <div className="vitrine-section-heading">
              <div>
                <span>
                  Catálogo
                </span>

                <h2>
                  {categoriaSelecionada
                    ? categorias.find(
                        (categoria) =>
                          categoria.categoria_id ===
                          categoriaSelecionada
                      )?.nome || 'Produtos'
                    : 'Produtos'}
                </h2>
              </div>

              <small>
                {produtosFiltrados.length}{' '}
                {produtosFiltrados.length === 1
                  ? 'produto'
                  : 'produtos'}
              </small>
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="vitrine-empty">
                <div>
                  {busca
                    ? '⌕'
                    : '◌'}
                </div>

                <h3>
                  {busca
                    ? 'Nenhum produto encontrado'
                    : 'Ainda não há produtos nesta categoria'}
                </h3>

                <p>
                  {busca
                    ? 'Tente procurar por outro nome ou termo.'
                    : 'Este negócio ainda está preparando esta parte da vitrine.'}
                </p>

                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div className="vitrine-product-grid">
                {produtosFiltrados.map(
                  (produto) => (
                    <button
                      type="button"
                      key={produto.id}
                      className="vitrine-product-card"
                      onClick={() =>
                        setProdutoSelecionado(
                          produto.id
                        )
                      }
                    >
                      <div className="vitrine-product-image">
                        {produto.foto_url ? (
                          <img
                            src={produto.foto_url}
                            alt={produto.nome}
                          />
                        ) : (
                          <div className="vitrine-product-placeholder">
                            <span>
                              {produto.nome
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="vitrine-product-info">
                        <strong>
                          {produto.nome}
                        </strong>

                        {produto.descricao_curta && (
                          <p>
                            {produto.descricao_curta}
                          </p>
                        )}

                        <div className="vitrine-product-price">
                          {produto.preco_promocional !==
                            null &&
                          produto.preco_promocional <
                            produto.preco ? (
                            <>
                              <small>
                                {formatarPreco(
                                  produto.preco
                                )}
                              </small>

                              <strong>
                                {formatarPreco(
                                  produto.preco_promocional
                                )}
                              </strong>
                            </>
                          ) : (
                            <strong>
                              {formatarPreco(
                                produto.preco
                              )}
                            </strong>
                          )}

                          {produto.unidade &&
                            produto.unidade !== 'un' && (
                              <span>
                                / {produto.unidade}
                              </span>
                            )}
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          <section className="vitrine-about">
            <div>
              <span>
                Sobre o negócio
              </span>

              <h2>
                {empresa.nome_fantasia}
              </h2>

              <p>
                Encontre produtos, informações e formas de
                entrar em contato diretamente com este
                negócio.
              </p>
            </div>

            <div className="vitrine-contact-buttons">
              <button
                type="button"
                onClick={() => abrirWhatsApp()}
              >
                WhatsApp
              </button>

              {empresa.telefone && (
                <a
                  href={`tel:${empresa.telefone}`}
                >
                  Ligar
                </a>
              )}

              {empresa.email && (
                <a
                  href={`mailto:${empresa.email}`}
                >
                  E-mail
                </a>
              )}
            </div>
          </section>

          {filialPrincipal && (
            <section className="vitrine-location">
              <div>
                <span>
                  Onde estamos
                </span>

                <h2>
                  {filialPrincipal.nome}
                </h2>
              </div>

              <p>
                {[
                  filialPrincipal.logradouro,
                  filialPrincipal.numero,
                  filialPrincipal.complemento,
                  filialPrincipal.bairro,
                  filialPrincipal.cidade,
                  filialPrincipal.estado,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                  'Endereço não informado.'}
              </p>
            </section>
          )}
        </div>
      </main>

      <footer className="vitrine-footer">
        <strong>
          Organiza
        </strong>

        <span>
          Tecnologia para quem empreende.
        </span>
      </footer>

      <style>{`
        .vitrine-page {
          min-height: 100vh;
          background: #fff;
          color: #222;
          font-family: Arial, sans-serif;
        }

        .vitrine-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #ededeb;
        }

        .vitrine-topbar-inner {
          width: 100%;
          max-width: 1180px;
          min-height: 68px;
          margin: 0 auto;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .vitrine-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .vitrine-brand > img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 12px;
        }

        .vitrine-brand > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .vitrine-brand strong {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vitrine-brand small {
          margin-top: 3px;
          color: #999;
          font-size: 11px;
        }

        .vitrine-back {
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 12px;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vitrine-cover {
          position: relative;
          min-height: 430px;
          overflow: hidden;
          background: #e8e8e5;
        }

        .vitrine-cover > img,
        .vitrine-cover-empty {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vitrine-cover-empty {
          background: linear-gradient(
            135deg,
            #ecece9,
            #d9d9d5
          );
        }

        .vitrine-cover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,.08),
            rgba(0,0,0,.68)
          );
        }

        .vitrine-cover-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1180px;
          min-height: 430px;
          margin: 0 auto;
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          color: #fff;
        }

        .vitrine-logo {
          width: 86px;
          height: 86px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 23px;
          background: #fff;
          margin-bottom: 17px;
          box-shadow: 0 12px 32px rgba(0,0,0,.18);
        }

        .vitrine-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vitrine-logo > * {
          max-width: 75%;
          max-height: 75%;
        }

        .vitrine-cover-content h1 {
          margin: 0;
          font-size: clamp(30px,5vw,52px);
          line-height: 1;
          letter-spacing: -1.5px;
        }

        .vitrine-cover-content p {
          margin: 10px 0 0;
          color: rgba(255,255,255,.82);
          font-size: 15px;
        }

        .vitrine-status {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 16px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          font-size: 11px;
          font-weight: 700;
        }

        .vitrine-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #76dc91;
        }

        .vitrine-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 36px 20px 70px;
        }

        .vitrine-intro {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .vitrine-intro > div > span,
        .vitrine-section-heading span,
        .vitrine-about span,
        .vitrine-location span {
          display: block;
          margin-bottom: 6px;
          color: #999;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .vitrine-intro h2,
        .vitrine-section-heading h2,
        .vitrine-about h2,
        .vitrine-location h2 {
          margin: 0;
          font-size: 25px;
          line-height: 1.15;
          letter-spacing: -.5px;
        }

        .vitrine-whatsapp {
          border: 0;
          border-radius: 13px;
          padding: 12px 16px;
          background: #222;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vitrine-search {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 15px;
          height: 54px;
          border: 1px solid #e6e6e3;
          border-radius: 16px;
          background: #fafaf8;
          margin-bottom: 36px;
        }

        .vitrine-search > span {
          color: #888;
          font-size: 22px;
        }

        .vitrine-search input {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #222;
          font-size: 14px;
        }

        .vitrine-search input::placeholder {
          color: #aaa;
        }

        .vitrine-search button {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 50%;
          background: #e9e9e6;
          color: #555;
          cursor: pointer;
          font-size: 18px;
        }

        .vitrine-categorias,
        .vitrine-section {
          margin-bottom: 44px;
        }

        .vitrine-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .vitrine-section-heading > small {
          color: #999;
          font-size: 12px;
        }

        .vitrine-category-list {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding: 2px 2px 8px;
          scrollbar-width: none;
        }

        .vitrine-category-list::-webkit-scrollbar {
          display: none;
        }

        .vitrine-category {
          min-width: 92px;
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
          text-align: center;
        }

        .vitrine-category-image {
          width: 78px;
          height: 78px;
          margin: 0 auto 9px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: #f2f2ef;
          color: #777;
          font-size: 14px;
          font-weight: 700;
          border: 2px solid transparent;
        }

        .vitrine-category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vitrine-category strong {
          display: block;
          color: #555;
          font-size: 11px;
          line-height: 1.3;
        }

        .vitrine-category.active
          .vitrine-category-image {
          border-color: #222;
        }

        .vitrine-category.active strong {
          color: #222;
        }

        .vitrine-product-grid {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 16px;
        }

        .vitrine-product-card {
          min-width: 0;
          padding: 0;
          border: 1px solid #e9e9e6;
          border-radius: 20px;
          overflow: hidden;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            transform .18s ease,
            box-shadow .18s ease;
        }

        .vitrine-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
        }

        .vitrine-product-image {
          position: relative;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #f1f1ee;
        }

        .vitrine-product-image > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vitrine-product-placeholder {
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

        .vitrine-product-placeholder span {
          font-size: 42px;
          font-weight: 800;
          color: #aaa;
        }

        .vitrine-product-info {
          padding: 15px;
        }

        .vitrine-product-info > strong {
          display: block;
          color: #252525;
          font-size: 14px;
          line-height: 1.3;
        }

        .vitrine-product-info > p {
          margin: 6px 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: #999;
          font-size: 11px;
          line-height: 1.4;
        }

        .vitrine-product-price {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }

        .vitrine-product-price small {
          color: #aaa;
          text-decoration: line-through;
          font-size: 10px;
        }

        .vitrine-product-price strong {
          color: #222;
          font-size: 16px;
        }

        .vitrine-product-price span {
          color: #999;
          font-size: 10px;
        }

        .vitrine-empty {
          padding: 55px 20px;
          border: 1px dashed #ddd;
          border-radius: 22px;
          text-align: center;
          background: #fafaf8;
        }

        .vitrine-empty > div {
          font-size: 34px;
          color: #aaa;
        }

        .vitrine-empty h3 {
          margin: 13px 0 7px;
          font-size: 17px;
        }

        .vitrine-empty p {
          max-width: 400px;
          margin: 0 auto 16px;
          color: #999;
          font-size: 12px;
          line-height: 1.5;
        }

        .vitrine-empty button {
          border: 0;
          border-radius: 11px;
          background: #222;
          color: #fff;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .vitrine-about {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 28px;
          border-radius: 22px;
          background: #f7f7f4;
          margin-bottom: 20px;
        }

        .vitrine-about p {
          max-width: 600px;
          margin: 10px 0 0;
          color: #777;
          font-size: 13px;
          line-height: 1.6;
        }

        .vitrine-contact-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .vitrine-contact-buttons button,
        .vitrine-contact-buttons a {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 11px 14px;
          background: #fff;
          color: #222;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .vitrine-location {
          padding: 25px;
          border: 1px solid #e9e9e6;
          border-radius: 22px;
        }

        .vitrine-location p {
          margin: 10px 0 0;
          color: #777;
          font-size: 13px;
          line-height: 1.5;
        }

        .vitrine-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 28px 20px 45px;
          color: #999;
          font-size: 11px;
        }

        .vitrine-footer strong {
          color: #444;
        }

        @media (max-width:800px) {
          .vitrine-product-grid {
            grid-template-columns: repeat(3,minmax(0,1fr));
          }
        }

        @media (max-width:620px) {
          .vitrine-cover,
          .vitrine-cover-content {
            min-height: 360px;
          }

          .vitrine-container {
            padding: 28px 14px 55px;
          }

          .vitrine-intro {
            align-items: stretch;
            flex-direction: column;
          }

          .vitrine-whatsapp {
            width: 100%;
          }

          .vitrine-product-grid {
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 10px;
          }

          .vitrine-product-info {
            padding: 12px;
          }

          .vitrine-product-info > strong {
            font-size: 13px;
          }

          .vitrine-product-price strong {
            font-size: 14px;
          }

          .vitrine-about {
            flex-direction: column;
            align-items: flex-start;
            padding: 22px;
          }

          .vitrine-contact-buttons {
            width: 100%;
          }

          .vitrine-contact-buttons button,
          .vitrine-contact-buttons a {
            flex: 1;
            text-align: center;
          }
        }

        @media (max-width:420px) {
          .vitrine-product-grid {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .vitrine-product-info > p {
            display: none;
          }

          .vitrine-cover-content {
            padding: 24px 16px;
          }

          .vitrine-cover-content h1 {
            font-size: 31px;
          }
        }
      `}</style>
    </div>
  )
}