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
import VitrinePublicaSlugPage from './pages/VitrinePublicaSlugPage'

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

function obterSlugDaUrl() {
  const caminho = window.location.pathname
    .replace(/^\/+|\/+$/g, '')

  if (!caminho) {
    return null
  }

  const partes = caminho.split('/')

  if (partes.length !== 1) {
    return null
  }

  const slug = decodeURIComponent(partes[0]).trim()

  if (!slug) {
    return null
  }

  return slug.toLowerCase()
}

export default function App() {
  const slugPublico = obterSlugDaUrl()
  const ehVitrinePublica = Boolean(slugPublico)

  const [page, setPage] = useState<Page>('login')
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let montado = true

    async function iniciar() {
      /*
       * Uma vitrine pública não depende de autenticação.
       *
       * Se a pessoa entrou diretamente em:
       *
       * /mariamagnolia
       *
       * deixamos a VitrinePublicaSlugPage localizar a empresa
       * pelo slug.
       */
      if (ehVitrinePublica) {
        if (montado) {
          setCarregando(false)
        }

        return
      }

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
       * Depois do login sempre vamos para a InicioPage.
       *
       * A InicioPage consulta membros_empresa e apresenta
       * todas as empresas às quais o usuário tem acesso.
       */
      setEmpresaId(null)
      setPage('inicio')
      setCarregando(false)
    }

    iniciar()

    /*
     * Não precisamos observar mudanças de autenticação
     * enquanto estamos em uma vitrine pública.
     */
    if (ehVitrinePublica) {
      return () => {
        montado = false
      }
    }

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

        setEmpresaId(null)
        setPage('inicio')
      },
    )

    return () => {
      montado = false
      subscription.unsubscribe()
    }
  }, [ehVitrinePublica])

  /*
   * ============================================
   * VITRINE PÚBLICA
   * ============================================
   *
   * Esta parte vem antes do login porque a vitrine
   * deve ser acessível por qualquer pessoa.
   */
  if (ehVitrinePublica && slugPublico) {
    return (
      <VitrinePublicaSlugPage
        slug={slugPublico}
      />
    )
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
        onLoginSuccess={() => {
          setEmpresaId(null)
          setPage('inicio')
        }}
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
           * O Mercado Local será conectado aqui.
           */
          console.log('Abrir Mercado Local')
        }}
        onCadastrarNegocio={() => {
          setPage('cadastrar-negocio')
        }}
        onAgoraNao={() => {
          setPage('inicio')
        }}
        onAbrirEmpresa={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'cadastrar-negocio') {
    return (
      <CadastrarNegocioPage
        onVoltar={() => {
          setEmpresaId(null)
          setPage('inicio')
        }}
        onCadastroSucesso={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
      />
    )
  }

  /*
   * Todas as telas abaixo dependem de uma empresa selecionada.
   */
  if (!empresaId) {
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
        onAbrirEmpresa={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
      />
    )
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
        onVoltar={() => {
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'categorias') {
    return (
      <CategoriasPage
        empresaId={empresaId}
        onVoltar={() => {
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'editar-empresa') {
    return (
      <EditarEmpresaPage
        empresaId={empresaId}
        onVoltar={() => {
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'editar-endereco') {
    return (
      <EditarEnderecoPage
        empresaId={empresaId}
        onVoltar={() => {
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'personalizacao') {
    return (
      <PersonalizacaoNegocioPage
        empresaId={empresaId}
        onVoltar={() => {
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'pagina-publica') {
    return (
      <PaginaPublicaNegocioPage
        empresaId={empresaId}
        onVoltar={() => {
          setPage('negocio')
        }}
      />
    )
  }

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
      onAbrirEmpresa={(id) => {
        setEmpresaId(id)
        setPage('negocio')
      }}
    />
  )
}