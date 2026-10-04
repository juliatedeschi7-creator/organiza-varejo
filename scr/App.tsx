import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'
import InicioPage from './pages/InicioPage'
import CadastrarNegocioPage from './pages/CadastrarNegocioPage'
import NegocioPage from './pages/NegocioPage'

type Page =
  | 'login'
  | 'cadastro'
  | 'inicio'
  | 'cadastrar-negocio'
  | 'negocio'

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
