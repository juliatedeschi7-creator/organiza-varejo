import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface NegocioPageProps {
  empresaId: string
  onSair: () => void
  onAbrirVitrine: () => void
  onAbrirProdutos: () => void
  onAbrirCategorias: () => void
  onAbrirEditarEmpresa: () => void
  onAbrirEditarEndereco: () => void
  onAbrirPersonalizacao: () => void
}

interface Empresa {
  id: string
  nome_fantasia: string
  razao_social: string | null
  documento: string | null
  slug: string
  email: string | null
  telefone: string | null
  whatsapp: string | null
  logo_url: string | null
  banner_url: string | null
  cidade: string | null
  estado: string | null
  status: string
}

interface Filial {
  id: string
  empresa_id: string
  nome: string
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

export default function NegocioPage({
  empresaId,
  onSair,
  onAbrirVitrine,
  onAbrirProdutos,
  onAbrirCategorias,
  onAbrirEditarEmpresa,
  onAbrirEditarEndereco,
  onAbrirPersonalizacao,
}: NegocioPageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [filial, setFilial] = useState<Filial | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    async function carregarNegocio() {
      setCarregando(true)

      try {
        const { data: empresaData, error: empresaError } =
          await supabase
            .from('empresas')
            .select(`
              id,
              nome_fantasia,
              razao_social,
              documento,
              slug,
              email,
              telefone,
              whatsapp,
              logo_url,
              banner_url,
              cidade,
              estado,
              status
            `)
            .eq('id', empresaId)
            .single()

        if (empresaError) {
          console.error(
            'Erro ao carregar empresa:',
            empresaError
          )

          setEmpresa(null)
          return
        }

        setEmpresa(empresaData as Empresa)

        const { data: filialData, error: filialError } =
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
              ativa
            `)
            .eq('empresa_id', empresaId)
            .eq('ativa', true)
            .order('created_at', {
              ascending: true,
            })
            .limit(1)
            .maybeSingle()

        if (filialError) {
          console.error(
            'Erro ao carregar unidade:',
            filialError
          )

          setFilial(null)
          return
        }

        setFilial(
          filialData as Filial | null
        )
      } finally {
        setCarregando(false)
      }
    }

    carregarNegocio()
  }, [empresaId])

  function enderecoCompleto() {
    if (!filial) return ''

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

  function statusTexto() {
    if (!empresa) return ''

    if (empresa.status === 'ativa') {
      return 'Negócio ativo'
    }

    if (empresa.status === 'arquivada') {
      return 'Negócio arquivado'
    }

    return empresa.status
  }

  if (carregando) {
    return (
      <div className="negocio-loading">
        <div className="negocio-loading-card">
          <Logo />

          <div className="negocio-spinner" />

          <p>
            Carregando seu negócio...
          </p>
        </div>

        <style>{`
          .negocio-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f7f7f5;
            color: #222;
            font-family: Arial, sans-serif;
          }

          .negocio-loading-card {
            width: 100%;
            max-width: 360px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            text-align: center;
          }

          .negocio-loading-card p {
            margin: 0;
            color: #777;
            font-size: 15px;
          }

          .negocio-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #e8e8e8;
            border-top-color: #222;
            border-radius: 50%;
            animation: negocioSpin .8s linear infinite;
          }

          @keyframes negocioSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="negocio-error">
        <div className="negocio-error-card">
          <Logo />

          <h1>
            Não encontramos seu negócio
          </h1>

          <p>
            Não foi possível carregar os dados deste negócio.
          </p>

          <button
            type="button"
            onClick={onSair}
            className="negocio-primary-button"
          >
            Voltar
          </button>
        </div>

        <style>{`
          .negocio-error {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f7f7f5;
            font-family: Arial, sans-serif;
          }

          .negocio-error-card {
            width: 100%;
            max-width: 420px;
            background: #fff;
            border-radius: 24px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 12px 40px rgba(0,0,0,.06);
          }

          .negocio-error-card h1 {
            margin: 28px 0 10px;
            font-size: 24px;
          }

          .negocio-error-card p {
            margin: 0 0 24px;
            color: #777;
            line-height: 1.5;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="negocio-page">
      <header className="negocio-topbar">
        <div className="negocio-topbar-inner">
          <div className="negocio-brand">
            <div className="negocio-brand-logo">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={`Logo de ${empresa.nome_fantasia}`}
                />
              ) : (
                <Logo />
              )}
            </div>

            <div className="negocio-brand-info">
              <strong>
                {empresa.nome_fantasia}
              </strong>

              <span>
                {filial?.nome || 'Unidade principal'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="negocio-menu-button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main className="negocio-main">
        <section className="negocio-hero">
          <div
            className="negocio-hero-background"
            style={
              empresa.banner_url
                ? {
                    backgroundImage: `url(${empresa.banner_url})`,
                  }
                : undefined
            }
          >
            {!empresa.banner_url && (
              <div className="negocio-hero-placeholder" />
            )}
          </div>

          <div className="negocio-hero-content">
            <div className="negocio-logo-large">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={`Logo de ${empresa.nome_fantasia}`}
                />
              ) : (
                <Logo />
              )}
            </div>

            <div className="negocio-hero-text">
              <h1>
                {empresa.nome_fantasia}
              </h1>

              <p>
                {filial?.cidade ||
                  empresa.cidade ||
                  'Seu negócio no digital'}

                {filial?.estado ||
                empresa.estado
                  ? `, ${
                      filial?.estado ||
                      empresa.estado
                    }`
                  : ''}
              </p>
            </div>

            <div className="negocio-status">
              <span className="negocio-status-dot" />

              {statusTexto()}
            </div>
          </div>
        </section>

        <section className="negocio-welcome">
          <div>
            <span className="negocio-eyebrow">
              Seu negócio
            </span>

            <h2>
              Vamos deixar sua presença digital pronta para
              seus clientes.
            </h2>

            <p>
              Aqui você organiza as informações do negócio,
              seus produtos e prepara sua vitrine.
            </p>
          </div>

          <button
            type="button"
            className="negocio-outline-button"
            onClick={onAbrirVitrine}
          >
            Visualizar vitrine
          </button>
        </section>

        <section className="negocio-section">
          <div className="negocio-section-heading">
            <div>
              <span className="negocio-eyebrow">
                Primeiros passos
              </span>

              <h2>
                Deixe seu negócio completo
              </h2>
            </div>

            <span className="negocio-progress">
              0/5
            </span>
          </div>

          <div className="negocio-checklist">
            <button
              type="button"
              className="negocio-check-item"
              onClick={onAbrirEditarEmpresa}
            >
              <span className="negocio-check-icon">
                ✓
              </span>

              <span className="negocio-check-content">
                <strong>
                  Dados principais
                </strong>

                <small>
                  Nome, contato e informações do negócio
                </small>
              </span>

              <span className="negocio-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="negocio-check-item"
              onClick={onAbrirEditarEndereco}
            >
              <span className="negocio-check-icon">
                ✓
              </span>

              <span className="negocio-check-content">
                <strong>
                  Endereço
                </strong>

                <small>
                  Informe onde seus clientes podem encontrar
                  você
                </small>
              </span>

              <span className="negocio-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="negocio-check-item"
              onClick={onAbrirEditarEmpresa}
            >
              <span className="negocio-check-icon">
                ✓
              </span>

              <span className="negocio-check-content">
                <strong>
                  Adicionar logo
                </strong>

                <small>
                  Deixe sua vitrine com a identidade do seu
                  negócio
                </small>
              </span>

              <span className="negocio-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="negocio-check-item"
              onClick={onAbrirPersonalizacao}
            >
              <span className="negocio-check-icon">
                ✓
              </span>

              <span className="negocio-check-content">
                <strong>
                  Personalizar sua vitrine
                </strong>

                <small>
                  Escolha como seu negócio será apresentado
                </small>
              </span>

              <span className="negocio-arrow">
                ›
              </span>
            </button>

            <button
              type="button"
              className="negocio-check-item"
              onClick={onAbrirProdutos}
            >
              <span className="negocio-check-icon">
                ✓
              </span>

              <span className="negocio-check-content">
                <strong>
                  Cadastrar produtos ou serviços
                </strong>

                <small>
                  Comece a montar o que você oferece
                </small>
              </span>

              <span className="negocio-arrow">
                ›
              </span>
            </button>
          </div>
        </section>

        <section className="negocio-section">
          <div className="negocio-section-heading">
            <div>
              <span className="negocio-eyebrow">
                Acesso rápido
              </span>

              <h2>
                Organize seu negócio
              </h2>
            </div>
          </div>

          <div className="negocio-actions-grid">
            <button
              type="button"
              className="negocio-action"
              onClick={onAbrirProdutos}
            >
              <span className="negocio-action-icon">
                ▦
              </span>

              <strong>
                Produtos e serviços
              </strong>

              <small>
                Cadastre o que você oferece
              </small>
            </button>

            <button
              type="button"
              className="negocio-action"
              onClick={onAbrirCategorias}
            >
              <span className="negocio-action-icon">
                ≡
              </span>

              <strong>
                Categorias
              </strong>

              <small>
                Organize seus produtos por categoria
              </small>
            </button>

            <button
              type="button"
              className="negocio-action"
            >
              <span className="negocio-action-icon">
                ♙
              </span>

              <strong>
                Clientes
              </strong>

              <small>
                Organize seus clientes
              </small>
            </button>

            <button
              type="button"
              className="negocio-action"
            >
              <span className="negocio-action-icon">
                ▤
              </span>

              <strong>
                Estoque
              </strong>

              <small>
                Acompanhe seus produtos
              </small>
            </button>

            <button
              type="button"
              className="negocio-action"
            >
              <span className="negocio-action-icon">
                R$
              </span>

              <strong>
                Vendas
              </strong>

              <small>
                Acompanhe suas vendas
              </small>
            </button>

            <button
              type="button"
              className="negocio-action negocio-vitrine-action"
              onClick={onAbrirVitrine}
            >
              <span className="negocio-action-icon">
                ◉
              </span>

              <strong>
                Minha vitrine
              </strong>

              <small>
                Veja como seus clientes verão
              </small>
            </button>
          </div>
        </section>

        <section className="negocio-section">
          <div className="negocio-section-heading">
            <div>
              <span className="negocio-eyebrow">
                Unidade
              </span>

              <h2>
                Seu endereço
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="negocio-unit-card"
            onClick={onAbrirEditarEndereco}
          >
            <div className="negocio-unit-icon">
              ⌂
            </div>

            <div className="negocio-unit-content">
              <strong>
                {filial?.nome ||
                  'Unidade principal'}
              </strong>

              {enderecoCompleto() ? (
                <p>
                  {enderecoCompleto()}
                </p>
              ) : (
                <p>
                  Endereço ainda não informado.
                </p>
              )}

              {filial?.cep && (
                <span>
                  CEP: {filial.cep}
                </span>
              )}
            </div>

            <span className="negocio-unit-arrow">
              ›
            </span>
          </button>
        </section>

        <section className="negocio-vitrine-cta">
          <div>
            <span className="negocio-eyebrow">
              Organiza
            </span>

            <h2>
              Sua porta pode estar fechada.
              <br />
              Sua vitrine não precisa estar.
            </h2>

            <p>
              Mostre seu negócio para seus clientes mesmo
              quando você não estiver atendendo.
            </p>
          </div>

          <button
            type="button"
            className="negocio-primary-button"
            onClick={onAbrirVitrine}
          >
            Ver minha vitrine
          </button>
        </section>
      </main>

      <nav className="negocio-bottom-nav">
        <button
          type="button"
          className="negocio-nav-button negocio-nav-active"
        >
          <span>⌂</span>
          <small>Início</small>
        </button>

        <button
          type="button"
          className="negocio-nav-button"
          onClick={onAbrirProdutos}
        >
          <span>▦</span>
          <small>Produtos</small>
        </button>

        <button
          type="button"
          className="negocio-nav-button"
          onClick={onAbrirVitrine}
        >
          <span>◉</span>
          <small>Vitrine</small>
        </button>

        <button
          type="button"
          className="negocio-nav-button"
          onClick={() => setMenuAberto(true)}
        >
          <span>☰</span>
          <small>Menu</small>
        </button>
      </nav>

      {menuAberto && (
        <div
          className="negocio-menu-overlay"
          onClick={() => setMenuAberto(false)}
        >
          <div
            className="negocio-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="negocio-menu-header">
              <div>
                <span className="negocio-eyebrow">
                  Menu
                </span>

                <h2>
                  {empresa.nome_fantasia}
                </h2>
              </div>

              <button
                type="button"
                className="negocio-menu-close"
                onClick={() =>
                  setMenuAberto(false)
                }
                aria-label="Fechar menu"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() => {
                setMenuAberto(false)
                onAbrirEditarEmpresa()
              }}
            >
              <span>⌁</span>

              <div>
                <strong>
                  Dados do negócio
                </strong>

                <small>
                  Nome, contatos e informações da empresa
                </small>
              </div>

              <b>›</b>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() => {
                setMenuAberto(false)
                onAbrirEditarEndereco()
              }}
            >
              <span>⌂</span>

              <div>
                <strong>
                  Endereço e unidade
                </strong>

                <small>
                  Onde seus clientes podem encontrar você
                </small>
              </div>

              <b>›</b>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() => {
                setMenuAberto(false)
                onAbrirPersonalizacao()
              }}
            >
              <span>◉</span>

              <div>
                <strong>
                  Personalizar vitrine
                </strong>

                <small>
                  Escolha como seu negócio será apresentado
                </small>
              </div>

              <b>›</b>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() => {
                setMenuAberto(false)
                onAbrirProdutos()
              }}
            >
              <span>▦</span>

              <div>
                <strong>
                  Produtos e serviços
                </strong>

                <small>
                  Cadastre e organize seus produtos
                </small>
              </div>

              <b>›</b>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() => {
                setMenuAberto(false)
                onAbrirCategorias()
              }}
            >
              <span>≡</span>

              <div>
                <strong>
                  Categorias
                </strong>

                <small>
                  Organize os produtos da sua vitrine
                </small>
              </div>

              <b>›</b>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() => {
                setMenuAberto(false)
                onAbrirVitrine()
              }}
            >
              <span>◉</span>

              <div>
                <strong>
                  Minha vitrine
                </strong>

                <small>
                  Visualizar como cliente
                </small>
              </div>

              <b>›</b>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() => {
                setMenuAberto(false)
                onAbrirEditarEmpresa()
              }}
            >
              <span>⚙</span>

              <div>
                <strong>
                  Configurações
                </strong>

                <small>
                  Configure os dados do seu negócio
                </small>
              </div>

              <b>›</b>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={() =>
                setMenuAberto(false)
              }
            >
              <span>?</span>

              <div>
                <strong>
                  Ajuda
                </strong>

                <small>
                  Encontre respostas e orientações
                </small>
              </div>

              <b>›</b>
            </button>

            <div className="negocio-menu-divider" />

            <button
              type="button"
              className="negocio-menu-item negocio-menu-exit"
              onClick={onSair}
            >
              <span>↩</span>

              <div>
                <strong>
                  Sair
                </strong>

                <small>
                  Encerrar acesso ao negócio
                </small>
              </div>

              <b>›</b>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .negocio-page {
          min-height: 100vh;
          padding-bottom: 80px;
          background: #f7f7f5;
          color: #222;
          font-family: Arial, sans-serif;
        }

        .negocio-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255,255,255,.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e7e7e5;
        }

        .negocio-topbar-inner {
          width: 100%;
          max-width: 1180px;
          min-height: 72px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .negocio-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .negocio-brand-logo {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f1ef;
          flex-shrink: 0;
        }

        .negocio-brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .negocio-brand-logo > * {
          max-width: 80%;
          max-height: 80%;
        }

        .negocio-brand-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .negocio-brand-info strong {
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .negocio-brand-info span {
          font-size: 12px;
          color: #888;
        }

        .negocio-menu-button {
          width: 44px;
          height: 44px;
          border: 1px solid #e7e7e5;
          border-radius: 13px;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }

        .negocio-menu-button span {
          width: 18px;
          height: 2px;
          border-radius: 2px;
          background: #222;
        }

        .negocio-main {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 24px 20px 40px;
        }

        .negocio-hero {
          position: relative;
          overflow: hidden;
          min-height: 360px;
          border-radius: 28px;
          background: #e8e8e5;
          margin-bottom: 20px;
        }

        .negocio-hero-background {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
        }

        .negocio-hero-background::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,.04),
            rgba(0,0,0,.62)
          );
        }

        .negocio-hero-placeholder {
          width: 100%;
          height: 100%;
          min-height: 360px;
          background: linear-gradient(
            135deg,
            #ededeb,
            #dcdcd8
          );
        }

        .negocio-hero-content {
          position: relative;
          z-index: 2;
          min-height: 360px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          color: #fff;
        }

        .negocio-logo-large {
          width: 84px;
          height: 84px;
          border-radius: 22px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          margin-bottom: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.15);
        }

        .negocio-logo-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .negocio-logo-large > * {
          max-width: 75%;
          max-height: 75%;
        }

        .negocio-hero-text h1 {
          margin: 0;
          font-size: clamp(28px,5vw,46px);
          line-height: 1.05;
          letter-spacing: -1.2px;
        }

        .negocio-hero-text p {
          margin: 9px 0 0;
          color: rgba(255,255,255,.82);
          font-size: 15px;
        }

        .negocio-status {
          margin-top: 18px;
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.18);
          font-size: 12px;
          font-weight: 700;
        }

        .negocio-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #72df93;
        }

        .negocio-welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 28px;
          background: #fff;
          border: 1px solid #ebebe8;
          border-radius: 24px;
          margin-bottom: 36px;
        }

        .negocio-eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #999;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .negocio-welcome h2,
        .negocio-section-heading h2 {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
          letter-spacing: -.5px;
        }

        .negocio-welcome p {
          max-width: 670px;
          margin: 10px 0 0;
          color: #777;
          line-height: 1.55;
          font-size: 14px;
        }

        .negocio-outline-button,
        .negocio-primary-button {
          border: 0;
          cursor: pointer;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 700;
          border-radius: 14px;
          padding: 13px 18px;
        }

        .negocio-outline-button {
          background: #fff;
          border: 1px solid #ddd;
          color: #222;
        }

        .negocio-primary-button {
          background: #222;
          color: #fff;
        }

        .negocio-section {
          margin-bottom: 38px;
        }

        .negocio-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 16px;
        }

        .negocio-progress {
          color: #999;
          font-size: 13px;
          font-weight: 700;
        }

        .negocio-checklist {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 10px;
        }

        .negocio-check-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
          text-align: left;
          padding: 16px;
          border: 1px solid #e9e9e6;
          border-radius: 18px;
          background: #fff;
          cursor: pointer;
        }

        .negocio-check-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f1f1ee;
          color: #999;
          font-size: 13px;
        }

        .negocio-check-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .negocio-check-content strong {
          color: #2b2b2b;
          font-size: 14px;
        }

        .negocio-check-content small {
          color: #999;
          font-size: 12px;
          line-height: 1.35;
        }

        .negocio-arrow {
          color: #aaa;
          font-size: 24px;
          line-height: 1;
        }

        .negocio-actions-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 12px;
        }

        .negocio-action {
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 8px;
          padding: 20px;
          border: 1px solid #e8e8e5;
          border-radius: 20px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            transform .18s ease,
            box-shadow .18s ease;
        }

        .negocio-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,.06);
        }

        .negocio-action-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f1f1ee;
          color: #333;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .negocio-action strong {
          font-size: 14px;
        }

        .negocio-action small {
          color: #999;
          line-height: 1.4;
          font-size: 12px;
        }

        .negocio-vitrine-action {
          border-color: #d9d9d5;
          background: #fdfdfc;
        }

        .negocio-unit-card {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: #fff;
          border: 1px solid #e8e8e5;
          border-radius: 20px;
          text-align: left;
          cursor: pointer;
        }

        .negocio-unit-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f1f1ee;
          font-size: 20px;
        }

        .negocio-unit-content {
          min-width: 0;
          flex: 1;
        }

        .negocio-unit-content strong {
          display: block;
          font-size: 15px;
        }

        .negocio-unit-content p {
          margin: 7px 0 4px;
          color: #777;
          line-height: 1.5;
          font-size: 13px;
        }

        .negocio-unit-content span {
          color: #aaa;
          font-size: 12px;
        }

        .negocio-unit-arrow {
          color: #aaa;
          font-size: 24px;
          line-height: 1;
          padding-top: 7px;
        }

        .negocio-vitrine-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 28px;
          border-radius: 24px;
          background: #222;
          color: #fff;
        }

        .negocio-vitrine-cta .negocio-eyebrow {
          color: #999;
        }

        .negocio-vitrine-cta h2 {
          margin: 0;
          font-size: 25px;
          line-height: 1.2;
          letter-spacing: -.5px;
        }

        .negocio-vitrine-cta p {
          max-width: 620px;
          margin: 10px 0 0;
          color: #aaa;
          line-height: 1.5;
          font-size: 13px;
        }

        .negocio-vitrine-cta .negocio-primary-button {
          background: #fff;
          color: #222;
        }

        .negocio-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 40;
          height: 72px;
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 4px;
          padding: 6px 10px;
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(12px);
          border-top: 1px solid #e7e7e5;
        }

        .negocio-nav-button {
          width: 100%;
          max-width: 130px;
          border: 0;
          background: transparent;
          color: #999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-radius: 12px;
          cursor: pointer;
        }

        .negocio-nav-button span {
          font-size: 19px;
          line-height: 1;
        }

        .negocio-nav-button small {
          font-size: 10px;
          font-weight: 700;
        }

        .negocio-nav-active {
          color: #222;
          background: #f5f5f2;
        }

        .negocio-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          justify-content: flex-end;
          background: rgba(0,0,0,.38);
        }

        .negocio-menu {
          width: min(420px,100%);
          height: 100%;
          padding: 26px 20px;
          background: #fff;
          overflow-y: auto;
          animation: negocioMenuIn .2s ease;
        }

        @keyframes negocioMenuIn {
          from {
            transform: translateX(30px);
            opacity: .7;
          }

          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .negocio-menu-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 24px;
        }

        .negocio-menu-header h2 {
          margin: 0;
          font-size: 22px;
        }

        .negocio-menu-close {
          width: 40px;
          height: 40px;
          border: 1px solid #e5e5e2;
          border-radius: 12px;
          background: #fff;
          font-size: 24px;
          cursor: pointer;
        }

        .negocio-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 4px;
          border: 0;
          border-bottom: 1px solid #eeeeeb;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .negocio-menu-item > span {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: #f2f2ef;
          color: #333;
        }

        .negocio-menu-item > div {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .negocio-menu-item strong {
          font-size: 14px;
        }

        .negocio-menu-item small {
          font-size: 11px;
          color: #999;
        }

        .negocio-menu-item b {
          color: #aaa;
          font-size: 22px;
          font-weight: 400;
        }

        .negocio-menu-divider {
          height: 22px;
        }

        .negocio-menu-exit {
          color: #a33;
        }

        .negocio-menu-exit > span {
          color: #a33;
          background: #f8eeee;
        }

        .negocio-menu-exit strong {
          color: #a33;
        }

        @media (max-width:760px) {
          .negocio-main {
            padding: 14px 14px 28px;
          }

          .negocio-hero,
          .negocio-hero-placeholder {
            min-height: 320px;
          }

          .negocio-hero-content {
            min-height: 320px;
            padding: 22px;
          }

          .negocio-welcome {
            flex-direction: column;
            align-items: stretch;
            padding: 22px;
          }

          .negocio-outline-button {
            width: 100%;
          }

          .negocio-checklist {
            grid-template-columns: 1fr;
          }

          .negocio-actions-grid {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .negocio-vitrine-cta {
            flex-direction: column;
            align-items: flex-start;
          }

          .negocio-vitrine-cta .negocio-primary-button {
            width: 100%;
          }
        }

        @media (max-width:480px) {
          .negocio-topbar-inner {
            padding: 10px 14px;
          }

          .negocio-brand-info strong {
            max-width: 190px;
          }

          .negocio-hero {
            border-radius: 22px;
          }

          .negocio-hero-content {
            padding: 20px;
          }

          .negocio-logo-large {
            width: 70px;
            height: 70px;
            border-radius: 18px;
          }

          .negocio-hero-text h1 {
            font-size: 30px;
          }

          .negocio-section-heading h2 {
            font-size: 21px;
          }

          .negocio-actions-grid {
            grid-template-columns: 1fr;
          }

          .negocio-action {
            min-height: auto;
          }

          .negocio-vitrine-cta {
            padding: 22px;
          }

          .negocio-vitrine-cta h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  )
}