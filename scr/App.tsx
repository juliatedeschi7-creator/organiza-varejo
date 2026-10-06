import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'
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

  async function carregarEmpresaDoUsuario() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.email) {
      setEmpresaId(null)
      setPage('login')
      setCarregando(false)
      return
    }

    const { data: empresa, error } = await supabase
      .from('empresas')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle()

    if (error) {
      console.error('Erro ao localizar empresa:', error)
      setEmpresaId(null)
      setPage('cadastrar-negocio')
      setCarregando(false)
      return
    }

    if (empresa?.id) {
      setEmpresaId(empresa.id)
      setPage('negocio')
    } else {
      setEmpresaId(null)
      setPage('cadastrar-negocio')
    }

    setCarregando(false)
  }

  useEffect(() => {
    let montado = true

    async function iniciar() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!montado) {
        return
      }

      if (!session?.user?.email) {
        setEmpresaId(null)
        setPage('login')
        setCarregando(false)
        return
      }

      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('id')
        .eq('email', session.user.email)
        .maybeSingle()

      if (!montado) {
        return
      }

      if (error) {
        console.error('Erro ao carregar empresa:', error)
        setEmpresaId(null)
        setPage('cadastrar-negocio')
        setCarregando(false)
        return
      }

      if (empresa?.id) {
        setEmpresaId(empresa.id)
        setPage('negocio')
      } else {
        setEmpresaId(null)
        setPage('cadastrar-negocio')
      }

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

        if (!session?.user?.email) {
          setEmpresaId(null)
          setPage('login')
          return
        }

        const { data: empresa, error } = await supabase
          .from('empresas')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle()

        if (!montado) {
          return
        }

        if (error) {
          console.error(
            'Erro ao verificar empresa após autenticação:',
            error,
          )

          setEmpresaId(null)
          setPage('cadastrar-negocio')
          return
        }

        if (empresa?.id) {
          setEmpresaId(empresa.id)
          setPage('negocio')
        } else {
          setEmpresaId(null)
          setPage('cadastrar-negocio')
        }
      },
    )

    return () => {
      montado = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLoginSuccess() {
    await carregarEmpresaDoUsuario()
  }

  function handleCadastroSucesso() {
    setPage('login')
  }

  function handleNegocioCriado(id: string) {
    setEmpresaId(id)
    setPage('negocio')
  }

  async function handleSair() {
    await supabase.auth.signOut()
    setEmpresaId(null)
    setPage('login')
  }

  function voltarParaNegocio() {
    if (empresaId) {
      setPage('negocio')
      return
    }

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

  if (page === 'cadastrar-negocio') {
    return (
      <CadastrarNegocioPage
        onVoltar={() => setPage('login')}
        onCadastroSucesso={handleNegocioCriado}
      />
    )
  }

  if (!empresaId) {
    return (
      <LoginPage
        onCriarConta={() => setPage('cadastro')}
        onLoginSuccess={handleLoginSuccess}
      />
    )
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

  return (
    <LoginPage
      onCriarConta={() => setPage('cadastro')}
      onLoginSuccess={handleLoginSuccess}
    />
  )
}