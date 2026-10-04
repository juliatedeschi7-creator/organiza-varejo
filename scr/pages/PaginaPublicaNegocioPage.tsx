import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

function formatarWhatsApp(numero: string | null) {
  if (!numero) return null

  const apenasNumeros = numero.replace(/\D/g, '')

  if (!apenasNumeros) return null

  if (apenasNumeros.startsWith('55')) {
    return apenasNumeros
  }

  return `55${apenasNumeros}`
}

function montarEndereco(filial: Filial) {
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

function PaginaPublicaNegocioPage({
  empresaId,
  onVoltar,
}: PaginaPublicaNegocioPageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [filial, setFilial] = useState<Filial | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [favoritado, setFavoritado] = useState(false)

  useEffect(() => {
    async function carregarNegocio() {
      setCarregando(true)
      setErro('')

      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select(
          `
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
          `,
        )
        .eq('id', empresaId)
        .maybeSingle()

      if (empresaError) {
        console.error(empresaError)
        setErro('Não foi possível carregar o negócio.')
        setCarregando(false)
        return
      }

      if (!empresaData) {
        setErro('Negócio não encontrado.')
        setCarregando(false)
        return
      }

      const { data: filialData, error: filialError } = await supabase
        .from('filiais')
        .select(
          `
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
          `,
        )
        .eq('empresa_id', empresaId)
        .eq('ativa', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (filialError) {
        console.error(filialError)
      }

      setEmpresa(empresaData as Empresa)
      setFilial((filialData as Filial | null) ?? null)
      setCarregando(false)
    }

    carregarNegocio()
  }, [empresaId])

  function compartilhar() {
    if (!empresa) return

    const url = window.location.href

    if (navigator.share) {
      navigator
        .share({
          title: empresa.nome_fantasia,
          text: `Conheça ${empresa.nome_fantasia} no Organiza.`,
          url,
        })
        .catch(() => {
          // O usuário pode simplesmente cancelar o compartilhamento.
        })

      return
    }

    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        window.alert('Link da página copiado.')
      })
      .catch(() => {
        window.alert('Não foi possível copiar o link.')
      })
  }

  function abrirWhatsApp() {
    const numero =
      formatarWhatsApp(filial?.whatsapp) ||
      formatarWhatsApp(empresa?.whatsapp)

    if (!numero) {
      window.alert('Este negócio ainda não cadastrou um WhatsApp.')
      return
    }

    const mensagem = encodeURIComponent(
      `Olá! Encontrei ${empresa?.nome_fantasia} pelo Organiza e gostaria de saber mais.`,
    )

    window.open(
      `https://wa.me/${numero}?text=${mensagem}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  function abrirTelefone() {
    const telefone = filial?.telefone || empresa?.telefone

    if (!telefone) {
      window.alert('Este negócio ainda não cadastrou um telefone.')
      return
    }

    window.location.href = `tel:${telefone}`
  }

  if (carregando) {
    return (
      <main className="pagina-publica-loading">
        <div className="pagina-publica-spinner" />
        <p>Carregando negócio...</p>

        <style>{`
          .pagina-publica-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            padding: 24px;
            background: #f7f7f7;
            color: #333;
            font-family: Arial, sans-serif;
          }

          .pagina-publica-spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #ddd;
            border-top-color: #222;
            border-radius: 50%;
            animation: paginaPublicaGirar 0.8s linear infinite;
          }

          @keyframes paginaPublicaGirar {
            to {
              transform: rotate(360deg);
            }
          }

          .pagina-publica-loading p {
            margin: 0;
            font-size: 14px;
          }
        `}</style>
      </main>
    )
  }

  if (erro || !empresa) {
    return (
      <main className="pagina-publica-erro">
        <div className="pagina-publica-erro-card">
          <span className="pagina-publica-erro-icone">!</span>

          <h1>Não foi possível abrir esta página</h1>

          <p>{erro || 'Negócio não encontrado.'}</p>

          {onVoltar && (
            <button type="button" onClick={onVoltar}>
              Voltar
            </button>
          )}
        </div>

        <style>{`
          .pagina-publica-erro {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f7f7f7;
            font-family: Arial, sans-serif;
          }

          .pagina-publica-erro-card {
            width: 100%;
            max-width: 420px;
            padding: 32px 24px;
            text-align: center;
            background: #fff;
            border: 1px solid #e7e7e7;
            border-radius: 20px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.06);
          }

          .pagina-publica-erro-icone {
            width: 46px;
            height: 46px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            border-radius: 50%;
            background: #f1f1f1;
            font-size: 22px;
            font-weight: 700;
          }

          .pagina-publica-erro-card h1 {
            margin: 0 0 10px;
            font-size: 21px;
          }

          .pagina-publica-erro-card p {
            margin: 0 0 22px;
            color: #666;
            line-height: 1.5;
          }

          .pagina-publica-erro-card button {
            border: 0;
            padding: 12px 20px;
            border-radius: 12px;
            background: #222;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
          }
        `}</style>
      </main>
    )
  }

  const endereco = filial ? montarEndereco(filial) : ''
  const cidade = filial?.cidade || empresa.cidade
  const estado = filial?.estado || empresa.estado
  const telefone = filial?.telefone || empresa.telefone

  return (
    <main className="pagina-publica">
      <div className="pagina-publica-container">
        <section
          className="pagina-publica-capa"
          style={
            empresa.banner_url
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url("${empresa.banner_url}")`,
                }
              : undefined
          }
        >
          <div className="pagina-publica-capa-conteudo">
            <button
              type="button"
              className="pagina-publica-voltar"
              onClick={onVoltar}
              aria-label="Voltar"
            >
              ←
            </button>

            <div className="pagina-publica-capa-acoes">
              <button
                type="button"
                onClick={compartilhar}
                aria-label="Compartilhar negócio"
              >
                ↗
              </button>

              <button
                type="button"
                className={favoritado ? 'ativo' : ''}
                onClick={() => setFavoritado((valor) => !valor)}
                aria-label="Favoritar negócio"
              >
                {favoritado ? '♥' : '♡'}
              </button>
            </div>

            <div className="pagina-publica-identidade">
              <div className="pagina-publica-logo">
                {empresa.logo_url ? (
                  <img
                    src={empresa.logo_url}
                    alt={`Logo de ${empresa.nome_fantasia}`}
                  />
                ) : (
                  <span>
                    {empresa.nome_fantasia
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <h1>{empresa.nome_fantasia}</h1>

              {(cidade || estado) && (
                <p>
                  {cidade}
                  {cidade && estado ? ' • ' : ''}
                  {estado}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="pagina-publica-status">
          <div className="pagina-publica-status-item">
            <span className="pagina-publica-status-bolinha" />
            <span>
              {empresa.status === 'ativa'
                ? 'Negócio ativo'
                : 'Negócio temporariamente indisponível'}
            </span>
          </div>

          {filial && (
            <div className="pagina-publica-unidade">
              {filial.nome}
            </div>
          )}
        </section>

        <section className="pagina-publica-busca">
          <label htmlFor="busca-negocio">
            O que você está procurando?
          </label>

          <div className="pagina-publica-busca-input">
            <span>⌕</span>

            <input
              id="busca-negocio"
              type="search"
              placeholder="Buscar produtos ou serviços"
              disabled
            />
          </div>

          <small>
            A busca será ativada quando o catálogo deste negócio estiver
            cadastrado.
          </small>
        </section>

        <section className="pagina-publica-secao">
          <div className="pagina-publica-secao-titulo">
            <div>
              <span className="pagina-publica-etiqueta">
                EXPLORAR
              </span>
              <h2>Categorias</h2>
            </div>
          </div>

          <div className="pagina-publica-vazio">
            <div className="pagina-publica-vazio-icone">+</div>

            <strong>As categorias aparecerão aqui</strong>

            <p>
              O negócio poderá criar e organizar suas próprias
              categorias.
            </p>
          </div>
        </section>

        <section className="pagina-publica-secao">
          <div className="pagina-publica-secao-titulo">
            <div>
              <span className="pagina-publica-etiqueta">
                EM DESTAQUE
              </span>
              <h2>Produtos e serviços</h2>
            </div>
          </div>

          <div className="pagina-publica-vazio">
            <div className="pagina-publica-vazio-icone">+</div>

            <strong>O catálogo deste negócio está sendo preparado</strong>

            <p>
              Quando os produtos e serviços forem cadastrados, eles
              aparecerão nesta vitrine.
            </p>
          </div>
        </section>

        <section className="pagina-publica-sobre">
          <span className="pagina-publica-etiqueta">SOBRE</span>

          <h2>Sobre o negócio</h2>

          <p>
            Esta área será personalizada pelo próprio negócio para
            contar sua história, apresentar sua proposta e mostrar o
            que faz de diferente.
          </p>
        </section>

        <section className="pagina-publica-secao">
          <div className="pagina-publica-secao-titulo">
            <div>
              <span className="pagina-publica-etiqueta">
                ONDE ESTAMOS
              </span>
              <h2>Localização</h2>
            </div>
          </div>

          {filial && endereco ? (
            <div className="pagina-publica-info-card">
              <div className="pagina-publica-info-icone">⌖</div>

              <div>
                <strong>{filial.nome}</strong>

                <p>{endereco}</p>

                {filial.cep && <small>CEP {filial.cep}</small>}
              </div>
            </div>
          ) : (
            <div className="pagina-publica-vazio pagina-publica-vazio-menor">
              <strong>Endereço ainda não informado</strong>
            </div>
          )}
        </section>

        <section className="pagina-publica-secao">
          <div className="pagina-publica-secao-titulo">
            <div>
              <span className="pagina-publica-etiqueta">
                CONTATO
              </span>
              <h2>Fale com o negócio</h2>
            </div>
          </div>

          <div className="pagina-publica-contatos">
            {(filial?.whatsapp || empresa.whatsapp) && (
              <button
                type="button"
                className="pagina-publica-contato pagina-publica-contato-principal"
                onClick={abrirWhatsApp}
              >
                <span>◉</span>

                <div>
                  <strong>WhatsApp</strong>
                  <small>Falar com o negócio</small>
                </div>

                <b>→</b>
              </button>
            )}

            {telefone && (
              <button
                type="button"
                className="pagina-publica-contato"
                onClick={abrirTelefone}
              >
                <span>☎</span>

                <div>
                  <strong>Telefone</strong>
                  <small>{telefone}</small>
                </div>

                <b>→</b>
              </button>
            )}

            {empresa.email && (
              <a
                className="pagina-publica-contato"
                href={`mailto:${empresa.email}`}
              >
                <span>✉</span>

                <div>
                  <strong>E-mail</strong>
                  <small>{empresa.email}</small>
                </div>

                <b>→</b>
              </a>
            )}
          </div>
        </section>

        <section className="pagina-publica-compartilhar">
          <div>
            <strong>Gostou deste negócio?</strong>

            <p>Compartilhe esta vitrine com alguém.</p>
          </div>

          <button type="button" onClick={compartilhar}>
            Compartilhar
          </button>
        </section>

        <footer className="pagina-publica-footer">
          <span>Feito com</span>
          <strong>Organiza</strong>
        </footer>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .pagina-publica {
          min-height: 100vh;
          background: #f5f5f5;
          color: #202020;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .pagina-publica-container {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          background: #fff;
          min-height: 100vh;
        }

        .pagina-publica-capa {
          position: relative;
          min-height: 350px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          background:
            linear-gradient(135deg, #e9e9e9, #cfcfcf);
          background-size: cover;
          background-position: center;
        }

        .pagina-publica-capa-conteudo {
          width: 100%;
          min-height: 350px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.18),
            rgba(0, 0, 0, 0.55)
          );
          color: #fff;
        }

        .pagina-publica-voltar,
        .pagina-publica-capa-acoes button {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          color: #222;
          font-size: 20px;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }

        .pagina-publica-voltar {
          align-self: flex-start;
        }

        .pagina-publica-capa-acoes {
          position: absolute;
          top: 18px;
          right: 18px;
          display: flex;
          gap: 8px;
        }

        .pagina-publica-capa-acoes button.ativo {
          color: #c51d51;
        }

        .pagina-publica-identidade {
          text-align: center;
          padding-bottom: 10px;
        }

        .pagina-publica-logo {
          width: 92px;
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          overflow: hidden;
          border: 4px solid rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          background: #fff;
          color: #333;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.18);
        }

        .pagina-publica-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pagina-publica-logo span {
          font-size: 34px;
          font-weight: 700;
        }

        .pagina-publica-identidade h1 {
          margin: 0;
          font-size: clamp(26px, 6vw, 38px);
          line-height: 1.1;
          font-weight: 700;
        }

        .pagina-publica-identidade p {
          margin: 9px 0 0;
          font-size: 14px;
          opacity: 0.92;
        }

        .pagina-publica-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid #ededed;
          background: #fff;
        }

        .pagina-publica-status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #555;
        }

        .pagina-publica-status-bolinha {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #2f9e44;
        }

        .pagina-publica-unidade {
          font-size: 12px;
          color: #777;
        }

        .pagina-publica-busca {
          padding: 24px 18px 8px;
        }

        .pagina-publica-busca label {
          display: block;
          margin-bottom: 9px;
          font-size: 15px;
          font-weight: 600;
        }

        .pagina-publica-busca-input {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 50px;
          padding: 0 15px;
          border: 1px solid #ddd;
          border-radius: 15px;
          background: #fafafa;
        }

        .pagina-publica-busca-input span {
          font-size: 22px;
          color: #777;
        }

        .pagina-publica-busca-input input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14px;
        }

        .pagina-publica-busca-input input:disabled {
          cursor: not-allowed;
        }

        .pagina-publica-busca small {
          display: block;
          margin-top: 7px;
          color: #999;
          font-size: 11px;
        }

        .pagina-publica-secao {
          padding: 26px 18px 0;
        }

        .pagina-publica-secao-titulo {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .pagina-publica-etiqueta {
          display: block;
          margin-bottom: 5px;
          color: #888;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .pagina-publica-secao h2,
        .pagina-publica-sobre h2 {
          margin: 0;
          font-size: 22px;
          line-height: 1.2;
        }

        .pagina-publica-vazio {
          padding: 28px 20px;
          border: 1px dashed #d8d8d8;
          border-radius: 18px;
          text-align: center;
          background: #fafafa;
        }

        .pagina-publica-vazio-menor {
          padding: 22px 18px;
          text-align: left;
        }

        .pagina-publica-vazio-icone {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          border-radius: 50%;
          background: #ededed;
          color: #777;
          font-size: 22px;
        }

        .pagina-publica-vazio strong {
          display: block;
          font-size: 14px;
        }

        .pagina-publica-vazio p {
          max-width: 420px;
          margin: 7px auto 0;
          color: #888;
          font-size: 13px;
          line-height: 1.5;
        }

        .pagina-publica-sobre {
          margin: 30px 18px 0;
          padding: 24px 20px;
          border-radius: 18px;
          background: #f6f6f6;
        }

        .pagina-publica-sobre p {
          margin: 13px 0 0;
          color: #666;
          font-size: 14px;
          line-height: 1.65;
        }

        .pagina-publica-info-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          border: 1px solid #e8e8e8;
          border-radius: 17px;
        }

        .pagina-publica-info-icone {
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f0f0f0;
          font-size: 20px;
        }

        .pagina-publica-info-card strong {
          display: block;
          font-size: 14px;
        }

        .pagina-publica-info-card p {
          margin: 5px 0 4px;
          color: #555;
          font-size: 13px;
          line-height: 1.5;
        }

        .pagina-publica-info-card small {
          color: #999;
          font-size: 11px;
        }

        .pagina-publica-contatos {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .pagina-publica-contato {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px;
          border: 1px solid #e7e7e7;
          border-radius: 15px;
          background: #fff;
          color: #222;
          text-align: left;
          text-decoration: none;
          cursor: pointer;
        }

        .pagina-publica-contato > span {
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #f1f1f1;
        }

        .pagina-publica-contato div {
          flex: 1;
        }

        .pagina-publica-contato strong,
        .pagina-publica-contato small {
          display: block;
        }

        .pagina-publica-contato strong {
          font-size: 14px;
        }

        .pagina-publica-contato small {
          margin-top: 3px;
          color: #888;
          font-size: 12px;
        }

        .pagina-publica-contato b {
          color: #888;
          font-size: 18px;
        }

        .pagina-publica-contato-principal {
          border-color: #222;
          background: #222;
          color: #fff;
        }

        .pagina-publica-contato-principal > span {
          background: rgba(255, 255, 255, 0.12);
        }

        .pagina-publica-contato-principal small,
        .pagina-publica-contato-principal b {
          color: rgba(255, 255, 255, 0.7);
        }

        .pagina-publica-compartilhar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin: 30px 18px 0;
          padding: 20px;
          border-radius: 18px;
          background: #222;
          color: #fff;
        }

        .pagina-publica-compartilhar strong {
          display: block;
          font-size: 14px;
        }

        .pagina-publica-compartilhar p {
          margin: 5px 0 0;
          color: #bbb;
          font-size: 12px;
        }

        .pagina-publica-compartilhar button {
          flex: 0 0 auto;
          padding: 10px 14px;
          border: 0;
          border-radius: 10px;
          background: #fff;
          color: #222;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .pagina-publica-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 34px 18px 28px;
          color: #aaa;
          font-size: 11px;
        }

        .pagina-publica-footer strong {
          color: #777;
        }

        @media (min-width: 761px) {
          .pagina-publica {
            padding: 20px 0;
          }

          .pagina-publica-container {
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.08);
          }
        }

        @media (max-width: 480px) {
          .pagina-publica-capa,
          .pagina-publica-capa-conteudo {
            min-height: 330px;
          }

          .pagina-publica-compartilhar {
            align-items: flex-start;
            flex-direction: column;
          }

          .pagina-publica-compartilhar button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  )
}

export default PaginaPublicaNegocioPage