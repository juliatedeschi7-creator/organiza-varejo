import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'
import InicioPage from './pages/InicioPage'

type Page = 'login' | 'cadastro' | 'inicio'

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
          console.log('Abrir cadastro do negócio')
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