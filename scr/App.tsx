import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CadastroPage from './pages/CadastroPage'

type Page = 'login' | 'cadastro'

function App() {
  const [page, setPage] = useState<Page>('login')

  if (page === 'cadastro') {
    return (
      <CadastroPage
        onVoltarLogin={() => setPage('login')}
      />
    )
  }

  return (
    <LoginPage
      onCriarConta={() => setPage('cadastro')}
    />
  )
}

export default App