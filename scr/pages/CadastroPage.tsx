import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface CadastroPageProps {
  onVoltarLogin: () => void
}

export default function CadastroPage({
  onVoltarLogin,
}: CadastroPageProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)

  const [aceitouTermos, setAceitouTermos] = useState(false)

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErro('')
    setMensagem('')

    const nomeLimpo = nome.trim()
    const emailLimpo = email.trim()

    if (!nomeLimpo) {
      setErro('Informe seu nome.')
      return
    }

    if (!emailLimpo) {
      setErro('Informe seu e-mail.')
      return
    }

    if (!senha) {
      setErro('Crie uma senha para sua conta.')
      return
    }

    if (senha.length < 6) {
      setErro('Sua senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    if (!aceitouTermos) {
      setErro('Você precisa concordar com os termos para criar sua conta.')
      return
    }

    setCarregando(true)

    const { data, error } = await supabase.auth.signUp({
      email: emailLimpo,
      password: senha,
      options: {
        data: {
          nome: nomeLimpo,
        },
      },
    })

    setCarregando(false)

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setErro(
          'Este e-mail já possui uma conta. Tente entrar ou recuperar sua senha.',
        )
      } else {
        setErro('Não foi possível criar sua conta. Tente novamente.')
      }
      return
    }

    if (data.user && !data.session) {
      setMensagem(
        'Conta criada! Enviamos um e-mail para confirmar seu endereço. Depois da confirmação, você poderá entrar no Organiza.',
      )

      setNome('')
      setEmail('')
      setSenha('')
      setConfirmarSenha('')
      setAceitouTermos(false)

      return
    }

    if (data.session) {
      setMensagem(
        'Conta criada com sucesso! Preparando seu acesso...',
      )
      return
    }

    setMensagem(
      'Conta criada. Verifique seu e-mail para continuar.',
    )
  }

  return (
    <main className="login-page cadastro-page">
      <section
        className="login-card cadastro-card"
        aria-label="Criar conta no Organiza"
      >
        <button
          type="button"
          className="back-button"
          onClick={onVoltarLogin}
          disabled={carregando}
          aria-label="Voltar para o login"
        >
          <span aria-hidden="true">←</span>
          <span>Voltar</span>
        </button>

        <div className="login-brand cadastro-brand">
          <Logo />
        </div>

        <div className="login-slogan-bubble cadastro-slogan-bubble">
          <p className="login-slogan">
            Quem vende organiza.
            <br />
            Quem compra encontra.
          </p>
        </div>

        <div className="cadastro-heading">
          <h1>Criar sua conta</h1>
          <p>
            Crie sua conta e faça parte do universo Organiza.
            <br />
            Um conjunto de soluções feito para organizar, facilitar e
            aproximar clientes dos negócios locais.
          </p>
        </div>

        <form className="login-form cadastro-form" onSubmit={handleCadastro}>
          <div className="field">
            <label htmlFor="cadastro-nome">Nome</label>
            <input
              id="cadastro-nome"
              name="nome"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              disabled={carregando}
            />
          </div>

          <div className="field">
            <label htmlFor="cadastro-email">E-mail</label>
            <input
              id="cadastro-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={carregando}
            />
          </div>

          <div className="field">
            <label htmlFor="cadastro-senha">Senha</label>

            <div className="password-field">
              <input
                id="cadastro-senha"
                name="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Crie uma senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={carregando}
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                }
                onClick={() => setMostrarSenha((value) => !value)}
                disabled={carregando}
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="cadastro-confirmar-senha">
              Confirmar senha
            </label>

            <div className="password-field">
              <input
                id="cadastro-confirmar-senha"
                name="confirmar-senha"
                type={mostrarConfirmacao ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Digite a senha novamente"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                disabled={carregando}
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  mostrarConfirmacao
                    ? 'Ocultar confirmação da senha'
                    : 'Mostrar confirmação da senha'
                }
                onClick={() =>
                  setMostrarConfirmacao((value) => !value)
                }
                disabled={carregando}
              >
                {mostrarConfirmacao ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <label className="terms-option">
            <input
              type="checkbox"
              checked={aceitouTermos}
              onChange={(event) => setAceitouTermos(event.target.checked)}
              disabled={carregando}
            />

            <span>
              Li e concordo com os termos de uso e a política de privacidade.
            </span>
          </label>

          {erro && (
            <div className="feedback feedback--error" role="alert">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="feedback feedback--success" role="status">
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={carregando}
          >
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="cadastro-login-link">
          <p>Já tem uma conta?</p>

          <button
            type="button"
            className="text-button cadastro-login-button"
            onClick={onVoltarLogin}
            disabled={carregando}
          >
            Entrar
          </button>
        </div>
      </section>
    </main>
  )
}
