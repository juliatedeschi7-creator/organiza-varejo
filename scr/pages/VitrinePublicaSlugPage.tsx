import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PaginaPublicaNegocioPage from './PaginaPublicaNegocioPage'

interface VitrinePublicaSlugPageProps {
  slug: string
}

export default function VitrinePublicaSlugPage({
  slug,
}: VitrinePublicaSlugPageProps) {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarEmpresa()
  }, [slug])

  async function carregarEmpresa() {
    try {
      setCarregando(true)
      setErro('')
      setEmpresaId(null)

      const slugNormalizado = slug.trim().toLowerCase()

      if (!slugNormalizado) {
        setErro('Negócio não encontrado.')
        return
      }

      const { data, error } = await supabase
        .from('empresas')
        .select('id, status')
        .eq('slug', slugNormalizado)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data) {
        setErro('Negócio não encontrado.')
        return
      }

      if (data.status !== 'ativa') {
        setErro('Este negócio não está disponível no momento.')
        return
      }

      setEmpresaId(data.id)
    } catch (error) {
      console.error(
        'Erro ao localizar negócio pelo endereço público:',
        error,
      )

      setErro(
        'Não foi possível carregar este negócio.',
      )
    } finally {
      setCarregando(false)
    }
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
          background: '#F7F9F7',
          color: '#202622',
        }}
      >
        <p>Carregando...</p>
      </main>
    )
  }

  if (erro || !empresaId) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#F7F9F7',
          color: '#202622',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
          }}
        >
          <h1
            style={{
              margin: '0 0 10px',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            Negócio não encontrado
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#66706A',
            }}
          >
            {erro ||
              'O endereço informado não corresponde a um negócio disponível.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <PaginaPublicaNegocioPage
      empresaId={empresaId}
    />
  )
}