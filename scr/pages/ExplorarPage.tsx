import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface ExplorarPageProps {
  onAbrirLoja: (slug: string) => void
  onVoltar?: () => void
}

interface LojaPublica {
  empresa_id: string
  empresa_slug: string
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

export default function ExplorarPage({
  onAbrirLoja,
  onVoltar,
}: ExplorarPageProps) {
  const [lojas, setLojas] = useState<LojaPublica[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarLojas() {
      setCarregando(true)
      setErro('')

      const { data, error } = await supabase
        .from('catalogo_publico_loja')
        .select('*')
        .order('nome_fantasia', { ascending: true })

      if (error) {
        console.error('Erro ao carregar lojas públicas:', error)
        setErro(
          'Não foi possível carregar as lojas agora. Tente novamente.',
        )
        setLojas([])
        setCarregando(false)
        return
      }

      setLojas((data ?? []) as LojaPublica[])
      setCarregando(false)
    }

    carregarLojas()
  }, [])

  const lojasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')

    if (!termo) {
      return lojas
    }

    return lojas.filter((loja) => {
      const nome = loja.nome_fantasia?.toLocaleLowerCase('pt-BR') ?? ''
      const cidadeEmpresa =
        loja.empresa_cidade?.toLocaleLowerCase('pt-BR') ?? ''
      const cidadeFilial =
        loja.filial_cidade?.toLocaleLowerCase('pt-BR') ?? ''
      const estadoEmpresa =
        loja.empresa_estado?.toLocaleLowerCase('pt-BR') ?? ''
      const estadoFilial =
        loja.filial_estado?.toLocaleLowerCase('pt-BR') ?? ''
      const filial = loja.filial_nome?.toLocaleLowerCase('pt-BR') ?? ''

      return (
        nome.includes(termo) ||
        cidadeEmpresa.includes(termo) ||
        cidadeFilial.includes(termo) ||
        estadoEmpresa.includes(termo) ||
        estadoFilial.includes(termo) ||
        filial.includes(termo)
      )
    })
  }, [lojas, busca])

  function obterCidade(loja: LojaPublica) {
    return loja.filial_cidade || loja.empresa_cidade || ''
  }

  function obterEstado(loja: LojaPublica) {
    return loja.filial_estado || loja.empresa_estado || ''
  }

  function obterLocalizacao(loja: LojaPublica) {
    const cidade = obterCidade(loja)
    const estado = obterEstado(loja)

    if (cidade && estado) {
      return `${cidade} - ${estado}`
    }

    return cidade || estado || 'Localização não informada'
  }

  function obterInicial(nome: string | null) {
    if (!nome?.trim()) {
      return 'O'
    }

    return nome.trim().charAt(0).toUpperCase()
  }

  return (
    <main className="explorar-page">
      <header className="explorar-header">
        <div className="explorar-header__top">
          <div className="explorar-header__brand">
            <Logo />
          </div>

          {onVoltar && (
            <button
              type="button"
              className="explorar-back-button"
              onClick={onVoltar}
            >
              <span aria-hidden="true">←</span>
              <span>Voltar</span>
            </button>
          )}
        </div>

        <div className="explorar-heading">
          <p className="explorar-eyebrow">Organiza Varejo</p>

          <h1>Explore</h1>

          <p>
            Encontre lojas, serviços e negócios locais.
          </p>
        </div>

        <div className="explorar-search">
          <span
            className="explorar-search__icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar lojas ou cidades"
            aria-label="Buscar lojas ou cidades"
          />

          {busca && (
            <button
              type="button"
              className="explorar-search__clear"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </div>
      </header>

      <section className="explorar-content">
        <div className="explorar-section-heading">
          <div>
            <h2>Negócios locais</h2>

            {!carregando && !erro && (
              <p>
                {lojasFiltradas.length === 1
                  ? '1 negócio encontrado'
                  : `${lojasFiltradas.length} negócios encontrados`}
              </p>
            )}
          </div>
        </div>

        {carregando && (
          <div className="explorar-state">
            <div
              className="explorar-loading"
              aria-hidden="true"
            />

            <p>Encontrando negócios...</p>
          </div>
        )}

        {!carregando && erro && (
          <div className="explorar-state explorar-state--error">
            <div className="explorar-state__icon">!</div>

            <h2>Não conseguimos carregar as lojas</h2>

            <p>{erro}</p>

            <button
              type="button"
              className="explorar-retry-button"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!carregando && !erro && lojasFiltradas.length === 0 && (
          <div className="explorar-state">
            <div className="explorar-state__icon">⌕</div>

            <h2>
              {busca
                ? 'Nenhum negócio encontrado'
                : 'Ainda não há negócios disponíveis'}
            </h2>

            <p>
              {busca
                ? 'Tente buscar por outro nome ou cidade.'
                : 'Novas lojas poderão aparecer aqui conforme forem publicadas no Organiza.'}
            </p>
          </div>
        )}

        {!carregando && !erro && lojasFiltradas.length > 0 && (
          <div className="lojas-grid">
            {lojasFiltradas.map((loja) => {
              const nome = loja.nome_fantasia || 'Negócio local'

              return (
                <button
                  key={`${loja.empresa_id}-${loja.filial_id ?? 'sem-filial'}`}
                  type="button"
                  className="loja-card"
                  onClick={() => onAbrirLoja(loja.empresa_slug)}
                >
                  <div className="loja-card__visual">
                    {loja.empresa_logo_url ? (
                      <img
                        src={loja.empresa_logo_url}
                        alt=""
                        className="loja-card__logo"
                        loading="lazy"
                      />
                    ) : (
                      <div className="loja-card__logo loja-card__logo--fallback">
                        {obterInicial(nome)}
                      </div>
                    )}

                    <span className="loja-card__arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>

                  <div className="loja-card__content">
                    <h3>{nome}</h3>

                    {loja.filial_nome && (
                      <p className="loja-card__branch">
                        {loja.filial_nome}
                      </p>
                    )}

                    <p className="loja-card__location">
                      <span aria-hidden="true">⌖</span>
                      {obterLocalizacao(loja)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}