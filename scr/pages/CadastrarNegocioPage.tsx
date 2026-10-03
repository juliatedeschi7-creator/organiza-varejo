import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface CadastrarNegocioPageProps {
  onVoltar: () => void
  onCadastroSucesso: (empresaId: string) => void
}

export default function CadastrarNegocioPage({
  onVoltar,
  onCadastroSucesso,
}: CadastrarNegocioPageProps) {
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, '')
  }

  function formatarCnpj(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 14)

    return numeros
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  function formatarWhatsapp(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11)

    if (numeros.length <= 2) {
      return numeros
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7,
    )}-${numeros.slice(7)}`
  }

  function formatarCep(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 8)

    return numeros.replace(/^(\d{5})(\d)/, '$1-$2')
  }

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErro('')

    const nomeLimpo = nomeFantasia.trim()
    const whatsappLimpo = somenteNumeros(whatsapp)
    const emailLimpo = email.trim()
    const cnpjLimpo = somenteNumeros(cnpj)
    const cepLimpo = somenteNumeros(cep)

    if (!nomeLimpo) {
      setErro('Informe o nome do negócio.')
      return
    }

    if (!whatsappLimpo) {
      setErro('Informe o WhatsApp do negócio.')
      return
    }

    if (whatsappLimpo.length < 10) {
      setErro('Informe um WhatsApp válido.')
      return
    }

    if (
      emailLimpo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
    ) {
      setErro('Informe um e-mail válido.')
      return
    }

    if (cnpjLimpo && cnpjLimpo.length !== 14) {
      setErro('Confira o CNPJ informado.')
      return
    }

    if (cepLimpo && cepLimpo.length !== 8) {
      setErro('Confira o CEP informado.')
      return
    }

    if (!logradouro.trim()) {
      setErro('Informe a rua ou avenida.')
      return
    }

    if (!numero.trim()) {
      setErro('Informe o número.')
      return
    }

    if (!bairro.trim()) {
      setErro('Informe o bairro.')
      return
    }

    if (!cidade.trim()) {
      setErro('Informe a cidade.')
      return
    }

    if (!estado.trim()) {
      setErro('Informe o estado.')
      return
    }

    setCarregando(true)

    const { data, error } = await supabase.rpc(
      'criar_empresa_completa',
      {
        p_nome_fantasia: nomeLimpo,
        p_documento: cnpjLimpo || null,
        p_whatsapp: whatsappLimpo,
        p_email: emailLimpo || null,
        p_cep: cepLimpo || null,
        p_logradouro: logradouro.trim(),
        p_numero: numero.trim(),
        p_complemento: complemento.trim() || null,
        p_bairro: bairro.trim(),
        p_cidade: cidade.trim(),
        p_estado: estado.trim(),
      },
    )

    setCarregando(false)

    if (error) {
      console.error('Erro ao criar negócio:', error)

      if (
        error.message?.toLowerCase().includes('não autenticado')
      ) {
        setErro(
          'Sua sessão não está mais ativa. Entre novamente para continuar.',
        )
      } else {
        setErro(
          'Não foi possível cadastrar o negócio. Confira os dados e tente novamente.',
        )
      }

      return
    }

    if (!data?.sucesso || !data?.empresa_id) {
      setErro('O negócio não pôde ser criado. Tente novamente.')
      return
    }

    onCadastroSucesso(data.empresa_id)
  }

  return (
    <>
      <style>{`
        .cadastro-negocio-page {
          overflow-x: hidden;
        }

        .cadastro-negocio-card {
          box-sizing: border-box;
        }

        .cadastro-negocio-form {
          gap: 0 !important;
        }

        /*
         * Títulos das seções
         */
        .cadastro-negocio-form .cadastro-section-title {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: flex-start !important;
          width: 100% !important;
          gap: 3px !important;
          margin: 10px 0 22px !important;
          padding: 0 !important;
        }

        .cadastro-negocio-form .cadastro-section-title strong {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 20px !important;
          line-height: 1.2 !important;
          font-weight: 800 !important;
        }

        .cadastro-negocio-form .cadastro-section-title span {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 14px !important;
          line-height: 1.35 !important;
          font-weight: 500 !important;
          color: #777 !important;
        }

        /*
         * Cada campo fica com o título bem próximo
         * do respectivo campo.
         */
        .cadastro-negocio-form .field {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          width: 100% !important;
          gap: 7px !important;
          margin: 0 0 18px !important;
          padding: 0 !important;
        }

        .cadastro-negocio-form .field label {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 16px !important;
          line-height: 1.25 !important;
          font-weight: 700 !important;
          color: #555 !important;
        }

        .cadastro-negocio-form .field input {
          box-sizing: border-box !important;
          width: 100% !important;
          margin: 0 !important;
        }

        /*
         * Número e complemento
         */
        .cadastro-negocio-form .field-row {
          display: grid !important;
          grid-template-columns: 0.72fr 1.28fr !important;
          gap: 12px !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .cadastro-negocio-form .field-row .field {
          min-width: 0 !important;
        }

        /*
         * Separação antes da segunda seção.
         */
        .cadastro-negocio-form .cadastro-section-title + .field {
          margin-top: 0 !important;
        }

        /*
         * O último campo fica um pouco mais distante
         * do botão.
         */
        .cadastro-negocio-form .field:last-of-type {
          margin-bottom: 25px !important;
        }

        /*
         * Pequena adaptação para telas estreitas.
         */
        @media (max-width: 380px) {
          .cadastro-negocio-form .field-row {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }

          .cadastro-negocio-form .cadastro-section-title strong {
            font-size: 19px !important;
          }
        }
      `}</style>

      <main className="login-page cadastro-page cadastro-negocio-page">
        <section
          className="login-card cadastro-card cadastro-negocio-card"
          aria-label="Cadastrar meu negócio"
        >
          <button
            type="button"
            className="back-button"
            onClick={onVoltar}
            disabled={carregando}
            aria-label="Voltar"
          >
            <span aria-hidden="true">←</span>
            <span>Voltar</span>
          </button>

          <div className="login-brand cadastro-brand">
            <Logo />
          </div>

          <div className="cadastro-heading">
            <h1>Cadastre seu negócio</h1>

            <p>
              Vamos criar a presença do seu negócio no Organiza.
              <br />
              Você poderá completar e personalizar tudo depois.
            </p>
          </div>

          <form
            className="login-form cadastro-form cadastro-negocio-form"
            onSubmit={handleCadastro}
          >
            <div className="cadastro-section-title">
              <strong>Sobre o negócio</strong>
              <span>As informações principais</span>
            </div>

            <div className="field">
              <label htmlFor="negocio-nome">
                Nome do negócio <span aria-hidden="true">*</span>
              </label>

              <input
                id="negocio-nome"
                name="nome"
                type="text"
                autoComplete="organization"
                placeholder="Ex.: Espaço Maria Magnólia"
                value={nomeFantasia}
                onChange={(event) =>
                  setNomeFantasia(event.target.value)
                }
                disabled={carregando}
              />
            </div>

            <div className="field">
              <label htmlFor="negocio-cnpj">CNPJ</label>

              <input
                id="negocio-cnpj"
                name="cnpj"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(event) =>
                  setCnpj(formatarCnpj(event.target.value))
                }
                disabled={carregando}
              />
            </div>

            <div className="field">
              <label htmlFor="negocio-whatsapp">
                WhatsApp <span aria-hidden="true">*</span>
              </label>

              <input
                id="negocio-whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={(event) =>
                  setWhatsapp(formatarWhatsapp(event.target.value))
                }
                disabled={carregando}
              />
            </div>

            <div className="field">
              <label htmlFor="negocio-email">E-mail</label>

              <input
                id="negocio-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="contato@seunegocio.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={carregando}
              />
            </div>

            <div className="cadastro-section-title">
              <strong>Endereço</strong>
              <span>Onde seu negócio está localizado</span>
            </div>

            <div className="field">
              <label htmlFor="negocio-cep">CEP</label>

              <input
                id="negocio-cep"
                name="cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                value={cep}
                onChange={(event) =>
                  setCep(formatarCep(event.target.value))
                }
                disabled={carregando}
              />
            </div>

            <div className="field">
              <label htmlFor="negocio-logradouro">
                Rua ou avenida <span aria-hidden="true">*</span>
              </label>

              <input
                id="negocio-logradouro"
                name="logradouro"
                type="text"
                autoComplete="street-address"
                placeholder="Nome da rua ou avenida"
                value={logradouro}
                onChange={(event) =>
                  setLogradouro(event.target.value)
                }
                disabled={carregando}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="negocio-numero">
                  Número <span aria-hidden="true">*</span>
                </label>

                <input
                  id="negocio-numero"
                  name="numero"
                  type="text"
                  inputMode="numeric"
                  autoComplete="address-line2"
                  placeholder="123"
                  value={numero}
                  onChange={(event) =>
                    setNumero(event.target.value)
                  }
                  disabled={carregando}
                />
              </div>

              <div className="field">
                <label htmlFor="negocio-complemento">
                  Complemento
                </label>

                <input
                  id="negocio-complemento"
                  name="complemento"
                  type="text"
                  autoComplete="address-line2"
                  placeholder="Sala, loja..."
                  value={complemento}
                  onChange={(event) =>
                    setComplemento(event.target.value)
                  }
                  disabled={carregando}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="negocio-bairro">
                Bairro <span aria-hidden="true">*</span>
              </label>

              <input
                id="negocio-bairro"
                name="bairro"
                type="text"
                autoComplete="address-level3"
                placeholder="Seu bairro"
                value={bairro}
                onChange={(event) =>
                  setBairro(event.target.value)
                }
                disabled={carregando}
              />
            </div>

            <div className="field">
              <label htmlFor="negocio-cidade">
                Cidade <span aria-hidden="true">*</span>
              </label>

              <input
                id="negocio-cidade"
                name="cidade"
                type="text"
                autoComplete="address-level2"
                placeholder="Sua cidade"
                value={cidade}
                onChange={(event) =>
                  setCidade(event.target.value)
                }
                disabled={carregando}
              />
            </div>

            <div className="field">
              <label htmlFor="negocio-estado">
                Estado <span aria-hidden="true">*</span>
              </label>

              <input
                id="negocio-estado"
                name="estado"
                type="text"
                autoComplete="address-level1"
                placeholder="Ex.: SP"
                maxLength={2}
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value.toUpperCase())
                }
                disabled={carregando}
              />
            </div>

            {erro && (
              <div className="feedback feedback--error" role="alert">
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={carregando}
            >
              {carregando
                ? 'Cadastrando negócio...'
                : 'Cadastrar meu negócio'}
            </button>
          </form>
        </section>
      </main>
    </>
  )
}