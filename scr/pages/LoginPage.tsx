
import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface LoginPageProps {
  onCriarConta: () => void
  onLoginSuccess: () => void
}

export default function LoginPage({
  onCriarConta,
  onLoginSuccess,
}: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [enviandoRecuperacao, setEnviandoRecuperacao] =
    useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErro('')
    setMensagem('')

    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail e sua senha.')
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (error) {
      setCarregando(false)
      setErro('E-mail ou senha incorretos.')
      return
    }

    setMensagem('Login realizado. Preparando seu acesso...')
    onLoginSuccess()
  }

  async function handleEsqueciSenha() {
    setErro('')
    setMensagem('')

    if (!email.trim()) {
      setErro('Informe seu e-mail para recuperar sua senha.')
      return
    }

    setEnviandoRecuperacao(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      },
    )

    setEnviandoRecuperacao(false)

if (error) {
  console.error('Erro na recuperação de senha:', error)

  setErro(
    `Erro do Supabase: ${error.message}`,
  )

  return
}

    setMensagem(
      'Se esse e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha.',
    )
  }

  return (
    <main className="login-page">
      <section
        className="login-card"
        aria-label="Entrar no Organiza"
      >
        <div className="login-brand">
          <Logo />
        </div>

        <div className="login-slogan-bubble">
          <p className="login-slogan">
            Quem vende organiza.
            <br />
            Quem compra encontra.
          </p>
        </div>

        <div className="login-heading">
          <h1>Bem-vindo</h1>
          <p>Entre na sua conta para continuar.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              name="username"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              disabled={carregando || enviandoRecuperacao}
              required
            />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label htmlFor="senha">Senha</label>

              <button
                type="button"
                className="text-button"
                onClick={handleEsqueciSenha}
                disabled={carregando || enviandoRecuperacao}
              >
                {enviandoRecuperacao
                  ? 'Enviando...'
                  : 'Esqueci minha senha'}
              </button>
            </div>

            <div className="password-field">
              <input
                id="senha"
                name="password"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                disabled={carregando || enviandoRecuperacao}
                required
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  mostrarSenha
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
                onClick={() =>
                  setMostrarSenha((value) => !value)
                }
                disabled={carregando}
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {erro && (
            <div
              className="feedback feedback--error"
              role="alert"
            >
              {erro}
            </div>
          )}

          {mensagem && (
            <div
              className="feedback feedback--success"
              role="status"
            >
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={carregando || enviandoRecuperacao}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-divider">
          <span>ou</span>
        </div>

        <div className="create-account">
          <p>Ainda não tem uma conta?</p>

          <button
            type="button"
            className="secondary-button"
            onClick={onCriarConta}
            disabled={carregando || enviandoRecuperacao}
          >
            Criar conta
          </button>
        </div>
      </section>
    </main>
  )
}
