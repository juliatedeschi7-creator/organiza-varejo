
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Search,
  Store,
  Shirt,
  Utensils,
  Sparkles,
  House,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface Loja {
  empresa_id: string
  empresa_slug: string | null
  nome_fantasia: string | null
  empresa_logo_url: string | null
  empresa_banner_url: string | null
  empresa_cidade: string | null
  empresa_estado: string | null

  filial_id: string
  filial_nome: string | null
  filial_codigo: string | null
  filial_telefone: string | null
  filial_whatsapp: string | null
  filial_cep: string | null
  filial_logradouro: string | null
  filial_numero: string | null
  filial_complemento: string | null
  filial_bairro: string | null
  filial_cidade: string | null
  filial_estado: string | null
  filial_latitude: number | null
  filial_longitude: number | null
}

interface ExplorarPageProps {
  onVoltar?: () => void
}

const categorias = [
  {
    nome: 'Moda',
    classe: 'rosa',
    Icone: Shirt,
  },
  {
    nome: 'Alimentação',
    classe: 'verde',
    Icone: Utensils,
  },
  {
    nome: 'Beleza',
    classe: 'azul',
    Icone: Sparkles,
  },
  {
    nome: 'Casa',
    classe: 'amarelo',
    Icone: House,
  },
]

export default function ExplorarPage({
  onVoltar,
}: ExplorarPageProps) {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarLojas() {
      setCarregando(true)
      setErro('')

      const { data, error } = await supabase
        .from('catalogo_publico_loja')
        .select('*')
        .order('nome_fantasia', { ascending: true })

      if (!ativo) return

      if (error) {
        console.error(
          'Erro ao carregar lojas do Mercado Local:',
          error,
        )

        setErro(
          'Não foi possível carregar os negócios neste momento.',
        )
        setLojas([])
        setCarregando(false)
        return
      }

      setLojas((data ?? []) as Loja[])
      setCarregando(false)
    }

    carregarLojas()

    return () => {
      ativo = false
    }
  }, [])

  const lojasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return lojas

    return lojas.filter((loja) => {
      const nome =
        loja.nome_fantasia?.toLowerCase() ?? ''

      const cidade =
        loja.filial_cidade?.toLowerCase() ??
        loja.empresa_cidade?.toLowerCase() ??
        ''

      const estado =
        loja.filial_estado?.toLowerCase() ??
        loja.empresa_estado?.toLowerCase() ??
        ''

      const filial =
        loja.filial_nome?.toLowerCase() ?? ''

      return (
        nome.includes(termo) ||
        cidade.includes(termo) ||
        estado.includes(termo) ||
        filial.includes(termo)
      )
    })
  }, [lojas, busca])

  function abrirLoja(slug: string | null) {
    if (!slug) return

    // A rota pública atual recebe o slug da empresa
    // diretamente na raiz do endereço.
    window.location.assign(`/${encodeURIComponent(slug)}`)
  }

  function obterLocalizacao(loja: Loja) {
    const cidade =
      loja.filial_cidade || loja.empresa_cidade

    const estado =
      loja.filial_estado || loja.empresa_estado

    if (cidade && estado) {
      return `${cidade}, ${estado}`
    }

    if (cidade) return cidade
    if (estado) return estado

    return 'Localização não informada'
  }

  function obterNomeLoja(loja: Loja) {
    return loja.nome_fantasia || 'Negócio local'
  }

  function obterNomeFilial(loja: Loja) {
    return loja.filial_nome || 'Unidade principal'
  }

  function tentarNovamente() {
    window.location.reload()
  }

  return (
    <main className="explorar-page">
      <div className="explorar-container">
        <header className="explorar-header">
          <div className="explorar-topbar">
            <button
              type="button"
              className="explorar-back"
              onClick={onVoltar}
              aria-label="Voltar"
            >
              <ArrowLeft size={21} strokeWidth={2} />
            </button>

            <div className="explorar-topbar-title">
              <h1 className="explorar-topbar-label">
                Mercado Local
              </h1>
            </div>

            <div className="explorar-brand-mark">
              <Logo somenteSimbolo />
            </div>
          </div>
        </header>

        <section className="explorar-intro">
          <p className="explorar-overline">
            DESCUBRA NEGÓCIOS DA SUA REGIÃO
          </p>

          <p className="explorar-description">
            Encontre lojas, conheça produtos e descubra o que
            existe perto de você.
          </p>
        </section>

        <div className="explorar-search">
          <Search
            className="explorar-search-icon"
            size={21}
            strokeWidth={2}
          />

          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar loja ou cidade"
            aria-label="Buscar loja ou cidade"
          />

          {busca && (
            <button
              type="button"
              className="explorar-clear"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <section className="explorar-categorias-section">
          <div className="explorar-section-heading">
            <h2>Explore por categoria</h2>
          </div>

          <div className="explorar-categorias">
            {categorias.map(
              ({ nome, classe, Icone }) => (
                <div
                  key={nome}
                  className={`explorar-categoria explorar-categoria-${classe}`}
                >
                  <div className="explorar-categoria-icon">
                    <Icone size={25} strokeWidth={1.8} />
                  </div>

                  <span>{nome}</span>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="explorar-list-section">
          <div className="explorar-list-heading">
            <div>
              <h2>Negócios locais</h2>

              <p className="explorar-result-count">
                {carregando
                  ? 'Buscando negócios...'
                  : `${lojasFiltradas.length} ${
                      lojasFiltradas.length === 1
                        ? 'negócio encontrado'
                        : 'negócios encontrados'
                    }`}
              </p>
            </div>
          </div>

          {carregando ? (
            <div className="explorar-message">
              <div className="explorar-spinner" />
              <h3>Encontrando negócios</h3>
              <p>
                Estamos preparando as lojas para você.
              </p>
            </div>
          ) : erro ? (
            <div className="explorar-message">
              <div className="explorar-message-icon">
                <Store size={24} />
              </div>

              <h3>Não foi possível carregar</h3>
              <p>{erro}</p>

              <button
                type="button"
                className="explorar-retry"
                onClick={tentarNovamente}
              >
                Tentar novamente
              </button>
            </div>
          ) : lojasFiltradas.length === 0 ? (
            <div className="explorar-message">
              <div className="explorar-message-icon">
                <Search size={24} />
              </div>

              <h3>
                {busca
                  ? 'Nenhum negócio encontrado'
                  : 'Ainda não há negócios por aqui'}
              </h3>

              <p>
                {busca
                  ? 'Tente buscar por outro nome, cidade ou unidade.'
                  : 'Novos negócios poderão aparecer nesta área.'}
              </p>

              {busca && (
                <button
                  type="button"
                  className="explorar-text-button"
                  onClick={() => setBusca('')}
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="explorar-list">
              {lojasFiltradas.map((loja, index) => {
                const cores = [
                  'rosa',
                  'verde',
                  'azul',
                  'amarelo',
                  'lilas',
                  'pessego',
                ]

                const classeCor =
                  cores[index % cores.length]

                return (
                  <article
                    key={`${loja.empresa_id}-${loja.filial_id}`}
                    className="explorar-loja"
                  >
                    <div
                      className={`explorar-loja-logo explorar-logo-${classeCor}`}
                    >
                      {loja.empresa_logo_url ? (
                        <img
                          src={loja.empresa_logo_url}
                          alt={`Logo de ${obterNomeLoja(loja)}`}
                        />
                      ) : (
                        <div className="explorar-logo-placeholder">
                          <Store
                            size={27}
                            strokeWidth={1.8}
                          />
                        </div>
                      )}
                    </div>

                    <div className="explorar-loja-info">
                      <h3>{obterNomeLoja(loja)}</h3>

                      <p className="explorar-location">
                        <MapPin
                          size={15}
                          strokeWidth={1.8}
                        />

                        <span>
                          {obterLocalizacao(loja)}
                        </span>
                      </p>

                      <p className="explorar-branch">
                        {obterNomeFilial(loja)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="explorar-open"
                      onClick={() =>
                        abrirLoja(loja.empresa_slug)
                      }
                      disabled={!loja.empresa_slug}
                      aria-label={`Ver loja ${obterNomeLoja(loja)}`}
                    >
                      <ArrowUpRight
                        size={22}
                        strokeWidth={2}
                      />
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <footer className="explorar-footer">
          <div className="explorar-footer-brand">
            <span className="explorar-footer-line" />

            <span className="explorar-footer-name">
              Organiza
            </span>

            <span className="explorar-footer-line" />
          </div>

          <p>
            Tecnologia para quem empreende.
          </p>
        </footer>
      </div>
    </main>
  )
}
