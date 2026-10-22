
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  RefreshCw,
  Search,
  Store,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import './ExplorarPage.css'

interface Loja {
  empresa_id: string
  empresa_slug: string | null
  nome_fantasia: string | null
  empresa_logo_url: string | null
  empresa_banner_url: string | null
  empresa_cidade: string | null
  empresa_estado: string | null
  filial_id: string | null
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

function normalizarTexto(
  texto: string | null | undefined,
): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function obterLocalizacao(loja: Loja): string {
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

export default function ExplorarPage({
  onVoltar,
}: ExplorarPageProps) {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true

    async function carregarLojas() {
      setCarregando(true)
      setErro('')

      const { data, error } = await supabase
        .from('catalogo_publico_loja')
        .select('*')
        .order('nome_fantasia', {
          ascending: true,
        })

      if (!ativo) return

      if (error) {
        console.error(
          'Erro ao carregar lojas do Mercado Local:',
          error,
        )

        setLojas([])
        setErro(
          'Não conseguimos carregar as lojas agora. Tente novamente.',
        )
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
  }, [tentativa])

  const lojasFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca)

    if (!termo) return lojas

    return lojas.filter((loja) => {
      const campos = [
        loja.nome_fantasia,
        loja.filial_nome,
        loja.filial_cidade || loja.empresa_cidade,
        loja.filial_estado || loja.empresa_estado,
      ]

      return campos.some((campo) =>
        normalizarTexto(campo).includes(termo),
      )
    })
  }, [lojas, busca])

  function abrirLoja(slug: string | null) {
    if (!slug?.trim()) return

    /*
     * Mantém a rota pública atual do App.tsx:
     * /slug-da-empresa
     *
     * A vitrine pública continua responsável por carregar
     * os dados e os produtos da loja.
     */
    window.location.assign(`/${encodeURIComponent(slug.trim())}`)
  }

  function tentarNovamente() {
    setTentativa((atual) => atual + 1)
  }

  return (
    <main className="explorar-page">
      <div className="explorar-container">
        <header className="explorar-header">
          <div className="explorar-topbar">
            {onVoltar && (
              <button
                type="button"
                className="explorar-back"
                onClick={onVoltar}
                aria-label="Voltar ao início"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div className="explorar-brand">
              <Logo />
            </div>

            <span className="explorar-header-label">
              Mercado Local
            </span>
          </div>

          <div className="explorar-intro">
            <p className="explorar-overline">
              DESCUBRA NEGÓCIOS
            </p>

            <h1>Explore</h1>

            <p className="explorar-description">
              Encontre lojas e conheça os negócios da sua região.
            </p>
          </div>

          <div className="explorar-search">
            <Search
              size={19}
              aria-hidden="true"
              className="explorar-search-icon"
            />

            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar loja ou cidade"
              aria-label="Buscar lojas por nome ou localização"
              autoComplete="off"
            />

            {busca && (
              <button
                type="button"
                className="explorar-clear"
                onClick={() => setBusca('')}
                aria-label="Limpar pesquisa"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </header>

        <section className="explorar-list-section">
          <div className="explorar-list-heading">
            <div>
              <h2>
                {busca
                  ? 'Resultados da busca'
                  : 'Lojas e negócios'}
              </h2>

              {!carregando && !erro && (
                <p className="explorar-result-count">
                  {lojasFiltradas.length}{' '}
                  {lojasFiltradas.length === 1
                    ? 'negócio encontrado'
                    : 'negócios encontrados'}
                </p>
              )}
            </div>
          </div>

          {carregando && (
            <div
              className="explorar-message"
              role="status"
              aria-live="polite"
            >
              <span className="explorar-spinner" />
              <p>Buscando negócios...</p>
            </div>
          )}

          {!carregando && erro && (
            <div className="explorar-message explorar-error">
              <div className="explorar-message-icon">
                <RefreshCw size={22} />
              </div>

              <h3>Não foi possível carregar</h3>
              <p>{erro}</p>

              <button
                type="button"
                className="explorar-retry"
                onClick={tentarNovamente}
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando &&
            !erro &&
            lojasFiltradas.length === 0 && (
              <div className="explorar-message">
                <div className="explorar-message-icon">
                  {busca ? (
                    <Search size={23} />
                  ) : (
                    <Store size={23} />
                  )}
                </div>

                <h3>
                  {busca
                    ? 'Nenhum resultado encontrado'
                    : 'Ainda não há lojas disponíveis'}
                </h3>

                <p>
                  {busca
                    ? 'Experimente outro nome ou pesquise por uma cidade.'
                    : 'Quando houver negócios publicados, eles aparecerão aqui.'}
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
            )}

          {!carregando &&
            !erro &&
            lojasFiltradas.length > 0 && (
              <div className="explorar-list">
                {lojasFiltradas.map((loja) => {
                  const nome =
                    loja.nome_fantasia || 'Negócio sem nome'

                  const podeAbrir =
                    Boolean(loja.empresa_slug?.trim())

                  return (
                    <article
                      key={`${loja.empresa_id}-${loja.filial_id ?? 'empresa'}`}
                      className="explorar-loja"
                    >
                      <div className="explorar-loja-logo">
                        {loja.empresa_logo_url ? (
                          <img
                            src={loja.empresa_logo_url}
                            alt={`Logo de ${nome}`}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="explorar-logo-placeholder"
                            aria-label="Loja sem logotipo"
                          >
                            <Store size={25} />
                          </div>
                        )}
                      </div>

                      <div className="explorar-loja-info">
                        <h3>{nome}</h3>

                        <p className="explorar-location">
                          <MapPin size={14} />
                          <span>
                            {obterLocalizacao(loja)}
                          </span>
                        </p>

                        {loja.filial_nome && (
                          <p className="explorar-branch">
                            {loja.filial_nome}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="explorar-open"
                        onClick={() =>
                          abrirLoja(loja.empresa_slug)
                        }
                        disabled={!podeAbrir}
                        aria-label={`Ver loja ${nome}`}
                        title={
                          podeAbrir
                            ? `Ver ${nome}`
                            : 'Esta loja ainda não tem um endereço público disponível'
                        }
                      >
                        <ArrowUpRight size={20} />
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
        </section>

        <footer className="explorar-footer">
          <span>
            <span className="explorar-footer-dot" />
            Comércio local, mais perto de você.
          </span>
        </footer>
      </div>
    </main>
  )
}