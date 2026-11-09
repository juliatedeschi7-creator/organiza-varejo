import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'
import InicioPage from './pages/InicioPage'
import ExplorarPage from './pages/ExplorarPage'
import CadastrarNegocioPage from './pages/CadastrarNegocioPage'
import NegocioPage from './pages/NegocioPage'
import ProdutosPage from './pages/ProdutosPage'
import CategoriasPage from './pages/CategoriasPage'
import PaginaPublicaNegocioPage from './pages/PaginaPublicaNegocioPage'
import EditarEmpresaPage from './pages/EditarEmpresaPage'
import EditarEnderecoPage from './pages/EditarEnderecoPage'
import PersonalizacaoNegocioPage from './pages/PersonalizacaoNegocioPage'
import VitrinePublicaSlugPage from './pages/VitrinePublicaSlugPage'
import RedefinirSenhaPage from './pages/RedefinirSenhaPage'
import ProdutosVitrinePage from './pages/ProdutosVitrinePage'

export interface CidadeOrganiza {
  cidade: string
  estado: string
}

const CHAVE_CIDADE_ORGANIZA = 'organiza_cidade_selecionada'

function lerCidadeSalva(): CidadeOrganiza | null {
  try {
    const valor = window.localStorage.getItem(CHAVE_CIDADE_ORGANIZA)
    if (!valor) return null

    const cidade = JSON.parse(valor) as Partial<CidadeOrganiza>

    if (
      typeof cidade.cidade !== 'string' ||
      typeof cidade.estado !== 'string' ||
      !cidade.cidade.trim() ||
      !cidade.estado.trim()
    ) {
      return null
    }

    return {
      cidade: cidade.cidade.trim(),
      estado: cidade.estado.trim(),
    }
  } catch {
    return null
  }
}

type Page =
  | 'login'
  | 'cadastro'
  | 'inicio'
  | 'explorar'
  | 'cadastrar-negocio'
  | 'negocio'
  | 'produtos'
  | 'categorias'
  | 'pagina-publica'
  | 'editar-empresa'
  | 'editar-endereco'
  | 'personalizacao'
  | 'redefinir-senha'
  | 'produtos-vitrine'

function obterSlugDaUrl() {
  const caminho = window.location.pathname
    .replace(/^\/+|\/+$/g, '')

  if (!caminho) return null

  const partes = caminho.split('/')

  if (partes.length !== 1) return null

  try {
    const slug = decodeURIComponent(partes[0])
      .trim()
      .toLowerCase()

    return slug || null
  } catch {
    return null
  }
}

export default function App() {
  const caminhoAtual = window.location.pathname
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()

  const ehPaginaRedefinirSenha =
    caminhoAtual === 'redefinir-senha'

  const slugPublico = ehPaginaRedefinirSenha
    ? null
    : obterSlugDaUrl()

  const ehVitrinePublica = Boolean(slugPublico)

  const [page, setPage] = useState<Page>('login')
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [cidadeSelecionada, setCidadeSelecionada] =
    useState<CidadeOrganiza | null>(() => lerCidadeSalva())

  useEffect(() => {
    if (cidadeSelecionada) {
      window.localStorage.setItem(
        CHAVE_CIDADE_ORGANIZA,
        JSON.stringify(cidadeSelecionada),
      )
    } else {
      window.localStorage.removeItem(CHAVE_CIDADE_ORGANIZA)
    }
  }, [cidadeSelecionada])

  useEffect(() => {
    let montado = true

    async function iniciar() {
      if (ehVitrinePublica) {
        if (montado) setCarregando(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!montado) return

      if (ehPaginaRedefinirSenha) {
        setPage('redefinir-senha')
        setCarregando(false)
        return
      }

      if (!session?.user) {
        setEmpresaId(null)
        setPage('login')
        setCarregando(false)
        return
      }

      setEmpresaId(null)
      setPage('inicio')
      setCarregando(false)
    }

    iniciar()

    if (ehVitrinePublica) {
      return () => {
        montado = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!montado) return

        if (event === 'PASSWORD_RECOVERY') {
          setPage('redefinir-senha')
          setCarregando(false)
          return
        }

        if (ehPaginaRedefinirSenha) {
          setPage('redefinir-senha')
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
  }, [ehVitrinePublica, ehPaginaRedefinirSenha])

  if (ehVitrinePublica && slugPublico) {
    return <VitrinePublicaSlugPage slug={slugPublico} />
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

  if (page === 'redefinir-senha') {
    return (
      <RedefinirSenhaPage
        onVoltarLogin={() => {
          window.history.replaceState(null, '', '/')
          setPage('login')
        }}
        onSenhaRedefinida={() => {
          window.history.replaceState(null, '', '/')
          setEmpresaId(null)
          setPage('inicio')
        }}
      />
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
        cidadeSelecionada={cidadeSelecionada}
        onSelecionarCidade={setCidadeSelecionada}
        onExplorar={() => setPage('explorar')}
        onCadastrarNegocio={() => setPage('cadastrar-negocio')}
        onAgoraNao={() => setPage('inicio')}
        onAbrirEmpresa={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'explorar') {
    return (
      <ExplorarPage
        cidadeSelecionada={cidadeSelecionada}
        onVoltar={() => setPage('inicio')}
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

  if (!empresaId) {
    return (
      <InicioPage
        cidadeSelecionada={cidadeSelecionada}
        onSelecionarCidade={setCidadeSelecionada}
        onExplorar={() => setPage('explorar')}
        onCadastrarNegocio={() => setPage('cadastrar-negocio')}
        onAgoraNao={() => setPage('inicio')}
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
        onAbrirVitrine={() => setPage('pagina-publica')}
        onAbrirProdutos={() => setPage('produtos')}
        onAbrirProdutosVitrine={() => setPage('produtos-vitrine')}
        onAbrirCategorias={() => setPage('categorias')}
        onAbrirEditarEmpresa={() => setPage('editar-empresa')}
        onAbrirEditarEndereco={() => setPage('editar-endereco')}
        onAbrirPersonalizacao={() => setPage('personalizacao')}
      />
    )
  }

  if (page === 'produtos') {
    return (
      <ProdutosPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

if (page === 'produtos-vitrine') {
  return (
    <ProdutosVitrinePage
      empresaId={empresaId}
      onVoltar={() => setPage('negocio')}
    />
  )
}

  if (page === 'categorias') {
    return (
      <CategoriasPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

  if (page === 'editar-empresa') {
    return (
      <EditarEmpresaPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

  if (page === 'editar-endereco') {
    return (
      <EditarEnderecoPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

  if (page === 'personalizacao') {
    return (
      <PersonalizacaoNegocioPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

  if (page === 'pagina-publica') {
    return (
      <PaginaPublicaNegocioPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

  return (
    <InicioPage
      cidadeSelecionada={cidadeSelecionada}
      onSelecionarCidade={setCidadeSelecionada}
      onExplorar={() => setPage('explorar')}
      onCadastrarNegocio={() => setPage('cadastrar-negocio')}
      onAgoraNao={() => setPage('inicio')}
      onAbrirEmpresa={(id) => {
        setEmpresaId(id)
        setPage('negocio')
      }}
    />
  )
}
