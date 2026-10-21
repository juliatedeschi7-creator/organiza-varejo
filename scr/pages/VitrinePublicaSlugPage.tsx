import PaginaPublicaNegocioPage from './PaginaPublicaNegocioPage'

interface VitrinePublicaSlugPageProps {
  slug: string
}

export default function VitrinePublicaSlugPage({
  slug,
}: VitrinePublicaSlugPageProps) {
  return <PaginaPublicaNegocioPage slug={slug} />
}
