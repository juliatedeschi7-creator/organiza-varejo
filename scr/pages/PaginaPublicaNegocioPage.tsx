import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Search,
  Share2,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProdutoDetalhePage from './ProdutoDetalhePage'

interface PaginaPublicaNegocioPageProps {
  empresaId: string
  onVoltar: () => void
}

interface Empresa {
  id: string
  nome_fantasia: string | null
  razao_social: string | null
  logo_url: string | null
  banner_url: string | null
  cidade: string | null
  estado: string | null
  telefone: string | null
  whatsapp: string | null
  email: string | null
  status: string | null
  descricao_publica: string | null
}

interface Filial {
  id: string
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
  ordem: number | null
}

interface Produto {
  id: string
  empresa_id: string
  categoria_id: string | null
  nome: string
  slug: string | null
  descricao: string | null
  descricao_curta: string | null
  unidade: string | null
  vendido_por_peso: boolean | null
  vendido_por_medida: boolean | null
  preco: number | null
  preco_promocional: number | null
  destaque_vitrine: boolean | null
  visivel_vitrine: boolean | null
  ativo: boolean | null
}

interface ProdutoFoto {
  foto_id: string
  produto_id: string
  variacao_id: string | null
  url: string
  ordem: number | null
  principal: boolean | null
  alt_text: string | null
}

