
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface RedefinirSenhaPageProps {
  onVoltarLogin: () => void
  onSenhaRedefinida: () => void
}

export default function RedefinirSenhaPage({
  onVoltarLogin,
  onSenhaRedefinida,
}: RedefinirSenhaPageProps) {
  const [verificando, setVerificando] = useState(true)
  const [sessaoValida, setSessaoValida] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    let montado = true

    async function verificarSessao() {
      const { data, error } =
        await supabase.auth.getSession()

      if (!montado) return

      setSessaoValida(
        !error && Boolean(data.session?.user),
      )

      setVerificando(false)
    }

    verificarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!montado) return

        if (session?.user) {
          setSessaoValida(true)
          setVerificando(false)
        }
      },
    )

    return () => {
      montado = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleRedefinirSenha(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErro('')

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.updateUser({
      password: senha,
    })

    setCarregando(false)

    if (error) {
      console.error('Erro ao redefinir senha:', error)
      setErro(
        'Não foi possível atualizar sua senha. Solicite um novo link de recuperação.',
      )
      return
    }

    setSucesso(true)
  }

  return (
    <main className="login-page">
      <section
        className="login-card"
        aria-label="Redefinir senha"
      >
        <div className="login-brand">
          <Logo />
        </div>

        {verificando ? (
          <div className="login-heading">
            <h1>Verificando seu acesso...</h1>
            <p>Aguarde enquanto validamos o link.</p>
          </div>
        ) : sucesso ? (
          <>
            <div className="login-heading">
              <h1>Senha atualizada!</h1>
              <p>
                Sua nova senha foi cadastrada com sucesso.
                Agora você já pode continuar no Organiza.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={onSenhaRedefinida}
            >
              Continuar
            </button>
          </>
        ) : !sessaoValida ? (
          <>
            <div className="login-heading">
              <h1>Link inválido ou expirado</h1>
              <p>
                Não conseguimos validar seu link de recuperação.
                Solicite um novo link na tela de login.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={onVoltarLogin}
            >
              Voltar para o login
            </button>
          </>
        ) : (
          <>
            <div className="login-heading">
              <h1>Crie uma nova senha</h1>
              <p>
                Escolha uma senha nova para acessar sua conta.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={handleRedefinirSenha}
            >
              <div className="field">
                <label htmlFor="nova-senha">
                  Nova senha
                </label>

                <div className="password-field">
                  <input
                    id="nova-senha"
                    name="new-password"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Digite sua nova senha"
                    value={senha}
                    onChange={(event) =>
                      setSenha(event.target.value)
                    }
                    disabled={carregando}
                    required
                    minLength={6}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setMostrarSenha((value) => !value)
                    }
                  >
                    {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="confirmar-senha">
                  Confirme sua nova senha
                </label>

                <input
                  id="confirmar-senha"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite novamente sua senha"
                  value={confirmarSenha}
                  onChange={(event) =>
                    setConfirmarSenha(event.target.value)
                  }
                  disabled={carregando}
                  required
                  minLength={6}
                />
              </div>

              {erro && (
                <div
                  className="feedback feedback--error"
                  role="alert"
                >
                  {erro}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={carregando}
              >
                {carregando
                  ? 'Atualizando...'
                  : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
