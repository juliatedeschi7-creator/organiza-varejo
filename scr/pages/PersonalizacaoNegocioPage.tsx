import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
} from 'react'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PersonalizacaoNegocioPageProps {
  empresaId: string
  onVoltar: () => void
  onAbrirVitrine?: () => void
}

interface Vitrine {
  id: string
  empresa_id: string
  nome_exibicao: string | null
  descricao: string | null
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  cor_principal: string | null
  cor_secundaria: string | null
  cor_destaque: string | null
  mensagem_boas_vindas: string | null
  mensagem_fechado: string | null
  mostrar_precos: boolean
  permitir_pedidos: boolean
  permitir_favoritos: boolean
  permitir_compartilhamento: boolean
  ativo: boolean
  fuso_horario: string
}

interface VitrineAparencia {
  id?: string
  vitrine_id: string
  fonte: string | null
  estilo_botoes: string | null
  estilo_cards: string | null
  raio_bordas: number | null
  mostrar_logo: boolean
  mostrar_nome_loja: boolean
  layout_inicio: string | null
  tema: string | null
}

interface VitrineSecao {
  id: string
  vitrine_id: string
  tipo: string
  titulo: string | null
  ordem: number
  visivel: boolean
  configuracoes: Record<string, unknown>
}

interface Empresa {
  id: string
  nome_fantasia: string | null
  logo_url: string | null
}

const VALORES_PADRAO: VitrineAparencia = {
  vitrine_id: '',
  fonte: null,
  estilo_botoes: 'arredondado',
  estilo_cards: 'suave',
  raio_bordas: 12,
  mostrar_logo: true,
  mostrar_nome_loja: true,
  layout_inicio: 'catalogo',
  tema: 'claro',
}

const SECOES_PADRAO = [
  {
    tipo: 'banner',
    titulo: 'Apresentação',
  },
  {
    tipo: 'categorias',
    titulo: 'Categorias',
  },
  {
    tipo: 'destaques',
    titulo: 'Destaques',
  },
  {
    tipo: 'produtos',
    titulo: 'Produtos',
  },
  {
    tipo: 'onde_estamos',
    titulo: 'Onde estamos',
  },
]

const INFORMACOES_SECOES: Record<
  string,
  {
    nome: string
    descricao: string
    simbolo: string
  }
> = {
  banner: {
    nome: 'Apresentação',
    descricao: 'Imagem, mensagem e identidade da loja.',
    simbolo: 'A',
  },
  categorias: {
    nome: 'Categorias',
    descricao: 'Permite encontrar produtos por categoria.',
    simbolo: 'C',
  },
  destaques: {
    nome: 'Destaques',
    descricao: 'Produtos escolhidos para receber destaque.',
    simbolo: 'D',
  },
  produtos: {
    nome: 'Produtos',
    descricao: 'Catálogo de produtos da vitrine.',
    simbolo: 'P',
  },
  onde_estamos: {
    nome: 'Onde estamos',
    descricao: 'Localização e informações da loja.',
    simbolo: 'L',
  },
}

export default function PersonalizacaoNegocioPage({
  empresaId,
  onVoltar,
  onAbrirVitrine,
}: PersonalizacaoNegocioPageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [vitrine, setVitrine] = useState<Vitrine | null>(null)
  const [aparencia, setAparencia] =
    useState<VitrineAparencia>(VALORES_PADRAO)
  const [secoes, setSecoes] = useState<VitrineSecao[]>([])

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [enviandoCapa, setEnviandoCapa] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [arrastandoId, setArrastandoId] = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const capaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregar()
  }, [empresaId])

