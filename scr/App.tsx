import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'
import InicioPage from './pages/InicioPage'
import CadastrarNegocioPage from './pages/CadastrarNegocioPage'

type Page = 'login' | 'cadastro' | 'inicio' | 'cadastrar-negocio'

function App() {
  const [page, setPage] = useState<Page>('login')

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

  if (page === 'cadastrar-negocio') {
    return (
      <CadastrarNegocioPage
        onVoltar={() => setPage('inicio')}
        onCadastroSucesso={(empresaId) => {
          console.log('Negócio criado:', empresaId)
          setPage('inicio')
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