function formatarPreco(
  valor: number | null | undefined
) {
  if (valor === null || valor === undefined) {
    return ''
  }

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function montarEndereco(
  filial: Filial | null
) {
  if (!filial) {
    return ''
  }

  const partes = [
    filial.logradouro,
    filial.numero,
    filial.complemento,
    filial.bairro,
    filial.cidade,
    filial.estado,
  ].filter(Boolean)

  return partes.join(', ')
}

function obterImagemProduto(
  produtoId: string,
  fotos: ProdutoFoto[]
) {
  const fotosProduto = fotos
    .filter(
      (foto) =>
        foto.produto_id === produtoId
    )
    .sort((a, b) => {
      if (a.principal && !b.principal) {
        return -1
      }

      if (!a.principal && b.principal) {
        return 1
      }

      return (
        Number(a.ordem ?? 0) -
        Number(b.ordem ?? 0)
      )
    })

  return fotosProduto[0]?.url ?? null
}

export default function PaginaPublicaNegocioPage({
  empresaId,
  onVoltar,
}: PaginaPublicaNegocioPageProps) {
  const [empresa, setEmpresa] =
    useState<Empresa | null>(null)

  const [filiais, setFiliais] =
    useState<Filial[]>([])

  const [categorias, setCategorias] =
    useState<Categoria[]>([])

  const [produtos, setProdutos] =
    useState<Produto[]>([])

  const [fotos, setFotos] =
    useState<ProdutoFoto[]>([])

  const [
    filialSelecionadaId,
    setFilialSelecionadaId,
  ] = useState<string | null>(null)

  const [
    categoriaSelecionadaId,
    setCategoriaSelecionadaId,
  ] = useState<string | null>(null)

  const [busca, setBusca] = useState('')

  const [carregando, setCarregando] =
    useState(true)

  const [erro, setErro] =
    useState('')

  const [
    produtoSelecionadoId,
    setProdutoSelecionadoId,
  ] = useState<string | null>(null)

  useEffect(() => {
    carregarDados()
  }, [empresaId])

  async function carregarDados() {
    setCarregando(true)
    setErro('')

    try {
      const [
        empresaResponse,
        filiaisResponse,
        categoriasResponse,
        produtosResponse,
      ] = await Promise.all([
        supabase
          .from('empresas')
          .select(
            `
              id,
              nome_fantasia,
              razao_social,
              logo_url,
              banner_url,
              cidade,
              estado,
              telefone,
              whatsapp,
              email,
              status,
              descricao_publica
            `
          )
          .eq('id', empresaId)
          .maybeSingle(),

        supabase
          .from('filiais')
          .select(
            `
              id,
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
              ativa
            `
          )
          .eq('empresa_id', empresaId)
          .eq('ativa', true)
          .order('created_at', {
            ascending: true,
          }),

        supabase
          .from('catalogo_publico_categorias')
          .select(
            `
              categoria_id,
              empresa_id,
              categoria_pai_id,
              nome,
              slug,
              descricao,
              imagem_url,
              ordem
            `
          )
          .eq('empresa_id', empresaId)
          .order('ordem', {
            ascending: true,
          }),

        supabase
          .from('produtos')
          .select(
            `
              id,
              empresa_id,
              categoria_id,
              nome,
              slug,
              descricao,
              descricao_curta,
              unidade,
              vendido_por_peso,
              vendido_por_medida,
              preco,
              preco_promocional,
              destaque_vitrine,
              visivel_vitrine,
              ativo
            `
          )
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .eq('visivel_vitrine', true)
          .order('destaque_vitrine', {
            ascending: false,
          })
          .order('nome', {
            ascending: true,
          }),
      ])

      if (empresaResponse.error) {
        throw empresaResponse.error
      }

      if (filiaisResponse.error) {
        throw filiaisResponse.error
      }

      if (categoriasResponse.error) {
        throw categoriasResponse.error
      }

      if (produtosResponse.error) {
        throw produtosResponse.error
      }

      const empresaData =
        empresaResponse.data as Empresa | null

      const filiaisData =
        (filiaisResponse.data ??
          []) as Filial[]

      const categoriasData =
        (categoriasResponse.data ??
          []) as Categoria[]

      const produtosData =
        (produtosResponse.data ??
          []) as Produto[]

      let fotosData: ProdutoFoto[] = []

      /*
       * Só buscamos fotos depois de termos
       * os IDs reais dos produtos.
       *
       * Isso evita fazer uma consulta .in()
       * com uma lista vazia.
       */
      if (produtosData.length > 0) {
        const ids = produtosData.map(
          (produto) => produto.id
        )

        const fotosResult = await supabase
          .from('catalogo_publico_fotos')
          .select(
            `
              foto_id,
              produto_id,
              variacao_id,
              url,
              ordem,
              principal,
              alt_text
            `
          )
          .in('produto_id', ids)
          .order('ordem', {
            ascending: true,
          })

        if (fotosResult.error) {
          throw fotosResult.error
        }

        fotosData =
          (fotosResult.data ??
            []) as ProdutoFoto[]
      }

      setEmpresa(empresaData)
      setFiliais(filiaisData)
      setCategorias(categoriasData)
      setProdutos(produtosData)
      setFotos(fotosData)

      if (filiaisData.length > 0) {
        setFilialSelecionadaId(
          filiaisData[0].id
        )
      } else {
        setFilialSelecionadaId(null)
      }
    } catch (error) {
      console.error(
        'Erro ao carregar página pública:',
        error
      )

      setErro(
        'Não foi possível carregar a página desta empresa.'
      )
    } finally {
      setCarregando(false)
    }
  }

  const filialSelecionada = useMemo(() => {
    return (
      filiais.find(
        (filial) =>
          filial.id ===
          filialSelecionadaId
      ) ?? null
    )
  }, [
    filiais,
    filialSelecionadaId,
  ])

  const categoriasRaiz = useMemo(() => {
    return categorias
      .filter(
        (categoria) =>
          !categoria.categoria_pai_id
      )
      .sort(
        (a, b) =>
          Number(a.ordem ?? 0) -
          Number(b.ordem ?? 0)
      )
  }, [categorias])

  const produtosFiltrados = useMemo(() => {
    const texto =
      busca.trim().toLowerCase()

    return produtos.filter((produto) => {
      const pertenceCategoria =
        !categoriaSelecionadaId ||
        produto.categoria_id ===
          categoriaSelecionadaId

      if (!pertenceCategoria) {
        return false
      }

      if (!texto) {
        return true
      }

      const conteudo = [
        produto.nome,
        produto.descricao,
        produto.descricao_curta,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return conteudo.includes(texto)
    })
  }, [
    produtos,
    busca,
    categoriaSelecionadaId,
  ])

  const produtosDestaque = useMemo(() => {
    return produtos.filter(
      (produto) =>
        produto.destaque_vitrine
    )
  }, [produtos])

  function compartilharPagina() {
    const url = window.location.href

    if (navigator.share) {
      navigator
        .share({
          title:
            empresa?.nome_fantasia ??
            'Vitrine',
          text: `Confira a vitrine de ${
            empresa?.nome_fantasia ??
            'esta empresa'
          }`,
          url,
        })
        .catch(() => {})

      return
    }

    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        window.alert(
          'Link da vitrine copiado.'
        )
      })
      .catch(() => {
        window.alert(
          'Não foi possível copiar o link.'
        )
      })
  }

  if (produtoSelecionadoId) {
    return (
      <ProdutoDetalhePage
        empresaId={empresaId}
        produtoId={produtoSelecionadoId}
        onVoltar={() =>
          setProdutoSelecionadoId(null)
        }
      />
    )
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-[#dce9df] border-t-[#159447] animate-spin" />

          <p className="text-sm text-[#66706a]">
            Carregando vitrine...
          </p>
        </div>
      </div>
    )
  }

  if (erro || !empresa) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={onVoltar}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm font-semibold text-[#202622] shadow-sm"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div className="rounded-3xl border border-[#e1e8e3] bg-white p-8 text-center shadow-sm">
            <Store
              size={42}
              className="mx-auto mb-4 text-[#159447]"
            />

            <h1 className="text-xl font-bold text-[#202622]">
              Vitrine indisponível
            </h1>

            <p className="mt-2 text-sm text-[#66706a]">
              {erro ||
                'Não encontramos esta empresa.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const nomeEmpresa =
    empresa.nome_fantasia ||
    empresa.razao_social ||
    'Empresa'

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-[#202622]">
      <div className="mx-auto min-h-screen max-w-6xl bg-[#f7f9f7]">
        <header className="relative overflow-hidden bg-white">
          <div className="relative h-48 sm:h-60">
            {empresa.banner_url ? (
              <img
                src={empresa.banner_url}
                alt={`Capa de ${nomeEmpresa}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#eaf7ef] via-white to-[#dcefe2]" />
            )}

            <div className="absolute inset-0 bg-black/10" />

            <button
              type="button"
              onClick={onVoltar}
              className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-4 py-3 text-sm font-semibold text-[#202622] shadow-sm transition hover:bg-white"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>

            <button
              type="button"
              onClick={compartilharPagina}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/95 text-[#202622] shadow-sm transition hover:bg-white"
              aria-label="Compartilhar"
            >
              <Share2 size={18} />
            </button>
          </div>

          <div className="relative px-5 pb-6">
            <div className="-mt-12 flex items-end justify-between gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-md">
                {empresa.logo_url ? (
                  <img
                    src={empresa.logo_url}
                    alt={`Logo de ${nomeEmpresa}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Store
                    size={34}
                    className="text-[#159447]"
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-bold tracking-tight text-[#202622]">
                {nomeEmpresa}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#eaf7ef] px-3 py-1 text-xs font-semibold text-[#0f6f38]">
                  {empresa.status === 'ativa'
                    ? 'Empresa ativa'
                    : 'Vitrine'}
                </span>

                {(empresa.cidade ||
                  empresa.estado) && (
                  <span className="inline-flex items-center gap-1 text-sm text-[#66706a]">
                    <MapPin size={15} />

                    {[
                      empresa.cidade,
                      empresa.estado,
                    ]
                      .filter(Boolean)
                      .join(' - ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-6 px-4 py-5 sm:px-6">
          {empresa.descricao_publica?.trim() && (
            <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#202622]">
                Sobre o negócio
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#66706a]">
                {empresa.descricao_publica}
              </p>
            </section>
          )}

          {filiais.length > 0 && (
            <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#202622]">
                    Onde encontrar
                  </h2>

                  <p className="mt-1 text-sm text-[#66706a]">
                    Escolha uma unidade.
                  </p>
                </div>

                <MapPin
                  size={22}
                  className="text-[#159447]"
                />
              </div>

              {filiais.length === 1 ? (
                <div className="mt-4 rounded-2xl bg-[#f7f9f7] p-4">
                  <p className="font-semibold text-[#202622]">
                    {filiais[0].nome ||
                      'Unidade principal'}
                  </p>

                  {montarEndereco(
                    filiais[0]
                  ) && (
                    <p className="mt-1 text-sm leading-5 text-[#66706a]">
                      {montarEndereco(
                        filiais[0]
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid gap-2">
                  {filiais.map((filial) => {
                    const selecionada =
                      filial.id ===
                      filialSelecionadaId

                    return (
                      <button
                        key={filial.id}
                        type="button"
                        onClick={() =>
                          setFilialSelecionadaId(
                            filial.id
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                          selecionada
                            ? 'border-[#159447] bg-[#eaf7ef]'
                            : 'border-[#e1e8e3] bg-white'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-[#202622]">
                            {filial.nome ||
                              'Unidade'}
                          </p>

                          {montarEndereco(
                            filial
                          ) && (
                            <p className="mt-1 text-sm leading-5 text-[#66706a]">
                              {montarEndereco(
                                filial
                              )}
                            </p>
                          )}
                        </div>

                        <ChevronRight
                          size={19}
                          className={
                            selecionada
                              ? 'text-[#159447]'
                              : 'text-[#9aa49e]'
                          }
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          <section>
            <div className="mb-3">
              <h2 className="text-xl font-bold text-[#202622]">
                Encontre o que procura
              </h2>

              <p className="mt-1 text-sm text-[#66706a]">
                Veja produtos e ofertas desta
                vitrine.
              </p>
            </div>

            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a948e]"
              />

              <input
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar produto..."
                className="h-12 w-full rounded-2xl border border-[#dbe5df] bg-white pl-11 pr-10 text-sm text-[#202622] outline-none transition focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10"
              />

              {busca && (
                <button
                  type="button"
                  onClick={() =>
                    setBusca('')
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#66706a]"
                  aria-label="Limpar busca"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </section>

          {categoriasRaiz.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#202622]">
                  Categorias
                </h2>

                {categoriaSelecionadaId && (
                  <button
                    type="button"
                    onClick={() =>
                      setCategoriaSelecionadaId(
                        null
                      )
                    }
                    className="text-sm font-semibold text-[#159447]"
                  >
                    Ver todas
                  </button>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {categoriasRaiz.map(
                  (categoria) => {
                    const selecionada =
                      categoria.categoria_id ===
                      categoriaSelecionadaId

                    return (
                      <button
                        key={
                          categoria.categoria_id
                        }
                        type="button"
                        onClick={() =>
                          setCategoriaSelecionadaId(
                            selecionada
                              ? null
                              : categoria.categoria_id
                          )
                        }
                        className={`flex min-w-[130px] shrink-0 flex-col overflow-hidden rounded-2xl border text-left transition ${
                          selecionada
                            ? 'border-[#159447] bg-[#eaf7ef]'
                            : 'border-[#e1e8e3] bg-white'
                        }`}
                      >
                        {categoria.imagem_url ? (
                          <img
                            src={
                              categoria.imagem_url
                            }
                            alt={
                              categoria.nome
                            }
                            className="h-24 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-24 items-center justify-center bg-[#f0f6f1]">
                            <Store
                              size={25}
                              className="text-[#159447]"
                            />
                          </div>
                        )}

                        <span className="p-3 text-sm font-semibold text-[#202622]">
                          {categoria.nome}
                        </span>
                      </button>
                    )
                  }
                )}
              </div>
            </section>
          )}

          {produtosDestaque.length > 0 &&
            !busca &&
            !categoriaSelecionadaId && (
              <section>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-[#202622]">
                    Destaques
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {produtosDestaque.map(
                    (produto) => {
                      const imagem =
                        obterImagemProduto(
                          produto.id,
                          fotos
                        )

                      const precoPromocional =
                        produto.preco_promocional

                      const temPromocao =
                        precoPromocional !==
                          null &&
                        precoPromocional !==
                          undefined &&
                        Number(
                          precoPromocional
                        ) <
                          Number(
                            produto.preco ?? 0
                          )

                      return (
                        <button
                          key={produto.id}
                          type="button"
                          onClick={() =>
                            setProdutoSelecionadoId(
                              produto.id
                            )
                          }
                          className="overflow-hidden rounded-3xl border border-[#e1e8e3] bg-white text-left shadow-sm transition active:scale-[0.99]"
                        >
                          <div className="aspect-square bg-[#f3f6f3]">
                            {imagem ? (
                              <img
                                src={imagem}
                                alt={
                                  produto.nome
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ShoppingBag
                                  size={32}
                                  className="text-[#a5aea8]"
                                />
                              </div>
                            )}
                          </div>

                          <div className="p-3">
                            <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-[#202622]">
                              {produto.nome}
                            </p>

                            {temPromocao ? (
                              <div className="mt-2">
                                <p className="text-xs text-[#8a948e] line-through">
                                  {formatarPreco(
                                    produto.preco
                                  )}
                                </p>

                                <p className="text-base font-bold text-[#159447]">
                                  {formatarPreco(
                                    precoPromocional
                                  )}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-2 text-base font-bold text-[#159447]">
                                {formatarPreco(
                                  produto.preco
                                )}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    }
                  )}
                </div>
              </section>
            )}

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#202622]">
                  Produtos
                </h2>

                <p className="mt-1 text-sm text-[#66706a]">
                  {produtosFiltrados.length}{' '}
                  {produtosFiltrados.length ===
                  1
                    ? 'produto'
                    : 'produtos'}
                </p>
              </div>
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#d7e0da] bg-white p-8 text-center">
                <ShoppingBag
                  size={34}
                  className="mx-auto mb-3 text-[#9aa49e]"
                />

                <h3 className="font-semibold text-[#202622]">
                  Nenhum produto encontrado
                </h3>

                <p className="mt-1 text-sm text-[#66706a]">
                  Tente buscar outro produto
                  ou selecionar outra
                  categoria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {produtosFiltrados.map(
                  (produto) => {
                    const imagem =
                      obterImagemProduto(
                        produto.id,
                        fotos
                      )

                    const precoPromocional =
                      produto.preco_promocional

                    const temPromocao =
                      precoPromocional !==
                        null &&
                      precoPromocional !==
                        undefined &&
                      Number(
                        precoPromocional
                      ) <
                        Number(
                          produto.preco ?? 0
                        )

                    return (
                      <button
                        key={produto.id}
                        type="button"
                        onClick={() =>
                          setProdutoSelecionadoId(
                            produto.id
                          )
                        }
                        className="overflow-hidden rounded-3xl border border-[#e1e8e3] bg-white text-left shadow-sm transition active:scale-[0.99]"
                      >
                        <div className="aspect-square bg-[#f3f6f3]">
                          {imagem ? (
                            <img
                              src={imagem}
                              alt={
                                produto.nome
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ShoppingBag
                                size={32}
                                className="text-[#a5aea8]"
                              />
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-[#202622]">
                            {produto.nome}
                          </p>

                          {produto.descricao_curta && (
                            <p className="mt-1 line-clamp-2 text-xs leading-4 text-[#66706a]">
                              {
                                produto.descricao_curta
                              }
                            </p>
                          )}

                          {temPromocao ? (
                            <div className="mt-2">
                              <p className="text-xs text-[#8a948e] line-through">
                                {formatarPreco(
                                  produto.preco
                                )}
                              </p>

                              <p className="text-base font-bold text-[#159447]">
                                {formatarPreco(
                                  precoPromocional
                                )}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-2 text-base font-bold text-[#159447]">
                              {formatarPreco(
                                produto.preco
                              )}
                            </p>
                          )}

                          {produto.unidade && (
                            <p className="mt-1 text-xs text-[#8a948e]">
                              por{' '}
                              {produto.unidade}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  }
                )}
              </div>
            )}
          </section>

          {filialSelecionada &&
            montarEndereco(
              filialSelecionada
            ) && (
              <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf7ef]">
                    <MapPin
                      size={20}
                      className="text-[#159447]"
                    />
                  </div>

                  <div>
                    <h2 className="font-bold text-[#202622]">
                      Localização
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-[#66706a]">
                      {filialSelecionada.nome ||
                        'Unidade'}
                    </p>

                    <p className="mt-1 text-sm leading-5 text-[#66706a]">
                      {montarEndereco(
                        filialSelecionada
                      )}
                    </p>
                  </div>
                </div>
              </section>
            )}
        </main>

        <footer className="border-t border-[#e1e8e3] bg-white px-5 py-8 text-center">
          <div className="text-lg font-bold tracking-tight text-[#202622]">
            <span>| </span>
            <span>organiza</span>
            <span> |</span>
          </div>

          <p className="mt-1 text-sm text-[#66706a]">
            Tecnologia para quem empreende
          </p>
        </footer>
      </div>
    </div>
  )
}