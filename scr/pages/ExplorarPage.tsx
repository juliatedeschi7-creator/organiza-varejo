import { useEffect, useMemo, useState } from 'react'
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
        .order('nome_fantasia', {
          ascending: true,
        })
      if (!ativo) {
        return
      }
      if (error) {
        console.error('Erro ao carregar lojas:', error)
        setErro(
          'Não foi possível carregar as lojas agora. Tente novamente.',
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
    if (!termo) {
      return lojas
    }
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
    if (!slug) {
      return
    }
    window.location.assign(`/vitrine/${slug}`)
  }
  function obterLocalizacao(loja: Loja) {
    const cidade =
      loja.filial_cidade || loja.empresa_cidade
    const estado =
      loja.filial_estado || loja.empresa_estado
    if (cidade && estado) {
      return `${cidade} • ${estado}`
    }
    if (cidade) {
      return cidade
    }
    if (estado) {
      return estado
    }
    return 'Localização não informada'
  }
  function obterLogo(loja: Loja) {
    return loja.empresa_logo_url
  }
  return (
    <main className="explorar-page">
      <div className="explorar-container">
        <header className="explorar-header">
          <div className="explorar-header-top">
            {onVoltar ? (
              <button
                type="button"
                className="explorar-back-button"
                onClick={onVoltar}
                aria-label="Voltar"
              >
                <span aria-hidden="true">←</span>
              </button>
            ) : null}
            <Logo />
          </div>
          <div className="explorar-heading">
            <span className="explorar-eyebrow">
              Organiza Varejo
            </span>
            <h1>Explore</h1>
            <p>
              Encontre lojas, serviços e negócios locais.
            </p>
          </div>
        </header>
        <section
          className="explorar-search-section"
          aria-label="Pesquisar negócios"
        >
          <label
            htmlFor="explorar-busca"
            className="explorar-search-label"
          >
            Buscar
          </label>
          <div className="explorar-search">
            <span
              className="explorar-search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>
            <input
              id="explorar-busca"
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="Buscar lojas ou negócios"
              autoComplete="off"
            />
            {busca ? (
              <button
                type="button"
                className="explorar-search-clear"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
              >
                ×
              </button>
            ) : null}
          </div>
        </section>
        <section className="explorar-content">
          <div className="explorar-section-heading">
            <div>
              <h2>
                {busca
                  ? 'Resultados'
                  : 'Negócios para você conhecer'}
              </h2>
              {!carregando && !erro ? (
                <span>
                  {lojasFiltradas.length}{' '}
                  {lojasFiltradas.length === 1
                    ? 'negócio'
                    : 'negócios'}
                </span>
              ) : null}
            </div>
          </div>
          {carregando ? (
            <div className="explorar-state">
              <div
                className="explorar-loading"
                aria-hidden="true"
              />
              <p>Carregando negócios...</p>
            </div>
          ) : null}
          {!carregando && erro ? (
            <div className="explorar-state explorar-state-error">
              <div className="explorar-state-icon">
                !
              </div>
              <h3>Não foi possível carregar</h3>
              <p>{erro}</p>
              <button
                type="button"
                className="explorar-retry-button"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!carregando &&
          !erro &&
          lojasFiltradas.length === 0 ? (
            <div className="explorar-state">
              <div className="explorar-empty-icon">
                ⌕
              </div>
              <h3>
                {busca
                  ? 'Nenhum negócio encontrado'
                  : 'Ainda não há negócios para mostrar'}
              </h3>
              <p>
                {busca
                  ? 'Tente buscar por outro nome ou localização.'
                  : 'Novas lojas e negócios poderão aparecer aqui conforme forem publicados.'}
              </p>
            </div>
          ) : null}
          {!carregando &&
          !erro &&
          lojasFiltradas.length > 0 ? (
            <div className="explorar-grid">
              {lojasFiltradas.map((loja) => {
                const logo = obterLogo(loja)
                const nome =
                  loja.nome_fantasia ||
                  'Negócio sem nome'
                return (
                  <article
                    key={`${loja.empresa_id}-${loja.filial_id ?? 'empresa'}`}
                    className="loja-card"
                  >
                    <button
                      type="button"
                      className="loja-card-button"
                      onClick={() =>
                        abrirLoja(loja.empresa_slug)
                      }
                      disabled={!loja.empresa_slug}
                    >
                      <div className="loja-card-visual">
                        {logo ? (
                          <img
                            src={logo}
                            alt={`Logo de ${nome}`}
                            className="loja-card-image"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="loja-card-placeholder"
                            aria-hidden="true"
                          >
                            <span>
                              {nome[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="loja-card-content">
                        <div className="loja-card-title-row">
                          <h3>{nome}</h3>
                          <span
                            className="loja-card-arrow"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </div>
                        <p className="loja-card-location">
                          {obterLocalizacao(loja)}
                        </p>
                        {loja.filial_nome ? (
                          <p className="loja-card-branch">
                            {loja.filial_nome}
                          </p>
                        ) : null}
                        <span className="loja-card-link">
                          Ver loja
                        </span>
                      </div>
                    </button>
                  </article>
                )
              })}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}