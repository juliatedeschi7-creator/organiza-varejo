import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Eye,
  Palette,
  RotateCcw,
  Save,
  Smartphone,
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

export default function PersonalizacaoNegocioPage({
  empresaId,
  onVoltar,
  onAbrirVitrine,
}: PersonalizacaoNegocioPageProps) {
  const [vitrine, setVitrine] = useState<Vitrine | null>(null)
  const [aparencia, setAparencia] =
    useState<VitrineAparencia>(VALORES_PADRAO)

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregar()
  }, [empresaId])

  async function carregar() {
    try {
      setCarregando(true)
      setMensagem('')

      const { data: vitrineData, error: vitrineError } = await supabase
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
        .limit(1)
        .maybeSingle()

      if (vitrineError) {
        throw vitrineError
      }

      if (!vitrineData) {
        setVitrine(null)
        setMensagem('Nenhuma vitrine foi encontrada para este negócio.')
        return
      }

      setVitrine(vitrineData as Vitrine)

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
          .eq('vitrine_id', vitrineData.id)
          .maybeSingle()

      if (aparenciaError) {
        throw aparenciaError
      }

      if (aparenciaData) {
        setAparencia({
          id: aparenciaData.id,
          vitrine_id: aparenciaData.vitrine_id,
          fonte: aparenciaData.fonte,
          estilo_botoes: aparenciaData.estilo_botoes,
          estilo_cards: aparenciaData.estilo_cards,
          raio_bordas: aparenciaData.raio_bordas,
          mostrar_logo: aparenciaData.mostrar_logo,
          mostrar_nome_loja: aparenciaData.mostrar_nome_loja,
          layout_inicio: aparenciaData.layout_inicio,
          tema: aparenciaData.tema,
        })
      } else {
        setAparencia({
          ...VALORES_PADRAO,
          vitrine_id: vitrineData.id,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar personalização:', error)
      setMensagem('Não foi possível carregar a personalização da vitrine.')
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

  async function salvar() {
    if (!vitrine) return

    try {
      setSalvando(true)
      setMensagem('')

      const { error: vitrineError } = await supabase
        .from('vitrines')
        .update({
          nome_exibicao: vitrine.nome_exibicao,
          descricao: vitrine.descricao,
          cor_principal: vitrine.cor_principal,
          cor_secundaria: vitrine.cor_secundaria,
          cor_destaque: vitrine.cor_destaque,
          mensagem_boas_vindas: vitrine.mensagem_boas_vindas,
          mensagem_fechado: vitrine.mensagem_fechado,
          mostrar_precos: vitrine.mostrar_precos,
          permitir_pedidos: vitrine.permitir_pedidos,
          permitir_favoritos: vitrine.permitir_favoritos,
          permitir_compartilhamento: vitrine.permitir_compartilhamento,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vitrine.id)

      if (vitrineError) {
        throw vitrineError
      }

      const dadosAparencia = {
        vitrine_id: vitrine.id,
        fonte: aparencia.fonte,
        estilo_botoes: aparencia.estilo_botoes,
        estilo_cards: aparencia.estilo_cards,
        raio_bordas: aparencia.raio_bordas,
        mostrar_logo: aparencia.mostrar_logo,
        mostrar_nome_loja: aparencia.mostrar_nome_loja,
        layout_inicio: aparencia.layout_inicio,
        tema: aparencia.tema,
        updated_at: new Date().toISOString(),
      }

      const { data: aparenciaSalva, error: aparenciaError } =
        await supabase
          .from('vitrine_aparencia')
          .upsert(dadosAparencia, {
            onConflict: 'vitrine_id',
          })
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
          .single()

      if (aparenciaError) {
        throw aparenciaError
      }

      if (aparenciaSalva) {
        setAparencia({
          id: aparenciaSalva.id,
          vitrine_id: aparenciaSalva.vitrine_id,
          fonte: aparenciaSalva.fonte,
          estilo_botoes: aparenciaSalva.estilo_botoes,
          estilo_cards: aparenciaSalva.estilo_cards,
          raio_bordas: aparenciaSalva.raio_bordas,
          mostrar_logo: aparenciaSalva.mostrar_logo,
          mostrar_nome_loja: aparenciaSalva.mostrar_nome_loja,
          layout_inicio: aparenciaSalva.layout_inicio,
          tema: aparenciaSalva.tema,
        })
      }

      setMensagem('Personalização salva com sucesso.')

      setTimeout(() => {
        setMensagem('')
      }, 3000)
    } catch (error) {
      console.error('Erro ao salvar personalização:', error)
      setMensagem('Não foi possível salvar a personalização.')
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

    setMensagem('Configurações visuais restauradas para o padrão.')
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
          <button onClick={onVoltar} style={styles.backButton}>
            <ArrowLeft size={20} />
            Voltar
          </button>

          <div>
            <h1 style={styles.title}>Personalização</h1>
            <p style={styles.subtitle}>
              Configure como sua vitrine aparece para seus clientes.
            </p>
          </div>
        </header>

        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>
            {mensagem || 'Nenhuma vitrine encontrada.'}
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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={onVoltar} style={styles.backButton}>
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Personalização</h1>
            <p style={styles.subtitle}>
              Escolha como sua vitrine será apresentada aos clientes.
            </p>
          </div>

          {onAbrirVitrine && (
            <button
              onClick={onAbrirVitrine}
              style={styles.previewButton}
            >
              <Eye size={18} />
              Ver vitrine
            </button>
          )}
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
            {mensagem.includes('sucesso') && <Check size={18} />}
            {mensagem}
          </div>
        )}

        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            <Palette size={21} />
            <div>
              <h2 style={styles.sectionHeading}>Identidade da vitrine</h2>
              <p style={styles.sectionDescription}>
                Essas informações aparecem na sua vitrine pública.
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <label style={styles.label}>
              Nome exibido
            </label>

            <input
              value={vitrine.nome_exibicao || ''}
              onChange={(e) =>
                alterarVitrine('nome_exibicao', e.target.value)
              }
              placeholder="Nome que aparecerá na vitrine"
              style={styles.input}
            />

            <label style={styles.label}>
              Descrição
            </label>

            <textarea
              value={vitrine.descricao || ''}
              onChange={(e) =>
                alterarVitrine('descricao', e.target.value)
              }
              placeholder="Conte um pouco sobre seu negócio"
              style={styles.textarea}
            />

            <label style={styles.label}>
              Mensagem de boas-vindas
            </label>

            <textarea
              value={vitrine.mensagem_boas_vindas || ''}
              onChange={(e) =>
                alterarVitrine(
                  'mensagem_boas_vindas',
                  e.target.value,
                )
              }
              placeholder="Uma mensagem para receber seus clientes"
              style={styles.textarea}
            />

            <label style={styles.label}>
              Mensagem quando estiver fechado
            </label>

            <textarea
              value={vitrine.mensagem_fechado || ''}
              onChange={(e) =>
                alterarVitrine(
                  'mensagem_fechado',
                  e.target.value,
                )
              }
              placeholder="Mensagem exibida quando a loja estiver fechada"
              style={styles.textarea}
            />
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            <Palette size={21} />
            <div>
              <h2 style={styles.sectionHeading}>Cores</h2>
              <p style={styles.sectionDescription}>
                Defina as cores usadas pela sua vitrine.
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.colorGrid}>
              <ColorField
                label="Cor principal"
                value={vitrine.cor_principal}
                fallback={corPrincipal}
                onChange={(value) =>
                  alterarVitrine('cor_principal', value)
                }
              />

              <ColorField
                label="Cor secundária"
                value={vitrine.cor_secundaria}
                fallback={corSecundaria}
                onChange={(value) =>
                  alterarVitrine('cor_secundaria', value)
                }
              />

              <ColorField
                label="Cor de destaque"
                value={vitrine.cor_destaque}
                fallback={corDestaque}
                onChange={(value) =>
                  alterarVitrine('cor_destaque', value)
                }
              />
            </div>

            <div style={styles.previewColorBox}>
              <div
                style={{
                  ...styles.previewColorPrimary,
                  background: corPrincipal,
                }}
              />

              <div
                style={{
                  ...styles.previewColorSecondary,
                  background: corSecundaria,
                }}
              />

              <div
                style={{
                  ...styles.previewColorHighlight,
                  background: corDestaque,
                }}
              />

              <span style={styles.previewColorText}>
                Prévia das cores
              </span>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            <Smartphone size={21} />
            <div>
              <h2 style={styles.sectionHeading}>
                Aparência
              </h2>
              <p style={styles.sectionDescription}>
                Personalize o formato e a apresentação da vitrine.
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <label style={styles.label}>
              Estilo dos botões
            </label>

            <div style={styles.optionsGrid}>
              <OptionButton
                selected={aparencia.estilo_botoes === 'arredondado'}
                title="Arredondado"
                description="Botões com cantos suaves"
                onClick={() =>
                  alterarAparencia(
                    'estilo_botoes',
                    'arredondado',
                  )
                }
              />

              <OptionButton
                selected={aparencia.estilo_botoes === 'quadrado'}
                title="Quadrado"
                description="Botões com cantos discretos"
                onClick={() =>
                  alterarAparencia(
                    'estilo_botoes',
                    'quadrado',
                  )
                }
              />
            </div>

            <label style={styles.label}>
              Estilo dos cartões
            </label>

            <div style={styles.optionsGrid}>
              <OptionButton
                selected={aparencia.estilo_cards === 'suave'}
                title="Suave"
                description="Cartões leves e discretos"
                onClick={() =>
                  alterarAparencia(
                    'estilo_cards',
                    'suave',
                  )
                }
              />

              <OptionButton
                selected={aparencia.estilo_cards === 'destacado'}
                title="Destacado"
                description="Cartões mais marcados"
                onClick={() =>
                  alterarAparencia(
                    'estilo_cards',
                    'destacado',
                  )
                }
              />
            </div>

            <label style={styles.label}>
              Arredondamento dos cantos
            </label>

            <div style={styles.rangeContainer}>
              <input
                type="range"
                min="0"
                max="30"
                value={aparencia.raio_bordas ?? 12}
                onChange={(e) =>
                  alterarAparencia(
                    'raio_bordas',
                    Number(e.target.value),
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
                selected={aparencia.tema === 'claro'}
                title="Claro"
                description="Fundo claro e aparência leve"
                onClick={() =>
                  alterarAparencia('tema', 'claro')
                }
              />

              <OptionButton
                selected={aparencia.tema === 'escuro'}
                title="Escuro"
                description="Fundo escuro e aparência mais marcante"
                onClick={() =>
                  alterarAparencia('tema', 'escuro')
                }
              />
            </div>

            <label style={styles.label}>
              Página inicial
            </label>

            <div style={styles.optionsGrid}>
              <OptionButton
                selected={aparencia.layout_inicio === 'catalogo'}
                title="Catálogo"
                description="Produtos como destaque inicial"
                onClick={() =>
                  alterarAparencia(
                    'layout_inicio',
                    'catalogo',
                  )
                }
              />

              <OptionButton
                selected={aparencia.layout_inicio === 'inicio'}
                title="Início"
                description="Apresentação do negócio antes do catálogo"
                onClick={() =>
                  alterarAparencia(
                    'layout_inicio',
                    'inicio',
                  )
                }
              />
            </div>

            <Toggle
              label="Mostrar logo"
              description="Exibir o logo da empresa na vitrine"
              value={aparencia.mostrar_logo}
              onChange={(value) =>
                alterarAparencia(
                  'mostrar_logo',
                  value,
                )
              }
            />

            <Toggle
              label="Mostrar nome da loja"
              description="Exibir o nome do negócio junto à vitrine"
              value={aparencia.mostrar_nome_loja}
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
          <div style={styles.sectionTitle}>
            <Smartphone size={21} />
            <div>
              <h2 style={styles.sectionHeading}>
                Recursos da vitrine
              </h2>
              <p style={styles.sectionDescription}>
                Controle o que seus clientes podem fazer.
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <Toggle
              label="Mostrar preços"
              description="Exibir os preços dos produtos"
              value={vitrine.mostrar_precos}
              onChange={(value) =>
                alterarVitrine(
                  'mostrar_precos',
                  value,
                )
              }
            />

            <Toggle
              label="Permitir pedidos"
              description="Permitir que clientes façam pedidos pela vitrine"
              value={vitrine.permitir_pedidos}
              onChange={(value) =>
                alterarVitrine(
                  'permitir_pedidos',
                  value,
                )
              }
            />

            <Toggle
              label="Permitir favoritos"
              description="Permitir que clientes favoritem produtos"
              value={vitrine.permitir_favoritos}
              onChange={(value) =>
                alterarVitrine(
                  'permitir_favoritos',
                  value,
                )
              }
            />

            <Toggle
              label="Permitir compartilhamento"
              description="Permitir o compartilhamento da vitrine"
              value={vitrine.permitir_compartilhamento}
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
            Restaurar aparência padrão
          </button>

          <button
            onClick={salvar}
            style={styles.saveButton}
            disabled={salvando}
          >
            <Save size={18} />
            {salvando ? 'Salvando...' : 'Salvar personalização'}
          </button>
        </div>
      </main>
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string | null
  fallback: string
  onChange: (value: string) => void
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: ColorFieldProps) {
  return (
    <div>
      <label style={styles.label}>{label}</label>

      <div style={styles.colorInputRow}>
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          style={styles.colorPicker}
        />

        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          style={styles.input}
        />
      </div>
    </div>
  )
}

interface OptionButtonProps {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}

function OptionButton({
  selected,
  title,
  description,
  onClick,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.optionButton,
        ...(selected ? styles.optionButtonSelected : {}),
      }}
    >
      <div style={styles.optionTop}>
        <span
          style={{
            ...styles.radio,
            ...(selected ? styles.radioSelected : {}),
          }}
        >
          {selected && <span style={styles.radioDot} />}
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

interface ToggleProps {
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: ToggleProps) {
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
          ...(value ? styles.toggleActive : {}),
        }}
      >
        <span
          style={{
            ...styles.toggleCircle,
            ...(value ? styles.toggleCircleActive : {}),
          }}
        />
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
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

  headerContent: {
    maxWidth: 1100,
    margin: '18px auto 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
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

  content: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '28px 24px 50px',
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
    boxShadow: '0 2px 8px rgba(20, 40, 25, 0.03)',
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
    minHeight: 95,
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
      'repeat(auto-fit, minmax(220px, 1fr))',
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
  },

  previewColorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginTop: 8,
    padding: 12,
    background: '#F7F9F7',
    borderRadius: 10,
  },

  previewColorPrimary: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },

  previewColorSecondary: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },

  previewColorHighlight: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },

  previewColorText: {
    color: '#66706A',
    fontSize: 13,
    marginLeft: 4,
  },

  optionsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
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
    position: 'relative',
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
    maxWidth: 1100,
    margin: '28px auto',
    background: '#FFFFFF',
    border: '1px solid #E2E9E4',
    borderRadius: 16,
    padding: 30,
  },

  emptyText: {
    margin: 0,
    color: '#66706A',
  },
}