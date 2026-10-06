import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'
import InicioPage from './pages/InicioPage'
import CadastrarNegocioPage from './pages/CadastrarNegocioPage'
import NegocioPage from './pages/NegocioPage'
import ProdutosPage from './pages/ProdutosPage'
import CategoriasPage from './pages/CategoriasPage'
import PaginaPublicaNegocioPage from './pages/PaginaPublicaNegocioPage'
import EditarEmpresaPage from './pages/EditarEmpresaPage'
import EditarEnderecoPage from './pages/EditarEnderecoPage'
import PersonalizacaoNegocioPage from './pages/PersonalizacaoNegocioPage'

type Page =
  | 'login'
  | 'cadastro'
  | 'inicio'
  | 'cadastrar-negocio'
  | 'negocio'
  | 'produtos'
  | 'categorias'
  | 'pagina-publica'
  | 'editar-empresa'
  | 'editar-endereco'
  | 'personalizacao'

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let montado = true

    async function iniciar() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!montado) {
        return
      }

      if (!session?.user) {
        setEmpresaId(null)
        setPage('login')
        setCarregando(false)
        return
      }

      /*
       * A conta pertence ao USUÁRIO, não a uma única empresa.
       *
       * Por isso, depois do login sempre vamos para a InicioPage.
       *
       * A InicioPage é responsável por mostrar:
       * - empresas que pertencem ao usuário
       * - opção de cadastrar uma empresa
       * - opção de explorar lojas como cliente
       */
      setEmpresaId(null)
      setPage('inicio')
      setCarregando(false)
    }

    iniciar()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!montado) {
          return
        }

        if (!session?.user) {
          setEmpresaId(null)
          setPage('login')
          return
        }

        /*
         * Não procuramos mais uma empresa pelo e-mail.
         *
         * O usuário pode ter:
         * - nenhuma empresa
         * - uma empresa
         * - várias empresas
         *
         * A InicioPage consulta membros_empresa e apresenta
         * todas as empresas às quais o usuário tem acesso.
         */
        setEmpresaId(null)
        setPage('inicio')
      },
    )

    return () => {
      montado = false
      subscription.unsubscribe()
    }
  }, [])

  function handleLoginSuccess() {
    setEmpresaId(null)
    setPage('inicio')
  }

  function handleCadastroSucesso() {
    /*
     * Depois que a conta é criada, o usuário volta para o login.
     *
     * O próprio fluxo de autenticação da CadastroPage continua
     * responsável por informar quando a conta estiver pronta.
     */
    setPage('login')
  }

  function handleNegocioCriado(id: string) {
    /*
     * Uma nova empresa acabou de ser criada.
     *
     * Entramos diretamente nela para que o proprietário possa
     * continuar a configuração.
     */
    setEmpresaId(id)
    setPage('negocio')
  }

  function handleAbrirEmpresa(id: string) {
    /*
     * A pessoa escolheu uma das empresas exibidas na InicioPage.
     */
    setEmpresaId(id)
    setPage('negocio')
  }

  function voltarParaInicio() {
    setEmpresaId(null)
    setPage('inicio')
  }

  function voltarParaNegocio() {
    if (empresaId) {
      setPage('negocio')
      return
    }

    setPage('inicio')
  }

  async function handleSair() {
    await supabase.auth.signOut()

    setEmpresaId(null)
    setPage('login')
  }

  if (carregando) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <p>Carregando...</p>
      </main>
    )
  }

  if (page === 'login') {
    return (
      <LoginPage
        onCriarConta={() => setPage('cadastro')}
        onLoginSuccess={handleLoginSuccess}
      />
    )
  }

  if (page === 'cadastro') {
    return (
      <CadastroPage
        onVoltarLogin={() => setPage('login')}
      />
    )
  }

  if (page === 'inicio') {
    return (
      <InicioPage
        onExplorar={() => {
          /*
           * O destino do Mercado Local será conectado aqui
           * quando a página correspondente estiver definida.
           */
          console.log('Abrir Mercado Local')
        }}
        onCadastrarNegocio={() => {
          setPage('cadastrar-negocio')
        }}
        onAgoraNao={() => {
          /*
           * Por enquanto, "Agora não" permanece na experiência
           * inicial. Quando tivermos a tela pública/entrada do
           * Organiza definida, podemos conectar esse caminho.
           */
          setPage('inicio')
        }}
        onAbrirEmpresa={handleAbrirEmpresa}
      />
    )
  }

  if (page === 'cadastrar-negocio') {
    return (
      <CadastrarNegocioPage
        onVoltar={voltarParaInicio}
        onCadastroSucesso={handleNegocioCriado}
      />
    )
  }

  /*
   * Todas as telas abaixo dependem de uma empresa selecionada.
   */
  if (!empresaId) {
    setPage('inicio')
    return null
  }

  if (page === 'negocio') {
    return (
      <NegocioPage
        empresaId={empresaId}
        onSair={handleSair}
        onAbrirVitrine={() => {
          setPage('pagina-publica')
        }}
        onAbrirProdutos={() => {
          setPage('produtos')
        }}
        onAbrirCategorias={() => {
          setPage('categorias')
        }}
        onAbrirEditarEmpresa={() => {
          setPage('editar-empresa')
        }}
        onAbrirEditarEndereco={() => {
          setPage('editar-endereco')
        }}
        onAbrirPersonalizacao={() => {
          setPage('personalizacao')
        }}
      />
    )
  }

  if (page === 'produtos') {
    return (
      <ProdutosPage
        empresaId={empresaId}
        onVoltar={voltarParaNegocio}
      />
    )
  }

  if (page === 'categorias') {
    return (
      <CategoriasPage
        empresaId={empresaId}
        onVoltar={voltarParaNegocio}
      />
    )
  }

  if (page === 'editar-empresa') {
    return (
      <EditarEmpresaPage
        empresaId={empresaId}
        onVoltar={voltarParaNegocio}
      />
    )
  }

  if (page === 'editar-endereco') {
    return (
      <EditarEnderecoPage
        empresaId={empresaId}
        onVoltar={voltarParaNegocio}
      />
    )
  }

  if (page === 'personalizacao') {
    return (
      <PersonalizacaoNegocioPage
        empresaId={empresaId}
        onVoltar={voltarParaNegocio}
      />
    )
  }

  if (page === 'pagina-publica') {
    return (
      <PaginaPublicaNegocioPage
        empresaId={empresaId}
        onVoltar={voltarParaNegocio}
      />
    )
  }

  /*
   * Fallback de segurança.
   */
  return (
    <InicioPage
      onExplorar={() => {
        console.log('Abrir Mercado Local')
      }}
      onCadastrarNegocio={() => {
        setPage('cadastrar-negocio')
      }}
      onAgoraNao={() => {
        setPage('inicio')
      }}
      onAbrirEmpresa={handleAbrirEmpresa}
    />
  )
}