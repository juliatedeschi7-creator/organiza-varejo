import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'
import InicioPage from './pages/InicioPage'
import CadastrarNegocioPage from './pages/CadastrarNegocioPage'
import NegocioPage from './pages/NegocioPage'
import PaginaPublicaNegocioPage from './pages/PaginaPublicaNegocioPage'
import ProdutosPage from './pages/ProdutosPage'

type Page =
  | 'login'
  | 'cadastro'
  | 'inicio'
  | 'cadastrar-negocio'
  | 'negocio'
  | 'produtos'
  | 'pagina-publica'

function App() {
  const [page, setPage] = useState<Page>('login')
  const [empresaId, setEmpresaId] = useState<string | null>(null)

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
        onVoltar={() => setPage('inicio')}
        onCadastroSucesso={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
      />
    )
  }

  if (page === 'negocio') {
    if (!empresaId) {
      setPage('inicio')
      return null
    }

    return (
      <NegocioPage
        empresaId={empresaId}
        onSair={() => {
          setEmpresaId(null)
          setPage('login')
        }}
        onAbrirVitrine={() => {
          setPage('pagina-publica')
        }}
        onAbrirProdutos={() => {
          setPage('produtos')
        }}
      />
    )
  }

  if (page === 'produtos') {
    if (!empresaId) {
      setPage('inicio')
      return null
    }

    return (
      <ProdutosPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

  if (page === 'pagina-publica') {
    if (!empresaId) {
      setPage('inicio')
      return null
    }

    return (
      <PaginaPublicaNegocioPage
        empresaId={empresaId}
        onVoltar={() => setPage('negocio')}
      />
    )
  }

  if (page === 'inicio') {
    return (
      <InicioPage
        onExplorar={() => {
          console.log('Abrir área de lojas e compras')
        }}
        onCadastrarNegocio={() => {
          setPage('cadastrar-negocio')
        }}
        onAgoraNao={() => {
          setPage('login')
        }}
        onAbrirEmpresa={(id) => {
          setEmpresaId(id)
          setPage('negocio')
        }}
      />
    )
  }

  return (
    <LoginPage
      onCriarConta={() => setPage('cadastro')}
      onLoginSuccess={() => setPage('inicio')}
    />
  )
}

export default App