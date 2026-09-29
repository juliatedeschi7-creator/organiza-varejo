import { FormEvent, useState } from 'react'
import { Logo } from '../components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

async function handleLogin(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  setErro('')
  setMensagem('')

  setMensagem('A tela do Organiza está funcionando.')
}

  async function handleEsqueciSenha() {
    setErro('')
    setMensagem('')

    if (!email.trim()) {
      setErro('Informe seu e-mail para recuperar sua senha.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      },
    )

    if (error) {
      setErro(
        'Não foi possível iniciar a recuperação da senha. Tente novamente.',
      )
      return
    }

    setMensagem(
      'Se esse e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha.',
    )
  }

  function handleCriarConta() {
    // Será conectado à Página 2 — Cadastro.
    console.log('Abrir cadastro')
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Entrar no Organiza">
        <div className="login-brand">
          <Logo />
        </div>

        <div className="login-heading">
          <h1>Bem-vindo</h1>

          <p>
            Entre na sua conta para continuar.
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
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
            <div className="field-label-row">
              <label htmlFor="senha">Senha</label>

              <button
                type="button"
                className="text-button"
                onClick={handleEsqueciSenha}
                disabled={carregando}
              >
                Esqueci minha senha
              </button>
            </div>

            <div className="password-field">
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={carregando}
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  mostrarSenha
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
                onClick={() => setMostrarSenha((value) => !value)}
                disabled={carregando}
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <label className="remember-option">
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(event) => setLembrar(event.target.checked)}
              disabled={carregando}
            />

            <span>Continuar conectado</span>
          </label>

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
            disabled={carregando}
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
            onClick={handleCriarConta}
            disabled={carregando}
          >
            Criar conta
          </button>
        </div>
      </section>
    </main>
  )
}
