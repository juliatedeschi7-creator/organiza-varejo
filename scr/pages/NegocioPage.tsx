import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface NegocioPageProps {
  empresaId: string
  onSair: () => void
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
  latitude: number | null
  longitude: number | null
  ativa: boolean
}

export default function NegocioPage({
  empresaId,
  onSair,
}: NegocioPageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [filial, setFilial] = useState<Filial | null>(null)

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    carregarNegocio()
  }, [empresaId])

  async function carregarNegocio() {
    setCarregando(true)
    setErro('')

    const [
      empresaResponse,
      filialResponse,
    ] = await Promise.all([
      supabase
        .from('empresas')
        .select(
          `
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
          `,
        )
        .eq('id', empresaId)
        .single(),

      supabase
        .from('filiais')
        .select(
          `
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
            latitude,
            longitude,
            ativa
          `,
        )
        .eq('empresa_id', empresaId)
        .eq('ativa', true)
        .order('created_at', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle(),
    ])

    if (empresaResponse.error) {
      console.error(
        'Erro ao carregar empresa:',
        empresaResponse.error,
      )

      setErro(
        'Não foi possível carregar os dados do seu negócio.',
      )

      setCarregando(false)
      return
    }

    if (filialResponse.error) {
      console.error(
        'Erro ao carregar unidade:',
        filialResponse.error,
      )

      setErro(
        'O negócio foi encontrado, mas não foi possível carregar sua unidade.',
      )

      setCarregando(false)
      return
    }

    setEmpresa(empresaResponse.data)
    setFilial(filialResponse.data)

    setCarregando(false)
  }

  function formatarEndereco() {
    if (!filial) {
      return ''
    }

    const partes = [
      filial.logradouro,
      filial.numero,
      filial.bairro,
    ].filter(Boolean)

    return partes.join(', ')
  }

  function localidade() {
    const cidade = filial?.cidade || empresa?.cidade
    const estado = filial?.estado || empresa?.estado

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

  function dadosPrincipaisCompletos() {
    if (!empresa) {
      return false
    }

    return Boolean(
      empresa.nome_fantasia &&
        empresa.whatsapp &&
        filial?.logradouro &&
        filial?.numero &&
        filial?.bairro &&
        filial?.cidade &&
        filial?.estado,
    )
  }

  if (carregando) {
    return (
      <main className="negocio-page">
        <div className="negocio-loading">
          <div className="negocio-loading-logo">
            <Logo />
          </div>

          <p>Carregando seu negócio...</p>
        </div>
      </main>
    )
  }

  if (erro || !empresa) {
    return (
      <main className="negocio-page">
        <section className="negocio-error">
          <div className="negocio-error-logo">
            <Logo />
          </div>

          <h1>Não foi possível abrir seu negócio</h1>

          <p>
            {erro ||
              'Os dados do negócio não foram encontrados.'}
          </p>

          <button
            type="button"
            className="negocio-primary-button"
            onClick={carregarNegocio}
          >
            Tentar novamente
          </button>

          <button
            type="button"
            className="negocio-text-button"
            onClick={onSair}
          >
            Voltar
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="negocio-page">
      <style>{`
        .negocio-page {
          min-height: 100vh;
          background: #f7f6f3;
          color: #171717;
          padding-bottom: 90px;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .negocio-shell {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        /* ==========================
           TOPO
           ========================== */

        .negocio-topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(247, 246, 243, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 16px 18px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .negocio-topbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .negocio-topbar-brand {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .negocio-topbar-brand > * {
          max-width: 100%;
          max-height: 100%;
        }

        .negocio-topbar-info {
          min-width: 0;
          flex: 1;
        }

        .negocio-name-row {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .negocio-name-row h1 {
          margin: 0;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .negocio-name-row button {
          border: 0;
          background: transparent;
          padding: 2px;
          font-size: 16px;
          cursor: pointer;
        }

        .negocio-unidade {
          margin: 4px 0 0;
          color: #777;
          font-size: 13px;
          line-height: 1.2;
        }

        .negocio-top-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .negocio-icon-button {
          width: 38px;
          height: 38px;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          cursor: pointer;
        }

        /* ==========================
           CAPA / IDENTIDADE
           ========================== */

        .negocio-cover {
          position: relative;
          min-height: 235px;
          margin: 0;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 20% 30%,
              rgba(255, 255, 255, 0.95),
              transparent 34%
            ),
            linear-gradient(
              135deg,
              #eee7dc,
              #f8f5ef
            );
        }

        .negocio-cover-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.65;
        }

        .negocio-cover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.78)
          );
        }

        .negocio-cover-content {
          position: relative;
          z-index: 2;
          min-height: 235px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 20px;
          box-sizing: border-box;
        }

        .negocio-logo {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 15px;
        }

        .negocio-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .negocio-logo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          font-weight: 800;
          color: #777;
          background: #fafafa;
        }

        .negocio-cover-content h2 {
          margin: 0;
          font-size: 25px;
          line-height: 1.15;
          font-weight: 850;
          letter-spacing: -0.4px;
        }

        .negocio-cover-location {
          margin: 7px 0 12px;
          color: #555;
          font-size: 14px;
          font-weight: 600;
        }

        .negocio-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #e4f5e8;
          color: #28733c;
          font-size: 12px;
          font-weight: 700;
        }

        .negocio-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #38a85a;
        }

        /* ==========================
           CONTEÚDO
           ========================== */

        .negocio-content {
          padding: 18px 16px 30px;
        }

        .negocio-card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 18px;
          box-shadow: 0 5px 18px rgba(0, 0, 0, 0.045);
        }

        .negocio-welcome {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          margin-bottom: 25px;
        }

        .negocio-welcome-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 14px;
          background: #eef8f1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .negocio-welcome-text {
          min-width: 0;
          flex: 1;
        }

        .negocio-welcome-text h3 {
          margin: 0 0 4px;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 800;
        }

        .negocio-welcome-text p {
          margin: 0;
          color: #555;
          font-size: 14px;
          line-height: 1.45;
        }

        .negocio-arrow {
          flex-shrink: 0;
          font-size: 20px;
          color: #777;
        }

        /* ==========================
           CHECKLIST
           ========================== */

        .negocio-section-title {
          margin: 0 0 12px;
        }

        .negocio-section-title h2 {
          margin: 0;
          font-size: 21px;
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -0.25px;
        }

        .negocio-section-title p {
          margin: 5px 0 0;
          color: #777;
          font-size: 14px;
          line-height: 1.35;
        }

        .negocio-checklist {
          overflow: hidden;
          margin-bottom: 28px;
        }

        .negocio-check-item {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 64px;
          padding: 12px 14px;
          box-sizing: border-box;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }

        .negocio-check-item:last-child {
          border-bottom: 0;
        }

        .negocio-check-icon {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 2px solid #c7c7c7;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          font-size: 13px;
          font-weight: 800;
        }

        .negocio-check-icon.completed {
          background: #3ca75c;
          border-color: #3ca75c;
          color: #fff;
        }

        .negocio-check-text {
          flex: 1;
          min-width: 0;
        }

        .negocio-check-text strong {
          display: block;
          font-size: 14px;
          line-height: 1.25;
          font-weight: 750;
        }

        .negocio-check-text span {
          display: block;
          margin-top: 3px;
          color: #777;
          font-size: 12px;
          line-height: 1.3;
        }

        .negocio-check-arrow {
          color: #999;
          font-size: 19px;
        }

        .negocio-tip {
          margin-top: 12px;
          padding: 14px;
          border-radius: 15px;
          background: #edf8ed;
          color: #3d6341;
          font-size: 13px;
          line-height: 1.4;
        }

        /* ==========================
           AÇÕES
           ========================== */

        .negocio-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
          margin-bottom: 28px;
        }

        .negocio-action {
          min-height: 130px;
          padding: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 17px;
          background: #fff;
          text-align: left;
          box-shadow: 0 5px 18px rgba(0, 0, 0, 0.04);
          cursor: pointer;
        }

        .negocio-action:active {
          transform: scale(0.985);
        }

        .negocio-action-icon {
          width: 39px;
          height: 39px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          background: #f0eefb;
          font-size: 20px;
        }

        .negocio-action:nth-child(2) .negocio-action-icon {
          background: #edf8f5;
        }

        .negocio-action:nth-child(3) .negocio-action-icon {
          background: #fff4e8;
        }

        .negocio-action:nth-child(4) .negocio-action-icon {
          background: #f3effb;
        }

        .negocio-action strong {
          display: block;
          font-size: 15px;
          line-height: 1.2;
          font-weight: 800;
        }

        .negocio-action span {
          display: block;
          margin-top: 5px;
          color: #777;
          font-size: 12px;
          line-height: 1.35;
        }

        .negocio-vitrine-action {
          grid-column: 1 / -1;
          min-height: 92px;
        }

        .negocio-vitrine-action-content {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .negocio-vitrine-action .negocio-action-icon {
          margin-bottom: 0;
          flex-shrink: 0;
        }

        /* ==========================
           UNIDADE
           ========================== */

        .negocio-unit-card {
          padding: 16px;
          margin-top: 12px;
          margin-bottom: 28px;
        }

        .negocio-unit-header {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .negocio-unit-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 14px;
          background: #edf8f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .negocio-unit-info {
          min-width: 0;
          flex: 1;
        }

        .negocio-unit-info strong {
          display: block;
          font-size: 15px;
          line-height: 1.25;
        }

        .negocio-unit-info span {
          display: block;
          margin-top: 4px;
          color: #777;
          font-size: 12px;
        }

        .negocio-unit-button {
          margin-top: 14px;
          width: 100%;
          padding: 11px 13px;
          border: 1px solid #ddd;
          border-radius: 11px;
          background: #fff;
          text-align: left;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .negocio-address {
          margin-top: 12px;
          min-height: 130px;
          padding: 16px;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #f1eee7,
              #faf9f6
            );
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #555;
        }

        .negocio-address-pin {
          font-size: 28px;
          margin-bottom: 5px;
        }

        .negocio-address strong {
          display: block;
          color: #222;
          font-size: 13px;
        }

        .negocio-address span {
          display: block;
          margin-top: 3px;
          font-size: 12px;
        }

        /* ==========================
           RODAPÉ / NAVEGAÇÃO
           ========================== */

        .negocio-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          padding: 8px max(10px, env(safe-area-inset-left))
            calc(8px + env(safe-area-inset-bottom))
            max(10px, env(safe-area-inset-right));
          background: rgba(255, 255, 255, 0.96);
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
        }

        .negocio-nav-button {
          border: 0;
          background: transparent;
          min-height: 53px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: #777;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .negocio-nav-button strong {
          font-size: 19px;
          line-height: 1;
        }

        .negocio-nav-button.active {
          color: #171717;
        }

        /* ==========================
           MENU
           ========================== */

        .negocio-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.28);
          display: flex;
          align-items: flex-end;
        }

        .negocio-menu {
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-sizing: border-box;
          padding: 18px 18px calc(20px + env(safe-area-inset-bottom));
          border-radius: 24px 24px 0 0;
          background: #fff;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
        }

        .negocio-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .negocio-menu-header strong {
          font-size: 17px;
        }

        .negocio-menu-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          background: #f2f2f2;
          cursor: pointer;
          font-size: 18px;
        }

        .negocio-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 4px;
          border: 0;
          border-bottom: 1px solid #eee;
          background: transparent;
          text-align: left;
          font-size: 14px;
          font-weight: 650;
          color: #222;
        }

        .negocio-menu-item span:first-child {
          width: 25px;
          text-align: center;
        }

        /* ==========================
           LOADING / ERRO
           ========================== */

        .negocio-loading,
        .negocio-error {
          min-height: 100vh;
          padding: 40px 25px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .negocio-loading-logo,
        .negocio-error-logo {
          width: 80px;
          margin-bottom: 20px;
        }

        .negocio-loading p {
          color: #777;
          font-size: 15px;
        }

        .negocio-error h1 {
          max-width: 350px;
          margin: 0;
          font-size: 25px;
          line-height: 1.15;
        }

        .negocio-error p {
          max-width: 350px;
          color: #666;
          line-height: 1.45;
        }

        .negocio-primary-button {
          border: 0;
          border-radius: 13px;
          padding: 14px 20px;
          background: #171717;
          color: #fff;
          font-size: 15px;
          font-weight: 750;
          cursor: pointer;
        }

        .negocio-text-button {
          margin-top: 14px;
          border: 0;
          background: transparent;
          color: #555;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
        }

        @media (min-width: 700px) {
          .negocio-page {
            padding-bottom: 30px;
          }

          .negocio-bottom-nav {
            left: 50%;
            right: auto;
            bottom: 18px;
            width: min(620px, calc(100% - 30px));
            transform: translateX(-50%);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 18px;
            padding-bottom: 8px;
          }
        }
      `}</style>

      <div className="negocio-shell">
        <header className="negocio-topbar">
          <div className="negocio-topbar-row">
            <div className="negocio-topbar-brand">
              <Logo />
            </div>

            <div className="negocio-topbar-info">
              <div className="negocio-name-row">
                <h1>{empresa.nome_fantasia}</h1>

                <button
                  type="button"
                  aria-label="Selecionar unidade"
                  onClick={() => {
                    // A seleção de múltiplas unidades será adicionada
                    // quando essa funcionalidade estiver disponível.
                  }}
                >
                 ⌄
                </button>
              </div>

              <p className="negocio-unidade">
                {filial?.nome || 'Unidade principal'}
              </p>
            </div>

            <div className="negocio-top-actions">
              <button
                type="button"
                className="negocio-icon-button"
                aria-label="Notificações"
                onClick={() => {
                  // Área de notificações será conectada posteriormente.
                }}
              >
                ♧
              </button>

              <button
                type="button"
                className="negocio-icon-button"
                aria-label="Abrir menu"
                onClick={() => setMenuAberto(true)}
              >
                ☰
              </button>
            </div>
          </div>
        </header>

        <section className="negocio-cover">
          {empresa.banner_url && (
            <img
              src={empresa.banner_url}
              alt=""
              className="negocio-cover-image"
            />
          )}

          <div className="negocio-cover-overlay" />

          <div className="negocio-cover-content">
            <div className="negocio-logo">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={`Logo de ${empresa.nome_fantasia}`}
                />
              ) : (
                <div className="negocio-logo-placeholder">
                  {empresa.nome_fantasia
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <h2>{empresa.nome_fantasia}</h2>

            <p className="negocio-cover-location">
              {localidade()}
            </p>

            <span className="negocio-status">
              <span className="negocio-status-dot" />
              {empresa.status === 'ativa'
                ? 'Negócio ativo'
                : empresa.status}
            </span>
          </div>
        </section>

        <div className="negocio-content">
          <section className="negocio-card negocio-welcome">
            <div className="negocio-welcome-icon">
              ✦
            </div>

            <div className="negocio-welcome-text">
              <h3>Bem-vinda!</h3>

              <p>
                Seu negócio está no Organiza.
                Agora vamos deixar tudo pronto
                para você começar a usar.
              </p>
            </div>

            <span className="negocio-arrow">›</span>
          </section>

          <section>
            <div className="negocio-section-title">
              <h2>Vamos deixar seu negócio pronto</h2>

              <p>
                Siga os próximos passos quando quiser.
              </p>
            </div>

            <div className="negocio-card negocio-checklist">
              <div className="negocio-check-item">
                <div
                  className={`negocio-check-icon ${
                    dadosPrincipaisCompletos()
                      ? 'completed'
                      : ''
                  }`}
                >
                  {dadosPrincipaisCompletos() ? '✓' : ''}
                </div>

                <div className="negocio-check-text">
                  <strong>Dados principais</strong>

                  <span>
                    Nome, contato e endereço
                  </span>
                </div>

                <span className="negocio-check-arrow">
                  ›
                </span>
              </div>

              <div className="negocio-check-item">
                <div
                  className={`negocio-check-icon ${
                    filial ? 'completed' : ''
                  }`}
                >
                  {filial ? '✓' : ''}
                </div>

                <div className="negocio-check-text">
                  <strong>Endereço</strong>

                  <span>
                    Localização da sua unidade
                  </span>
                </div>

                <span className="negocio-check-arrow">
                  ›
                </span>
              </div>

              <div className="negocio-check-item">
                <div
                  className={`negocio-check-icon ${
                    empresa.logo_url ? 'completed' : ''
                  }`}
                >
                  {empresa.logo_url ? '✓' : ''}
                </div>

                <div className="negocio-check-text">
                  <strong>Adicionar logo</strong>

                  <span>
                    Deixe seu negócio com a sua cara
                  </span>
                </div>

                <span className="negocio-check-arrow">
                  ›
                </span>
              </div>

              <div className="negocio-check-item">
                <div className="negocio-check-icon" />

                <div className="negocio-check-text">
                  <strong>Personalizar sua vitrine</strong>

                  <span>
                    Apresente seu negócio aos clientes
                  </span>
                </div>

                <span className="negocio-check-arrow">
                  ›
                </span>
              </div>

              <div className="negocio-check-item">
                <div className="negocio-check-icon" />

                <div className="negocio-check-text">
                  <strong>
                    Cadastrar produtos ou serviços
                  </strong>

                  <span>
                    Mostre o que você oferece
                  </span>
                </div>

                <span className="negocio-check-arrow">
                  ›
                </span>
              </div>
            </div>

            <div className="negocio-tip">
              💡 Você consegue fazer isso depois.
              O importante é dar o primeiro passo.
            </div>
          </section>

          <section style={{ marginTop: 30 }}>
            <div className="negocio-section-title">
              <h2>O que você quer fazer?</h2>

              <p>
                Acesse rapidamente o que mais precisa agora.
              </p>
            </div>

            <div className="negocio-actions">
              <button
                type="button"
                className="negocio-action"
                onClick={() => {
                  console.log(
                    'Abrir produtos e serviços',
                  )
                }}
              >
                <div className="negocio-action-icon">
                  🛍️
                </div>

                <strong>
                  Produtos e serviços
                </strong>

                <span>
                  Cadastre o que seu negócio oferece.
                </span>
              </button>

              <button
                type="button"
                className="negocio-action"
                onClick={() => {
                  console.log('Abrir clientes')
                }}
              >
                <div className="negocio-action-icon">
                  👥
                </div>

                <strong>Clientes</strong>

                <span>
                  Veja e organize seus clientes.
                </span>
              </button>

              <button
                type="button"
                className="negocio-action"
                onClick={() => {
                  console.log('Abrir estoque')
                }}
              >
                <div className="negocio-action-icon">
                  📦
                </div>

                <strong>Estoque</strong>

                <span>
                  Acompanhe seus produtos e quantidades.
                </span>
              </button>

              <button
                type="button"
                className="negocio-action"
                onClick={() => {
                  console.log('Abrir vendas')
                }}
              >
                <div className="negocio-action-icon">
                  📊
                </div>

                <strong>Vendas</strong>

                <span>
                  Registre e acompanhe suas vendas.
                </span>
              </button>

              <button
                type="button"
                className="negocio-action negocio-vitrine-action"
                onClick={() => {
                  console.log('Abrir vitrine')
                }}
              >
                <div className="negocio-vitrine-action-content">
                  <div className="negocio-action-icon">
                    🏪
                  </div>

                  <div>
                    <strong>Minha vitrine</strong>

                    <span>
                      Veja como seu negócio aparece
                      para os clientes.
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section>
            <div className="negocio-section-title">
              <h2>Sua unidade</h2>

              <p>
                A unidade principal criada para o seu negócio.
              </p>
            </div>

            <div className="negocio-card negocio-unit-card">
              <div className="negocio-unit-header">
                <div className="negocio-unit-icon">
                  🏪
                </div>

                <div className="negocio-unit-info">
                  <strong>
                    {filial?.nome ||
                      'Unidade principal'}
                  </strong>

                  <span>
                    {localidade()}
                  </span>
                </div>
              </div>

              {filial && (
                <button
                  type="button"
                  className="negocio-unit-button"
                  onClick={() => {
                    console.log(
                      'Abrir detalhes da unidade',
                    )
                  }}
                >
                  Ver detalhes da unidade
                  <span style={{ float: 'right' }}>
                    ›
                  </span>
                </button>
              )}

              {filial && (
                <div className="negocio-address">
                  <div>
                    <div className="negocio-address-pin">
                      📍
                    </div>

                    <strong>
                      {localidade()}
                    </strong>

                    <span>
                      {formatarEndereco() ||
                        'Endereço ainda não informado'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <nav className="negocio-bottom-nav">
        <button
          type="button"
          className="negocio-nav-button active"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            })
          }
        >
          <strong>⌂</strong>
          <span>Início</span>
        </button>

        <button
          type="button"
          className="negocio-nav-button"
          onClick={() => {
            console.log('Abrir vitrine')
          }}
        >
          <strong>▣</strong>
          <span>Vitrine</span>
        </button>

        <button
          type="button"
          className="negocio-nav-button"
          onClick={() => {
            console.log('Abrir operação')
          }}
        >
          <strong>◇</strong>
          <span>Operação</span>
        </button>

        <button
          type="button"
          className="negocio-nav-button"
          onClick={() => {
            console.log('Abrir clientes')
          }}
        >
          <strong>♧</strong>
          <span>Clientes</span>
        </button>

        <button
          type="button"
          className="negocio-nav-button"
          onClick={() => setMenuAberto(true)}
        >
          <strong>☰</strong>
          <span>Mais</span>
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
              <strong>Meu negócio</strong>

              <button
                type="button"
                className="negocio-menu-close"
                onClick={() => setMenuAberto(false)}
              >
                ×
              </button>
            </div>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>🛍️</span>
              <span>Produtos e serviços</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>👥</span>
              <span>Clientes</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>📦</span>
              <span>Estoque</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>📊</span>
              <span>Vendas</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>🧾</span>
              <span>Pedidos</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>💰</span>
              <span>Caixa</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>👤</span>
              <span>Equipe</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>🏪</span>
              <span>Unidades</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
            >
              <span>⚙️</span>
              <span>Configurações</span>
            </button>

            <button
              type="button"
              className="negocio-menu-item"
              onClick={onSair}
            >
              <span>↩</span>
              <span>Sair do negócio</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
