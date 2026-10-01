import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface InicioPageProps {
  onExplorar: () => void
  onCadastrarNegocio: () => void
  onAgoraNao: () => void
}

export default function InicioPage({
  onExplorar,
  onCadastrarNegocio,
  onAgoraNao,
}: InicioPageProps) {
  const [nome, setNome] = useState('')

  useEffect(() => {
    async function carregarNome() {
      const { data } = await supabase.auth.getUser()

      const nomeUsuario =
        data.user?.user_metadata?.nome ||
        data.user?.user_metadata?.name ||
        ''

      if (nomeUsuario) {
        setNome(nomeUsuario.split(' ')[0])
      }
    }

    carregarNome()
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
            <span className="inicio-wave" aria-hidden="true">
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

        <section className="inicio-options">
          <button
            type="button"
            className="inicio-option inicio-option--comprar"
            onClick={onExplorar}
          >
            <span className="inicio-option__icon" aria-hidden="true">
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
              <strong>Explorar lojas e comprar</strong>

              <span>
                Encontre negócios locais, conheça produtos e serviços
                perto de você.
              </span>
            </span>

            <span className="inicio-option__arrow" aria-hidden="true">
              →
            </span>
          </button>

          <button
            type="button"
            className="inicio-option inicio-option--negocio"
            onClick={onCadastrarNegocio}
          >
            <span className="inicio-option__icon" aria-hidden="true">
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
              <strong>Cadastrar meu negócio</strong>

              <span>
                Leve seu negócio para o Organiza e comece a organizar
                sua operação.
              </span>
            </span>

            <span className="inicio-option__arrow" aria-hidden="true">
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
          <small>Conhecer o Organiza primeiro.</small>
        </button>
      </section>
    </main>
  )
}