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

  useEffect(() => {
    async function verificarSessao() {
      setCarregando(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setEmpresaId(null)
        setPage('login')
        setCarregando(false)
        return
      }

      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('id')
        .eq('email', session.user.email ?? '')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error(
          'Erro ao localizar empresa da sessão:',
          error
        )

        setEmpresaId(null)
        setPage('login')
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

    verificarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setEmpresaId(null)
          setPage('login')
          return
        }

        const { data: empresa, error } = await supabase
          .from('empresas')
          .select('id')
          .eq('email', session.user.email ?? '')
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error(
            'Erro ao verificar empresa após autenticação:',
            error
          )

          setEmpresaId(null)
          setPage('login')
          return
        }

        if (empresa?.id) {
          setEmpresaId(empresa.id)
          setPage('negocio')
        } else {
          setEmpresaId(null)
          setPage('cadastrar-negocio')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  function voltarParaNegocio() {
    setPage('negocio')
  }

  if (carregando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f7f5',
          color: '#222',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Carregando...
      </div>
    )
  }

  if (page === 'login') {
    return (
      <LoginPage
        onEntrar={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
        onCadastrar={() => {
          setPage('cadastro')
        }}
      />
    )
  }

  if (page === 'cadastro') {
    return (
      <CadastroPage
        onVoltar={() => {
          setPage('login')
        }}
        onCadastroConcluido={() => {
          setPage('cadastrar-negocio')
        }}
      />
    )
  }

  if (page === 'cadastrar-negocio') {
    return (
      <CadastrarNegocioPage
        onVoltar={() => {
          setPage('login')
        }}
        onNegocioCriado={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
      />
    )
  }

  if (!empresaId) {
    setPage('login')
    return null
  }

  if (page === 'negocio') {
    return (
      <NegocioPage
        empresaId={empresaId}
        onSair={async () => {
          await supabase.auth.signOut()
          setEmpresaId(null)
          setPage('login')
        }}
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

  return null
}