async function carregar() {
  let etapa = 'início'

  try {
    setCarregando(true)
    setMensagem('')

    etapa = 'empresa'

    const { data: empresaData, error: empresaError } =
      await supabase
        .from('empresas')
        .select('id, nome_fantasia, logo_url')
        .eq('id', empresaId)
        .maybeSingle()

    if (empresaError) {
      throw new Error(
        `Erro ao carregar empresa: ${empresaError.message}`,
      )
    }

    if (!empresaData) {
      setMensagem(
        'Negócio não encontrado para este usuário.',
      )
      return
    }

    setEmpresa(empresaData as Empresa)

    etapa = 'vitrine'

    const { data: vitrineData, error: vitrineError } =
      await supabase
        .from('vitrines')
        .select(`
          id,
          empresa_id,
          nome_exibicao,
          descricao,
          slug,
          logo_url,
          banner_url,
          cor_principal,
          cor_secundaria,
          cor_destaque,
          mensagem_boas_vindas,
          mensagem_fechado,
          mostrar_precos,
          permitir_pedidos,
          permitir_favoritos,
          permitir_compartilhamento,
          ativo,
          fuso_horario
        `)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('created_at', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle()

    if (vitrineError) {
      throw new Error(
        `Erro ao carregar vitrine: ${vitrineError.message}`,
      )
    }

    let vitrineAtual: Vitrine

    if (!vitrineData) {
      etapa = 'criação da vitrine'

      const { data: novaVitrine, error: novaVitrineError } =
        await supabase
          .from('vitrines')
          .insert({
            empresa_id: empresaId,
            nome_exibicao:
              empresaData.nome_fantasia ||
              'Minha loja',
            logo_url:
              empresaData.logo_url || null,
            cor_principal: '#159447',
            cor_secundaria: '#EAF7EF',
            cor_destaque: '#0F6F38',
            mostrar_precos: true,
            permitir_pedidos: true,
            permitir_favoritos: true,
            permitir_compartilhamento: true,
            ativo: true,
            fuso_horario: 'America/Sao_Paulo',
          })
          .select(`
            id,
            empresa_id,
            nome_exibicao,
            descricao,
            slug,
            logo_url,
            banner_url,
            cor_principal,
            cor_secundaria,
            cor_destaque,
            mensagem_boas_vindas,
            mensagem_fechado,
            mostrar_precos,
            permitir_pedidos,
            permitir_favoritos,
            permitir_compartilhamento,
            ativo,
            fuso_horario
          `)
          .single()

      if (novaVitrineError) {
        throw new Error(
          `Erro ao criar vitrine: ${novaVitrineError.message}`,
        )
      }

      vitrineAtual = novaVitrine as Vitrine
    } else {
      vitrineAtual = vitrineData as Vitrine
    }

    setVitrine(vitrineAtual)

    etapa = 'aparência da vitrine'

    const { data: aparenciaData, error: aparenciaError } =
      await supabase
        .from('vitrine_aparencia')
        .select(`
          id,
          vitrine_id,
          fonte,
          estilo_botoes,
          estilo_cards,
          raio_bordas,
          mostrar_logo,
          mostrar_nome_loja,
          layout_inicio,
          tema
        `)
        .eq('vitrine_id', vitrineAtual.id)
        .maybeSingle()

    if (aparenciaError) {
      throw new Error(
        `Erro ao carregar aparência: ${aparenciaError.message}`,
      )
    }

    if (aparenciaData) {
      setAparencia(
        aparenciaData as VitrineAparencia,
      )
    } else {
      setAparencia({
        ...VALORES_PADRAO,
        vitrine_id: vitrineAtual.id,
      })
    }

    etapa = 'seções da vitrine'

    const { data: secoesData, error: secoesError } =
      await supabase
        .from('vitrine_secoes')
        .select(`
          id,
          vitrine_id,
          tipo,
          titulo,
          ordem,
          visivel,
          configuracoes
        `)
        .eq('vitrine_id', vitrineAtual.id)
        .order('ordem', {
          ascending: true,
        })

    if (secoesError) {
      throw new Error(
        `Erro ao carregar seções: ${secoesError.message}`,
      )
    }

    if (
      !secoesData ||
      secoesData.length === 0
    ) {
      etapa = 'criação das seções padrão'

      const novasSecoes =
        SECOES_PADRAO.map(
          (secao, index) => ({
            vitrine_id: vitrineAtual.id,
            tipo: secao.tipo,
            titulo: secao.titulo,
            ordem: index + 1,
            visivel: true,
            configuracoes: {},
          }),
        )

      const {
        data: secoesCriadas,
        error: criarSecoesError,
      } = await supabase
        .from('vitrine_secoes')
        .insert(novasSecoes)
        .select(`
          id,
          vitrine_id,
          tipo,
          titulo,
          ordem,
          visivel,
          configuracoes
        `)
        .order('ordem', {
          ascending: true,
        })

      if (criarSecoesError) {
        throw new Error(
          `Erro ao criar seções padrão: ${criarSecoesError.message}`,
        )
      }

      setSecoes(
        (secoesCriadas || []) as VitrineSecao[],
      )
    } else {
      setSecoes(
        secoesData as VitrineSecao[],
      )
    }
  } catch (error) {
    console.error(
      'Erro detalhado na personalização:',
      {
        etapa,
        error,
      },
    )

    const mensagemErro =
      error instanceof Error
        ? error.message
        : String(error)

    setMensagem(
      `Não foi possível abrir a personalização. Etapa: ${etapa}. ${mensagemErro}`,
    )
  } finally {
    setCarregando(false)
  }
}

  function alterarAparencia(
    campo: keyof VitrineAparencia,
    valor: string | number | boolean | null,
  ) {
    setAparencia((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  function alterarVitrine(
    campo: keyof Vitrine,
    valor: string | boolean | null,
  ) {
    setVitrine((atual) => {
      if (!atual) return atual

      return {
        ...atual,
        [campo]: valor,
      }
    })
  }

  function alterarSecao(
    id: string,
    campo: 'titulo' | 'visivel',
    valor: string | boolean,
  ) {
    setSecoes((atuais) =>
      atuais.map((secao) =>
        secao.id === id
          ? {
              ...secao,
              [campo]: valor,
            }
          : secao,
      ),
    )
  }

  function iniciarArraste(
    event: DragEvent<HTMLDivElement>,
    id: string,
  ) {
    setArrastandoId(id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }

  function soltarSecao(
    event: DragEvent<HTMLDivElement>,
    idDestino: string,
  ) {
    event.preventDefault()

    const idArrastado =
      event.dataTransfer.getData('text/plain') ||
      arrastandoId

    if (!idArrastado || idArrastado === idDestino) {
      setArrastandoId(null)
      return
    }

    setSecoes((atuais) => {
      const origem = atuais.findIndex(
        (item) => item.id === idArrastado,
      )

      const destino = atuais.findIndex(
        (item) => item.id === idDestino,
      )

      if (origem === -1 || destino === -1) {
        return atuais
      }

      const copia = [...atuais]
      const [item] = copia.splice(origem, 1)

      copia.splice(destino, 0, item)

      return copia.map((secao, index) => ({
        ...secao,
        ordem: index + 1,
      }))
    })

    setArrastandoId(null)
  }

  function alterarArquivo(
    event: ChangeEvent<HTMLInputElement>,
    tipo: 'logo' | 'capa',
  ) {
    const arquivo = event.target.files?.[0]

    event.target.value = ''

    if (!arquivo) return

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(arquivo.type)
    ) {
      setMensagem(
        'Escolha uma imagem JPG, PNG ou WebP.',
      )
      return
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setMensagem(
        'A imagem deve ter no máximo 5 MB.',
      )
      return
    }

    if (tipo === 'logo') {
      enviarLogo(arquivo)
    } else {
      enviarCapa(arquivo)
    }
  }

  async function enviarLogo(arquivo: File) {
    if (!vitrine) return

    try {
      setEnviandoLogo(true)
      setMensagem('')

      const extensao =
        arquivo.name.split('.').pop()?.toLowerCase() ||
        'jpg'

      const caminho = `${empresaId}/logo.${extensao}`

      const { error: uploadError } =
        await supabase.storage
          .from('empresa-imagens')
          .upload(caminho, arquivo, {
            upsert: true,
            contentType: arquivo.type,
          })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } =
        supabase.storage
          .from('empresa-imagens')
          .getPublicUrl(caminho)

      const url = publicUrlData.publicUrl

      const { error: empresaError } =
        await supabase
          .from('empresas')
          .update({
            logo_url: url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', empresaId)

      if (empresaError) {
        throw empresaError
      }

      const { error: vitrineError } =
        await supabase
          .from('vitrines')
          .update({
            logo_url: url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vitrine.id)

      if (vitrineError) {
        throw vitrineError
      }

      setEmpresa((atual) =>
        atual
          ? {
              ...atual,
              logo_url: url,
            }
          : atual,
      )

      setVitrine((atual) =>
        atual
          ? {
              ...atual,
              logo_url: url,
            }
          : atual,
      )

      setMensagem('Logo atualizado com sucesso.')

      window.setTimeout(() => {
        setMensagem('')
      }, 3000)
    } catch (error) {
      console.error(
        'Erro ao enviar logo:',
        error,
      )

      setMensagem(
        'Não foi possível enviar o logo.',
      )
    } finally {
      setEnviandoLogo(false)
    }
  }

  async function enviarCapa(arquivo: File) {
    if (!vitrine) return

    try {
      setEnviandoCapa(true)
      setMensagem('')

      const extensao =
        arquivo.name.split('.').pop()?.toLowerCase() ||
        'jpg'

      const caminho = `${empresaId}/banner.${extensao}`

      const { error: uploadError } =
        await supabase.storage
          .from('empresa-imagens')
          .upload(caminho, arquivo, {
            upsert: true,
            contentType: arquivo.type,
          })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } =
        supabase.storage
          .from('empresa-imagens')
          .getPublicUrl(caminho)

      const url = `${publicUrlData.publicUrl}?v=${Date.now()}`

      const { error: vitrineError } =
        await supabase
          .from('vitrines')
          .update({
            banner_url: url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vitrine.id)

      if (vitrineError) {
        throw vitrineError
      }

      setVitrine((atual) =>
        atual
          ? {
              ...atual,
              banner_url: url,
            }
          : atual,
      )

      setMensagem(
        'Imagem de capa atualizada com sucesso.',
      )

      window.setTimeout(() => {
        setMensagem('')
      }, 3000)
    } catch (error) {
      console.error(
        'Erro ao enviar capa:',
        error,
      )

      setMensagem(
        'Não foi possível enviar a imagem de capa.',
      )
    } finally {
      setEnviandoCapa(false)
    }
  }

  async function removerCapa() {
    if (!vitrine) return

    try {
      setEnviandoCapa(true)
      setMensagem('')

      const arquivos = [
        `${empresaId}/banner.jpg`,
        `${empresaId}/banner.jpeg`,
        `${empresaId}/banner.png`,
        `${empresaId}/banner.webp`,
      ]

      await supabase.storage
        .from('empresa-imagens')
        .remove(arquivos)

      const { error } = await supabase
        .from('vitrines')
        .update({
          banner_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vitrine.id)

      if (error) {
        throw error
      }

      setVitrine((atual) =>
        atual
          ? {
              ...atual,
              banner_url: null,
            }
          : atual,
      )

      setMensagem(
        'Imagem de capa removida.',
      )

      window.setTimeout(() => {
        setMensagem('')
      }, 3000)
    } catch (error) {
      console.error(
        'Erro ao remover capa:',
        error,
      )

      setMensagem(
        'Não foi possível remover a imagem de capa.',
      )
    } finally {
      setEnviandoCapa(false)
    }
  }

  async function salvar() {
    if (!vitrine) return

    try {
      setSalvando(true)
      setMensagem('')

      const { error: vitrineError } =
        await supabase
          .from('vitrines')
          .update({
            nome_exibicao: vitrine.nome_exibicao,
            descricao: vitrine.descricao,
            cor_principal: vitrine.cor_principal,
            cor_secundaria: vitrine.cor_secundaria,
            cor_destaque: vitrine.cor_destaque,
            mensagem_boas_vindas:
              vitrine.mensagem_boas_vindas,
            mensagem_fechado:
              vitrine.mensagem_fechado,
            mostrar_precos:
              vitrine.mostrar_precos,
            permitir_pedidos:
              vitrine.permitir_pedidos,
            permitir_favoritos:
              vitrine.permitir_favoritos,
            permitir_compartilhamento:
              vitrine.permitir_compartilhamento,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', vitrine.id)

      if (vitrineError) {
        throw vitrineError
      }

      const { error: aparenciaError } =
        await supabase
          .from('vitrine_aparencia')
          .upsert(
            {
              vitrine_id: vitrine.id,
              fonte: aparencia.fonte,
              estilo_botoes:
                aparencia.estilo_botoes,
              estilo_cards:
                aparencia.estilo_cards,
              raio_bordas:
                aparencia.raio_bordas,
              mostrar_logo:
                aparencia.mostrar_logo,
              mostrar_nome_loja:
                aparencia.mostrar_nome_loja,
              layout_inicio:
                aparencia.layout_inicio,
              tema: aparencia.tema,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: 'vitrine_id',
            },
          )

      if (aparenciaError) {
        throw aparenciaError
      }

      for (const [index, secao] of secoes.entries()) {
        const { error: secaoError } =
          await supabase
            .from('vitrine_secoes')
            .update({
              titulo: secao.titulo,
              ordem: index + 1,
              visivel: secao.visivel,
              configuracoes:
                secao.configuracoes,
              updated_at:
                new Date().toISOString(),
            })
            .eq('id', secao.id)
            .eq('vitrine_id', vitrine.id)

        if (secaoError) {
          throw secaoError
        }
      }

      setSecoes((atuais) =>
        atuais.map((secao, index) => ({
          ...secao,
          ordem: index + 1,
        })),
      )

      setMensagem(
        'Personalização salva com sucesso.',
      )

      window.setTimeout(() => {
        setMensagem('')
      }, 3000)
    } catch (error) {
      console.error(
        'Erro ao salvar personalização:',
        error,
      )

      setMensagem(
        'Não foi possível salvar a personalização.',
      )
    } finally {
      setSalvando(false)
    }
  }

  function restaurarPadrao() {
    if (!vitrine) return

    setAparencia({
      ...VALORES_PADRAO,
      vitrine_id: vitrine.id,
    })

    setSecoes((atuais) =>
      atuais.map((secao, index) => ({
        ...secao,
        ordem: index + 1,
        visivel: true,
      })),
    )

    setMensagem(
      'A aparência e a ordem foram restauradas na prévia. Salve para aplicar.',
    )
  }

  if (carregando) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>
          Carregando personalização...
        </div>
      </div>
    )
  }

  if (!vitrine) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <button
            onClick={onVoltar}
            style={styles.backButton}
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        </header>

        <div style={styles.emptyCard}>
          <h1 style={styles.emptyTitle}>
            Não foi possível abrir a personalização
          </h1>

          <p style={styles.emptyText}>
            {mensagem ||
              'Nenhuma vitrine foi encontrada.'}
          </p>
        </div>
      </div>
    )
  }

  const corPrincipal =
    vitrine.cor_principal || '#159447'

  const corSecundaria =
    vitrine.cor_secundaria || '#EAF7EF'

  const corDestaque =
    vitrine.cor_destaque || '#0F6F38'

  const logo =
    vitrine.logo_url ||
    empresa?.logo_url ||
    null

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button
          onClick={onVoltar}
          style={styles.backButton}
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>
              Personalização
            </h1>

            <p style={styles.subtitle}>
              Monte a vitrine do jeito que combina
              com o seu negócio.
            </p>
          </div>

          <div style={styles.headerActions}>
            {onAbrirVitrine && (
              <button
                onClick={onAbrirVitrine}
                style={styles.previewButton}
              >
                <Eye size={18} />
                Ver vitrine
              </button>
            )}

            <button
              onClick={salvar}
              disabled={salvando}
              style={styles.saveHeaderButton}
            >
              <Save size={18} />
              {salvando
                ? 'Salvando...'
                : 'Salvar'}
            </button>
          </div>
        </div>
      </header>

      <main style={styles.content}>
        {mensagem && (
          <div
            style={{
              ...styles.message,
              ...(mensagem.includes('sucesso')
                ? styles.successMessage
                : {}),
            }}
          >
            {mensagem.includes('sucesso') && (
              <Check size={18} />
            )}

            {mensagem}
          </div>
        )}

        <section style={styles.section}>
          <SectionHeader
            icon={<ImageIcon size={21} />}
            title="Identidade"
            description="Crie a primeira impressão da sua vitrine."
          />

          <div style={styles.card}>
            <div style={styles.identityGrid}>
              <div>
                <label style={styles.label}>
                  Logo
                </label>

                <div style={styles.logoUploadArea}>
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo da loja"
                      style={styles.logoPreview}
                    />
                  ) : (
                    <div style={styles.logoPlaceholder}>
                      <ImageIcon size={28} />
                      <span>
                        Nenhum logo
                      </span>
                    </div>
                  )}

                  <div style={styles.uploadActions}>
                    <button
                      type="button"
                      onClick={() =>
                        logoInputRef.current?.click()
                      }
                      style={styles.uploadButton}
                      disabled={enviandoLogo}
                    >
                      <Upload size={17} />
                      {enviandoLogo
                        ? 'Enviando...'
                        : 'Trocar logo'}
                    </button>

                    <span style={styles.uploadHint}>
                      JPG, PNG ou WebP • até 5 MB
                    </span>
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      alterarArquivo(
                        event,
                        'logo',
                      )
                    }
                    style={styles.hiddenInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>
                  Imagem de capa
                </label>

                <div style={styles.coverUploadArea}>
                  {vitrine.banner_url ? (
                    <img
                      src={vitrine.banner_url}
                      alt="Imagem de capa da vitrine"
                      style={styles.coverPreview}
                    />
                  ) : (
                    <div
                      style={
                        styles.coverPlaceholder
                      }
                    >
                      <ImageIcon size={30} />

                      <strong>
                        Sua capa aparecerá aqui
                      </strong>

                      <span>
                        Use uma imagem que represente
                        sua loja.
                      </span>
                    </div>
                  )}

                  <div style={styles.coverActions}>
                    <button
                      type="button"
                      onClick={() =>
                        capaInputRef.current?.click()
                      }
                      style={styles.uploadButton}
                      disabled={enviandoCapa}
                    >
                      <Upload size={17} />

                      {enviandoCapa
                        ? 'Enviando...'
                        : vitrine.banner_url
                          ? 'Trocar capa'
                          : 'Escolher capa'}
                    </button>

                    {vitrine.banner_url && (
                      <button
                        type="button"
                        onClick={removerCapa}
                        style={
                          styles.removeButton
                        }
                        disabled={enviandoCapa}
                      >
                        <Trash2 size={16} />
                        Remover
                      </button>
                    )}

                    <span style={styles.uploadHint}>
                      JPG, PNG ou WebP • até 5 MB
                    </span>
                  </div>

                  <input
                    ref={capaInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      alterarArquivo(
                        event,
                        'capa',
                      )
                    }
                    style={styles.hiddenInput}
                  />
                </div>
              </div>
            </div>

            <div style={styles.identityFields}>
              <label style={styles.label}>
                Nome exibido
              </label>

              <input
                value={
                  vitrine.nome_exibicao || ''
                }
                onChange={(event) =>
                  alterarVitrine(
                    'nome_exibicao',
                    event.target.value,
                  )
                }
                placeholder="Nome que aparecerá na vitrine"
                style={styles.input}
              />

              <label style={styles.label}>
                Descrição
              </label>

              <textarea
                value={vitrine.descricao || ''}
                onChange={(event) =>
                  alterarVitrine(
                    'descricao',
                    event.target.value,
                  )
                }
                placeholder="Conte um pouco sobre seu negócio"
                style={styles.textarea}
              />

              <label style={styles.label}>
                Mensagem de boas-vindas
              </label>

              <textarea
                value={
                  vitrine.mensagem_boas_vindas ||
                  ''
                }
                onChange={(event) =>
                  alterarVitrine(
                    'mensagem_boas_vindas',
                    event.target.value,
                  )
                }
                placeholder="Uma mensagem para receber seus clientes"
                style={styles.textarea}
              />

              <label style={styles.label}>
                Mensagem quando estiver fechado
              </label>

              <textarea
                value={
                  vitrine.mensagem_fechado || ''
                }
                onChange={(event) =>
                  alterarVitrine(
                    'mensagem_fechado',
                    event.target.value,
                  )
                }
                placeholder="Mensagem exibida quando a loja estiver fechada"
                style={styles.textarea}
              />
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <SectionHeader
            icon={<Palette size={21} />}
            title="Cores"
            description="Escolha a personalidade visual da sua loja."
          />

          <div style={styles.card}>
            <div style={styles.colorGrid}>
              <ColorField
                label="Cor principal"
                value={
                  vitrine.cor_principal
                }
                fallback={corPrincipal}
                onChange={(value) =>
                  alterarVitrine(
                    'cor_principal',
                    value,
                  )
                }
              />

              <ColorField
                label="Cor secundária"
                value={
                  vitrine.cor_secundaria
                }
                fallback={corSecundaria}
                onChange={(value) =>
                  alterarVitrine(
                    'cor_secundaria',
                    value,
                  )
                }
              />

              <ColorField
                label="Cor de destaque"
                value={
                  vitrine.cor_destaque
                }
                fallback={corDestaque}
                onChange={(value) =>
                  alterarVitrine(
                    'cor_destaque',
                    value,
                  )
                }
              />
            </div>

            <div style={styles.colorPreview}>
              <span
                style={{
                  ...styles.colorPreviewItem,
                  background:
                    corPrincipal,
                }}
              />

              <span
                style={{
                  ...styles.colorPreviewItem,
                  background:
                    corSecundaria,
                }}
              />

              <span
                style={{
                  ...styles.colorPreviewItem,
                  background:
                    corDestaque,
                }}
              />

              <span
                style={styles.colorPreviewText}
              >
                Prévia das cores
              </span>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <SectionHeader
            icon={<Smartphone size={21} />}
            title="Aparência"
            description="Escolha o formato visual dos elementos."
          />

          <div style={styles.card}>
            <label style={styles.label}>
              Botões
            </label>

            <div style={styles.optionsGrid}>
              <OptionButton
                selected={
                  aparencia.estilo_botoes ===
                  'arredondado'
                }
                title="Arredondados"
                description="Mais suaves e acolhedores"
                onClick={() =>
                  alterarAparencia(
                    'estilo_botoes',
                    'arredondado',
                  )
                }
              />

              <OptionButton
                selected={
                  aparencia.estilo_botoes ===
                  'quadrado'
                }
                title="Retos"
                description="Mais firmes e modernos"
                onClick={() =>
                  alterarAparencia(
                    'estilo_botoes',
                    'quadrado',
                  )
                }
              />
            </div>

            <label style={styles.label}>
              Cartões
            </label>

            <div style={styles.optionsGrid}>
              <OptionButton
                selected={
                  aparencia.estilo_cards ===
                  'suave'
                }
                title="Suaves"
                description="Leves e discretos"
                onClick={() =>
                  alterarAparencia(
                    'estilo_cards',
                    'suave',
                  )
                }
              />

              <OptionButton
                selected={
                  aparencia.estilo_cards ===
                  'destacado'
                }
                title="Destacados"
                description="Mais marcados na tela"
                onClick={() =>
                  alterarAparencia(
                    'estilo_cards',
                    'destacado',
                  )
                }
              />
            </div>

            <label style={styles.label}>
              Arredondamento
            </label>

            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="0"
                max="30"
                value={
                  aparencia.raio_bordas ?? 12
                }
                onChange={(event) =>
                  alterarAparencia(
                    'raio_bordas',
                    Number(
                      event.target.value,
                    ),
                  )
                }
                style={styles.range}
              />

              <span style={styles.rangeValue}>
                {aparencia.raio_bordas ?? 12}px
              </span>
            </div>

            <label style={styles.label}>
              Tema
            </label>

            <div style={styles.optionsGrid}>
              <OptionButton
                selected={
                  aparencia.tema ===
                  'claro'
                }
                title="Claro"
                description="Leve e iluminado"
                onClick={() =>
                  alterarAparencia(
                    'tema',
                    'claro',
                  )
                }
              />

              <OptionButton
                selected={
                  aparencia.tema ===
                  'escuro'
                }
                title="Escuro"
                description="Mais marcante e envolvente"
                onClick={() =>
                  alterarAparencia(
                    'tema',
                    'escuro',
                  )
                }
              />
            </div>

            <Toggle
              label="Mostrar logo"
              description="Exibir o logo na vitrine"
              value={
                aparencia.mostrar_logo
              }
              onChange={(value) =>
                alterarAparencia(
                  'mostrar_logo',
                  value,
                )
              }
            />

            <Toggle
              label="Mostrar nome da loja"
              description="Exibir o nome junto à identidade"
              value={
                aparencia.mostrar_nome_loja
              }
              onChange={(value) =>
                alterarAparencia(
                  'mostrar_nome_loja',
                  value,
                )
              }
            />
          </div>
        </section>

        <section style={styles.section}>
          <SectionHeader
            icon={<GripVertical size={21} />}
            title="Página inicial"
            description="Escolha quais partes aparecem e em qual ordem."
          />

          <div style={styles.card}>
            <div style={styles.orderIntro}>
              <div>
                <strong style={styles.orderTitle}>
                  Organize sua vitrine
                </strong>

                <p style={styles.orderDescription}>
                  Segure uma seção e arraste para
                  mudar sua posição.
                </p>
              </div>

              <span style={styles.orderHint}>
                ↕ arraste
              </span>
            </div>

            <div style={styles.sectionsList}>
              {secoes.map((secao) => {
                const info =
                  INFORMACOES_SECOES[
                    secao.tipo
                  ] || {
                    nome: secao.tipo,
                    descricao:
                      'Seção da vitrine.',
                    simbolo: '?',
                  }

                return (
                  <div
                    key={secao.id}
                    draggable
                    onDragStart={(event) =>
                      iniciarArraste(
                        event,
                        secao.id,
                      )
                    }
                    onDragOver={(event) =>
                      event.preventDefault()
                    }
                    onDrop={(event) =>
                      soltarSecao(
                        event,
                        secao.id,
                      )
                    }
                    onDragEnd={() =>
                      setArrastandoId(null)
                    }
                    style={{
                      ...styles.sectionItem,
                      ...(arrastandoId ===
                      secao.id
                        ? styles.sectionItemDragging
                        : {}),
                    }}
                  >
                    <GripVertical
                      size={20}
                      color="#9AA59E"
                    />

                    <div
                      style={{
                        ...styles.sectionSymbol,
                        background:
                          secao.visivel
                            ? corSecundaria
                            : '#EEF1EF',
                        color:
                          secao.visivel
                            ? corDestaque
                            : '#87918A',
                      }}
                    >
                      {info.simbolo}
                    </div>

                    <div
                      style={
                        styles.sectionItemInfo
                      }
                    >
                      <div
                        style={
                          styles.sectionItemTop
                        }
                      >
                        <strong
                          style={
                            styles.sectionItemName
                          }
                        >
                          {info.nome}
                        </strong>

                        <span
                          style={
                            styles.sectionNumber
                          }
                        >
                          {secao.ordem}
                        </span>
                      </div>

                      <span
                        style={
                          styles.sectionItemDescription
                        }
                      >
                        {info.descricao}
                      </span>

                      <input
                        value={
                          secao.titulo || ''
                        }
                        onChange={(event) =>
                          alterarSecao(
                            secao.id,
                            'titulo',
                            event.target.value,
                          )
                        }
                        placeholder="Título exibido"
                        style={
                          styles.sectionTitleInput
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        alterarSecao(
                          secao.id,
                          'visivel',
                          !secao.visivel,
                        )
                      }
                      style={
                        styles.visibilityButton
                      }
                      aria-label={
                        secao.visivel
                          ? 'Ocultar seção'
                          : 'Mostrar seção'
                      }
                    >
                      {secao.visivel ? (
                        <Eye size={20} />
                      ) : (
                        <EyeOff size={20} />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <SectionHeader
            icon={<Smartphone size={21} />}
            title="Recursos"
            description="Escolha o que seus clientes podem fazer."
          />

          <div style={styles.card}>
            <Toggle
              label="Mostrar preços"
              description="Exibir os preços dos produtos"
              value={
                vitrine.mostrar_precos
              }
              onChange={(value) =>
                alterarVitrine(
                  'mostrar_precos',
                  value,
                )
              }
            />

            <Toggle
              label="Permitir pedidos"
              description="Permitir pedidos pela vitrine"
              value={
                vitrine.permitir_pedidos
              }
              onChange={(value) =>
                alterarVitrine(
                  'permitir_pedidos',
                  value,
                )
              }
            />

            <Toggle
              label="Permitir favoritos"
              description="Permitir que clientes favorite produtos"
              value={
                vitrine.permitir_favoritos
              }
              onChange={(value) =>
                alterarVitrine(
                  'permitir_favoritos',
                  value,
                )
              }
            />

            <Toggle
              label="Permitir compartilhamento"
              description="Permitir compartilhar a vitrine"
              value={
                vitrine.permitir_compartilhamento
              }
              onChange={(value) =>
                alterarVitrine(
                  'permitir_compartilhamento',
                  value,
                )
              }
            />
          </div>
        </section>

        <div style={styles.bottomActions}>
          <button
            onClick={restaurarPadrao}
            style={styles.secondaryButton}
            disabled={salvando}
          >
            <RotateCcw size={18} />
            Restaurar padrão
          </button>

          <button
            onClick={salvar}
            style={styles.saveButton}
            disabled={salvando}
          >
            <Save size={18} />

            {salvando
              ? 'Salvando...'
              : 'Salvar personalização'}
          </button>
        </div>
      </main>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div style={styles.sectionTitle}>
      {icon}

      <div>
        <h2 style={styles.sectionHeading}>
          {title}
        </h2>

        <p style={styles.sectionDescription}>
          {description}
        </p>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string
  value: string | null
  fallback: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label style={styles.label}>
        {label}
      </label>

      <div style={styles.colorInputRow}>
        <input
          type="color"
          value={value || fallback}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={styles.colorPicker}
        />

        <input
          value={value || ''}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={fallback}
          style={{
            ...styles.input,
            marginBottom: 0,
          }}
        />
      </div>
    </div>
  )
}

function OptionButton({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.optionButton,
        ...(selected
          ? styles.optionButtonSelected
          : {}),
      }}
    >
      <div style={styles.optionTop}>
        <span
          style={{
            ...styles.radio,
            ...(selected
              ? styles.radioSelected
              : {}),
          }}
        >
          {selected && (
            <span style={styles.radioDot} />
          )}
        </span>

        <strong style={styles.optionTitle}>
          {title}
        </strong>
      </div>

      <span style={styles.optionDescription}>
        {description}
      </span>
    </button>
  )
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div style={styles.toggleRow}>
      <div style={styles.toggleText}>
        <strong style={styles.toggleLabel}>
          {label}
        </strong>

        <span style={styles.toggleDescription}>
          {description}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-label={label}
        style={{
          ...styles.toggle,
          ...(value
            ? styles.toggleActive
            : {}),
        }}
      >
        <span
          style={{
            ...styles.toggleCircle,
            ...(value
              ? styles.toggleCircleActive
              : {}),
          }}
        />
      </button>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F7F9F7',
    color: '#202622',
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#66706A',
    fontSize: 16,
  },

  header: {
    background: '#FFFFFF',
    borderBottom: '1px solid #E4EAE5',
    padding: '18px 24px',
  },

  backButton: {
    border: 'none',
    background: 'transparent',
    color: '#3F4843',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 15,
    padding: 0,
  },

  headerContent: {
    maxWidth: 1200,
    margin: '18px auto 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },

  subtitle: {
    margin: '7px 0 0',
    color: '#66706A',
    fontSize: 15,
  },

  previewButton: {
    border: '1px solid #D8E2DB',
    background: '#FFFFFF',
    color: '#0F6F38',
    borderRadius: 10,
    padding: '11px 16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },

  saveHeaderButton: {
    border: 'none',
    background: '#159447',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: '11px 16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },

  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 24px 60px',
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 13,
    color: '#0F6F38',
  },

  sectionHeading: {
    margin: 0,
    color: '#202622',
    fontSize: 19,
    fontWeight: 700,
  },

  sectionDescription: {
    margin: '4px 0 0',
    color: '#66706A',
    fontSize: 14,
  },

  card: {
    background: '#FFFFFF',
    border: '1px solid #E2E9E4',
    borderRadius: 16,
    padding: 22,
    boxShadow:
      '0 2px 8px rgba(20, 40, 25, 0.03)',
  },

  identityGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(250px, 0.7fr) minmax(320px, 1.3fr)',
    gap: 22,
  },

  identityFields: {
    marginTop: 24,
  },

  logoUploadArea: {
    border: '1px solid #E0E7E2',
    borderRadius: 14,
    padding: 16,
    background: '#FAFBFA',
    minHeight: 155,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  logoPreview: {
    width: 105,
    height: 105,
    objectFit: 'contain',
    borderRadius: 14,
    background: '#FFFFFF',
    border: '1px solid #E4EAE5',
  },

  logoPlaceholder: {
    width: 105,
    height: 105,
    borderRadius: 14,
    background: '#EEF3EF',
    color: '#87918B',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontSize: 11,
    flexShrink: 0,
  },

  uploadActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },

  uploadButton: {
    border: '1px solid #CFE0D4',
    background: '#FFFFFF',
    color: '#0F6F38',
    borderRadius: 9,
    padding: '9px 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },

  uploadHint: {
    color: '#87918B',
    fontSize: 11,
    lineHeight: 1.4,
  },

  hiddenInput: {
    display: 'none',
  },

  coverUploadArea: {
    border: '1px solid #E0E7E2',
    borderRadius: 14,
    overflow: 'hidden',
    background: '#FAFBFA',
  },

  coverPreview: {
    display: 'block',
    width: '100%',
    height: 165,
    objectFit: 'cover',
  },

  coverPlaceholder: {
    height: 165,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    color: '#87918B',
    padding: 20,
    textAlign: 'center',
  },

  coverActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    flexWrap: 'wrap',
    padding: 12,
    background: '#FFFFFF',
    borderTop: '1px solid #E5EBE6',
  },

  removeButton: {
    border: '1px solid #E6D6D6',
    background: '#FFFFFF',
    color: '#9A4141',
    borderRadius: 9,
    padding: '9px 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },

  label: {
    display: 'block',
    margin: '0 0 8px',
    color: '#303934',
    fontSize: 14,
    fontWeight: 600,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #D8E1DB',
    background: '#FFFFFF',
    color: '#202622',
    borderRadius: 10,
    padding: '12px 13px',
    fontSize: 15,
    outline: 'none',
    marginBottom: 18,
  },

  textarea: {
    width: '100%',
    minHeight: 90,
    boxSizing: 'border-box',
    resize: 'vertical',
    border: '1px solid #D8E1DB',
    background: '#FFFFFF',
    color: '#202622',
    borderRadius: 10,
    padding: '12px 13px',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    marginBottom: 18,
  },

  colorGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 18,
  },

  colorInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },

  colorPicker: {
    width: 48,
    height: 43,
    padding: 3,
    border: '1px solid #D8E1DB',
    borderRadius: 9,
    background: '#FFFFFF',
    cursor: 'pointer',
    flexShrink: 0,
  },

  colorPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginTop: 18,
    padding: 12,
    background: '#F7F9F7',
    borderRadius: 10,
  },

  colorPreviewItem: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },

  colorPreviewText: {
    color: '#66706A',
    fontSize: 13,
    marginLeft: 4,
  },

  optionsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 12,
    marginBottom: 22,
  },

  optionButton: {
    textAlign: 'left',
    border: '1px solid #DCE5DF',
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    cursor: 'pointer',
  },

  optionButtonSelected: {
    border: '2px solid #159447',
    background: '#F2FAF5',
    padding: 14,
  },

  optionTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },

  radio: {
    width: 17,
    height: 17,
    borderRadius: '50%',
    border: '1px solid #B8C5BD',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  radioSelected: {
    borderColor: '#159447',
  },

  radioDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#159447',
  },

  optionTitle: {
    fontSize: 14,
    color: '#202622',
  },

  optionDescription: {
    display: 'block',
    color: '#66706A',
    fontSize: 12,
    marginTop: 7,
    paddingLeft: 26,
    lineHeight: 1.4,
  },

  rangeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 15,
    marginBottom: 22,
  },

  range: {
    flex: 1,
    accentColor: '#159447',
  },

  rangeValue: {
    minWidth: 48,
    textAlign: 'right',
    color: '#303934',
    fontWeight: 600,
    fontSize: 14,
  },

  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    padding: '15px 0',
    borderTop: '1px solid #EDF1EE',
  },

  toggleText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  toggleLabel: {
    color: '#303934',
    fontSize: 14,
  },

  toggleDescription: {
    color: '#66706A',
    fontSize: 13,
  },

  toggle: {
    width: 50,
    height: 29,
    border: 'none',
    borderRadius: 20,
    background: '#C8D2CC',
    padding: 3,
    cursor: 'pointer',
    flexShrink: 0,
  },

  toggleActive: {
    background: '#159447',
  },

  toggleCircle: {
    display: 'block',
    width: 23,
    height: 23,
    borderRadius: '50%',
    background: '#FFFFFF',
    transition: 'transform 0.15s ease',
  },

  toggleCircleActive: {
    transform: 'translateX(21px)',
  },

  orderIntro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    paddingBottom: 16,
    borderBottom: '1px solid #EDF1EE',
    marginBottom: 14,
  },

  orderTitle: {
    display: 'block',
    color: '#303934',
    fontSize: 15,
  },

  orderDescription: {
    margin: '5px 0 0',
    color: '#66706A',
    fontSize: 13,
  },

  orderHint: {
    color: '#7B867F',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },

  sectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  sectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#FFFFFF',
    border: '1px solid #DCE5DF',
    borderRadius: 13,
    padding: 11,
    cursor: 'grab',
  },

  sectionItemDragging: {
    opacity: 0.55,
    transform: 'scale(0.99)',
  },

  sectionSymbol: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0,
  },

  sectionItemInfo: {
    minWidth: 0,
    flex: 1,
  },

  sectionItemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },

  sectionItemName: {
    color: '#303934',
    fontSize: 14,
  },

  sectionNumber: {
    color: '#8B958F',
    fontSize: 11,
    background: '#F0F3F1',
    borderRadius: 20,
    padding: '2px 7px',
  },

  sectionItemDescription: {
    display: 'block',
    color: '#7A847E',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 1.3,
  },

  sectionTitleInput: {
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 8,
    border: '1px solid #E2E8E4',
    borderRadius: 7,
    padding: '7px 8px',
    fontSize: 12,
    color: '#303934',
    outline: 'none',
    background: '#FAFBFA',
  },

  visibilityButton: {
    border: 'none',
    background: 'transparent',
    color: '#0F6F38',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 7,
    flexShrink: 0,
  },

  bottomActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
  },

  secondaryButton: {
    border: '1px solid #D8E2DB',
    background: '#FFFFFF',
    color: '#4B554F',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },

  saveButton: {
    border: 'none',
    background: '#159447',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: '13px 19px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },

  message: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#FFF4E5',
    color: '#7A4D00',
    border: '1px solid #F0D8A8',
    borderRadius: 10,
    padding: '11px 14px',
    marginBottom: 22,
    fontSize: 14,
  },

  successMessage: {
    background: '#EAF7EF',
    color: '#0F6F38',
    borderColor: '#BDE0C9',
  },

  emptyCard: {
    maxWidth: 700,
    margin: '40px auto',
    background: '#FFFFFF',
    border: '1px solid #E2E9E4',
    borderRadius: 16,
    padding: 30,
  },

  emptyTitle: {
    margin: '0 0 8px',
    fontSize: 21,
  },

  emptyText: {
    margin: 0,
    color: '#66706A',
  },
}