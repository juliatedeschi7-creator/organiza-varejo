import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface InicioPageProps {
  onExplorar: () => void
  onCadastrarNegocio: () => void
  onAgoraNao: () => void
  onAbrirEmpresa: (empresaId: string) => void
}

interface MembroEmpresa {
  empresa_id: string
  status: string
  ativo: boolean | null
}

interface Empresa {
  id: string
  nome_fantasia: string
  cidade: string | null
  estado: string | null
  logo_url: string | null
  status: string
}

export default function InicioPage({
  onExplorar,
  onCadastrarNegocio,
  onAgoraNao,
  onAbrirEmpresa,
}: InicioPageProps) {
  const [nome, setNome] = useState('')
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(true)
  const [erroEmpresas, setErroEmpresas] = useState('')

  useEffect(() => {
    async function carregarInicio() {
      setCarregandoEmpresas(true)
      setErroEmpresas('')

      const { data: usuarioData, error: usuarioError } =
        await supabase.auth.getUser()

      if (usuarioError) {
        console.error(
          'Erro ao obter usuário autenticado:',
          usuarioError,
        )

        setErroEmpresas(
          usuarioError.message ||
            'Não foi possível identificar sua conta.',
        )

        setCarregandoEmpresas(false)
        return
      }

      const usuario = usuarioData.user

      if (!usuario) {
        console.error(
          'Nenhum usuário autenticado encontrado.',
        )

        setErroEmpresas(
          'Não foi possível identificar sua conta.',
        )

        setCarregandoEmpresas(false)
        return
      }

      const nomeUsuario =
        usuario.user_metadata?.nome ||
        usuario.user_metadata?.name ||
        ''

      if (nomeUsuario) {
        setNome(nomeUsuario.split(' ')[0])
      }

      console.log(
        'USUÁRIO LOGADO NO ORGANIZA:',
        usuario,
      )

      console.log(
        'ID DO USUÁRIO LOGADO:',
        usuario.id,
      )

      const { data: membrosData, error: membrosError } =
        await supabase
          .from('membros_empresa')
          .select('empresa_id, status, ativo')
          .eq('usuario_id', usuario.id)

      console.log(
        'MEMBROS ENCONTRADOS:',
        membrosData,
      )

      console.log(
        'ERRO AO BUSCAR MEMBROS:',
        membrosError,
      )

      if (membrosError) {
        console.error(
          'Erro ao carregar empresas do usuário:',
          membrosError,
        )

        setErroEmpresas(
          `${membrosError.message || 'Erro ao carregar empresas.'} | Usuário: ${usuario.id}`,
        )

        setEmpresas([])
        setCarregandoEmpresas(false)
        return
      }

      const membros =
        (membrosData ?? []) as MembroEmpresa[]

      const empresaIds = membros
        .filter(
          (membro) =>
            membro.status === 'ativo' &&
            membro.ativo !== false,
        )
        .map((membro) => membro.empresa_id)

      console.log(
        'EMPRESAS ENCONTRADAS NOS VÍNCULOS:',
        empresaIds,
      )

      if (empresaIds.length === 0) {
        setEmpresas([])
        setCarregandoEmpresas(false)
        return
      }

      const { data: empresasData, error: empresasError } =
        await supabase
          .from('empresas')
          .select(
            `
              id,
              nome_fantasia,
              cidade,
              estado,
              logo_url,
              status
            `,
          )
          .in('id', empresaIds)
          .order('nome_fantasia', {
            ascending: true,
          })

      console.log(
        'EMPRESAS CARREGADAS:',
        empresasData,
      )

      console.log(
        'ERRO AO BUSCAR EMPRESAS:',
        empresasError,
      )

      if (empresasError) {
        console.error(
          'Erro ao carregar dados das empresas:',
          empresasError,
        )

        setErroEmpresas(
          `${empresasError.message || 'Erro ao carregar os dados das empresas.'} | Usuário: ${usuario.id}`,
        )

        setEmpresas([])
        setCarregandoEmpresas(false)
        return
      }

      setEmpresas((empresasData ?? []) as Empresa[])
      setCarregandoEmpresas(false)
    }

    carregarInicio()
  }, [])

  return (
    <main className="inicio-page">
      <div className="inicio-background-shape inicio-background-shape--top" />
      <div className="inicio-background-shape inicio-background-shape--bottom" />

      <section
        className="inicio-content"
        aria-label="Início do Organiza"
      >
        <header className="inicio-header">
          <Logo />
        </header>

        <section className="inicio-intro">
          <h1>
            Olá
            {nome ? `, ${nome}` : ''}!
            <span
              className="inicio-wave"
              aria-hidden="true"
            >
              👋
            </span>
          </h1>

          <h2>Como você quer começar?</h2>

          <p>
            Escolha o que faz mais sentido para você agora.
            <br className="inicio-desktop-break" />
            Você pode mudar de ideia quando quiser.
          </p>
        </section>

        {carregandoEmpresas && (
          <section className="inicio-minhas-empresas">
            <div className="inicio-minhas-empresas-header">
              <div>
                <span className="inicio-section-label">
                  SEUS NEGÓCIOS
                </span>

                <h3>Minhas empresas</h3>
              </div>
            </div>

            <div className="inicio-empresas-loading">
              <span className="inicio-loading-spinner" />

              <span>
                Carregando suas empresas...
              </span>
            </div>
          </section>
        )}

        {!carregandoEmpresas &&
          erroEmpresas && (
            <section className="inicio-minhas-empresas">
              <div className="inicio-minhas-empresas-header">
                <div>
                  <span className="inicio-section-label">
                    SEUS NEGÓCIOS
                  </span>

                  <h3>Minhas empresas</h3>
                </div>
              </div>

              <div className="inicio-empresas-erro">
                <strong>
                  Não conseguimos carregar suas empresas.
                </strong>

                <span>{erroEmpresas}</span>
              </div>
            </section>
          )}

        {!carregandoEmpresas &&
          !erroEmpresas &&
          empresas.length > 0 && (
            <section className="inicio-minhas-empresas">
              <div className="inicio-minhas-empresas-header">
                <div>
                  <span className="inicio-section-label">
                    SEUS NEGÓCIOS
                  </span>

                  <h3>Minhas empresas</h3>
                </div>

                <span className="inicio-empresas-count">
                  {empresas.length}
                </span>
              </div>

              <div className="inicio-empresas-lista">
                {empresas.map((empresa) => (
                  <button
                    key={empresa.id}
                    type="button"
                    className="inicio-empresa-card"
                    onClick={() =>
                      onAbrirEmpresa(empresa.id)
                    }
                  >
                    <span className="inicio-empresa-logo">
                      {empresa.logo_url ? (
                        <img
                          src={empresa.logo_url}
                          alt=""
                        />
                      ) : (
                        <span>
                          {empresa.nome_fantasia
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </span>

                    <span className="inicio-empresa-info">
                      <strong>
                        {empresa.nome_fantasia}
                      </strong>

                      {(empresa.cidade ||
                        empresa.estado) && (
                        <small>
                          {empresa.cidade}

                          {empresa.cidade &&
                          empresa.estado
                            ? ' • '
                            : ''}

                          {empresa.estado}
                        </small>
                      )}

                      <small className="inicio-empresa-status">
                        {empresa.status === 'ativa'
                          ? 'Empresa ativa'
                          : 'Empresa temporariamente indisponível'}
                      </small>
                    </span>

                    <span
                      className="inicio-empresa-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

        {!carregandoEmpresas &&
          !erroEmpresas &&
          empresas.length === 0 && (
            <section className="inicio-sem-empresas">
              <span className="inicio-section-label">
                SEUS NEGÓCIOS
              </span>

              <h3>Minhas empresas</h3>

              <p>
                Você ainda não cadastrou nenhum negócio.
              </p>
            </section>
          )}

        <section className="inicio-options">
          <button
            type="button"
            className="inicio-option inicio-option--comprar"
            onClick={onExplorar}
          >
            <span
              className="inicio-option__icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 17.5H34L37 39H11L14 17.5Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />

                <path
                  d="M18 18V14C18 10.6863 20.6863 8 24 8C27.3137 8 30 10.6863 30 14V18"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span className="inicio-option__content">
              <strong>
                Explorar lojas e comprar
              </strong>

              <span>
                Encontre negócios locais, conheça
                produtos e serviços perto de você.
              </span>
            </span>

            <span
              className="inicio-option__arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>

          <button
            type="button"
            className="inicio-option inicio-option--negocio"
            onClick={onCadastrarNegocio}
          >
            <span
              className="inicio-option__icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 20L12.5 10H35.5L39 20"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M8 20H40V39H8V20Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />

                <path
                  d="M8 20C8 23.3137 10.6863 26 14 26C17.3137 26 20 23.3137 20 20"
                  stroke="currentColor"
                  strokeWidth="2.4"
                />

                <path
                  d="M20 20C20 23.3137 22.6863 26 26 26C29.3137 26 32 23.3137 32 20"
                  stroke="currentColor"
                  strokeWidth="2.4"
                />

                <path
                  d="M32 20C32 23.3137 34.6863 26 38 26C39 26 40 25.75 40.85 25.3"
                  stroke="currentColor"
                  strokeWidth="2.4"
                />

                <path
                  d="M19 39V30H29V39"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <span className="inicio-option__content">
              <strong>
                {empresas.length > 0
                  ? 'Cadastrar outro negócio'
                  : 'Cadastrar meu negócio'}
              </strong>

              <span>
                {empresas.length > 0
                  ? 'Cadastre outra empresa ou negócio no Organiza.'
                  : 'Leve seu negócio para o Organiza e comece a organizar sua operação.'}
              </span>
            </span>

            <span
              className="inicio-option__arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>
        </section>

        <button
          type="button"
          className="inicio-skip"
          onClick={onAgoraNao}
        >
          <span>Agora não</span>

          <small>
            Conhecer o Organiza primeiro.
          </small>
        </button>
      </section>

      <style>{`
        .inicio-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: #f8f8f8;
          color: #202020;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .inicio-background-shape {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(2px);
        }

        .inicio-background-shape--top {
          width: 360px;
          height: 360px;
          top: -210px;
          right: -150px;
          background: #eeeeee;
        }

        .inicio-background-shape--bottom {
          width: 300px;
          height: 300px;
          bottom: -190px;
          left: -160px;
          background: #eeeeee;
        }

        .inicio-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 620px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 34px 22px 40px;
        }

        .inicio-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 48px;
        }

        .inicio-intro {
          text-align: center;
        }

        .inicio-intro h1 {
          margin: 0;
          font-size: clamp(30px, 7vw, 42px);
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .inicio-wave {
          display: inline-block;
          margin-left: 7px;
          font-size: 0.8em;
        }

        .inicio-intro h2 {
          margin: 13px 0 0;
          font-size: clamp(21px, 5vw, 27px);
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .inicio-intro p {
          margin: 12px auto 0;
          max-width: 480px;
          color: #777;
          font-size: 14px;
          line-height: 1.55;
        }

        .inicio-minhas-empresas {
          margin-top: 30px;
        }

        .inicio-minhas-empresas-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .inicio-section-label {
          display: block;
          margin-bottom: 4px;
          color: #999;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .inicio-minhas-empresas-header h3,
        .inicio-sem-empresas h3 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -0.02em;
        }

        .inicio-empresas-count {
          min-width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          border-radius: 999px;
          background: #222;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }

        .inicio-empresas-lista {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .inicio-empresa-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px;
          border: 1px solid #e2e2e2;
          border-radius: 17px;
          background: #fff;
          color: #222;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 5px 18px rgba(0, 0, 0, 0.035);
          transition:
            transform 0.15s ease,
            border-color 0.15s ease;
        }

        .inicio-empresa-card:hover {
          transform: translateY(-1px);
          border-color: #cfcfcf;
        }

        .inicio-empresa-card:active {
          transform: translateY(0);
        }

        .inicio-empresa-logo {
          width: 52px;
          height: 52px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 14px;
          background: #f0f0f0;
          color: #444;
          font-size: 21px;
          font-weight: 700;
        }

        .inicio-empresa-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .inicio-empresa-info {
          min-width: 0;
          flex: 1;
        }

        .inicio-empresa-info strong,
        .inicio-empresa-info small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .inicio-empresa-info strong {
          font-size: 15px;
        }

        .inicio-empresa-info small {
          margin-top: 3px;
          color: #888;
          font-size: 12px;
        }

        .inicio-empresa-info .inicio-empresa-status {
          color: #999;
          font-size: 11px;
        }

        .inicio-empresa-arrow {
          flex: 0 0 auto;
          color: #888;
          font-size: 21px;
        }

        .inicio-empresas-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 70px;
          padding: 16px;
          border: 1px solid #e7e7e7;
          border-radius: 17px;
          background: #fff;
          color: #888;
          font-size: 12px;
        }

        .inicio-loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ddd;
          border-top-color: #555;
          border-radius: 50%;
          animation: inicioSpinner 0.75s linear infinite;
        }

        @keyframes inicioSpinner {
          to {
            transform: rotate(360deg);
          }
        }

        .inicio-empresas-erro {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 18px;
          border: 1px solid #eadede;
          border-radius: 17px;
          background: #fff;
        }

        .inicio-empresas-erro strong {
          font-size: 14px;
          line-height: 1.4;
        }

        .inicio-empresas-erro span {
          color: #888;
          font-size: 12px;
          line-height: 1.5;
          word-break: break-word;
        }

        .inicio-sem-empresas {
          margin-top: 30px;
          padding: 20px;
          border: 1px dashed #ddd;
          border-radius: 17px;
          background: #fff;
        }

        .inicio-sem-empresas p {
          margin: 7px 0 0;
          color: #888;
          font-size: 13px;
        }

        .inicio-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 28px;
        }

        .inicio-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px;
          border: 1px solid #e2e2e2;
          border-radius: 19px;
          background: #fff;
          color: #222;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.035);
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease;
        }

        .inicio-option:hover {
          transform: translateY(-1px);
          border-color: #d0d0d0;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
        }

        .inicio-option:active {
          transform: translateY(0);
        }

        .inicio-option__icon {
          width: 52px;
          height: 52px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: #f1f1f1;
          color: #222;
        }

        .inicio-option__icon svg {
          width: 30px;
          height: 30px;
        }

        .inicio-option__content {
          min-width: 0;
          flex: 1;
        }

        .inicio-option__content strong,
        .inicio-option__content span {
          display: block;
        }

        .inicio-option__content strong {
          font-size: 15px;
        }

        .inicio-option__content span {
          margin-top: 5px;
          color: #888;
          font-size: 12px;
          line-height: 1.45;
        }

        .inicio-option__arrow {
          flex: 0 0 auto;
          color: #888;
          font-size: 22px;
        }

        .inicio-skip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin: 25px auto 0;
          padding: 8px 12px;
          border: 0;
          background: transparent;
          color: #555;
          cursor: pointer;
        }

        .inicio-skip span {
          font-size: 13px;
          font-weight: 600;
        }

        .inicio-skip small {
          color: #999;
          font-size: 11px;
        }

        @media (max-width: 480px) {
          .inicio-content {
            padding: 28px 16px 34px;
          }

          .inicio-header {
            margin-bottom: 38px;
          }

          .inicio-option {
            padding: 15px;
            gap: 12px;
          }

          .inicio-option__icon {
            width: 47px;
            height: 47px;
            border-radius: 13px;
          }

          .inicio-option__icon svg {
            width: 27px;
            height: 27px;
          }

          .inicio-option__content strong {
            font-size: 14px;
          }

          .inicio-option__content span {
            font-size: 11px;
          }
        }
      `}</style>
    </main>
  )
}