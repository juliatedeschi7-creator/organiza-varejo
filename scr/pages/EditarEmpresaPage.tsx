import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  FileText,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react'

interface EditarEmpresaPageProps {
  empresaId: string
  onVoltar: () => void
}

interface Empresa {
  razao_social: string
  nome_fantasia: string
  documento: string
  slug: string
  email: string
  telefone: string
  whatsapp: string
  cidade: string
  estado: string
  descricao_publica: string
  logo_url: string
}

const estilos: Record<string, CSSProperties> = {
  pagina: {
    minHeight: '100vh',
    background: '#f7f7f5',
    padding: '24px 16px 50px',
    color: '#222',
  },

  container: {
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
  },

  topo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },

  botaoVoltar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid #deded8',
    background: '#fff',
    color: '#333',
    cursor: 'pointer',
    flexShrink: 0,
  },

  tituloArea: {
    flex: 1,
  },

  titulo: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },

  subtitulo: {
    margin: '5px 0 0',
    color: '#777',
    fontSize: '14px',
  },

  card: {
    background: '#fff',
    border: '1px solid #e7e7e2',
    borderRadius: '18px',
    padding: '24px',
    marginBottom: '18px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  },

  tituloSecao: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: 700,
  },

  iconeSecao: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#f1f1ed',
    color: '#333',
  },

  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '18px',
  },

  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  campoLargo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginTop: '18px',
  },

  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#444',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #dcdcd6',
    borderRadius: '10px',
    padding: '12px 13px',
    fontSize: '15px',
    outline: 'none',
    background: '#fff',
    color: '#222',
  },

  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #dcdcd6',
    borderRadius: '10px',
    padding: '12px 13px',
    fontSize: '15px',
    outline: 'none',
    background: '#fff',
    color: '#222',
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },

  ajuda: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#888',
    lineHeight: 1.4,
  },

  rodape: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    marginTop: '10px',
  },

  botaoSalvar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '11px',
    padding: '13px 22px',
    background: '#222',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  mensagem: {
    padding: '12px 14px',
    borderRadius: '10px',
    background: '#f0f0eb',
    color: '#444',
    fontSize: '14px',
    marginBottom: '18px',
  },

  erro: {
    padding: '12px 14px',
    borderRadius: '10px',
    background: '#fff0f0',
    color: '#a33',
    fontSize: '14px',
    marginBottom: '18px',
  },

  carregando: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#777',
    fontSize: '15px',
  },

  observacao: {
    marginTop: '8px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: '#fafaf7',
    border: '1px solid #eeeeea',
    color: '#777',
    fontSize: '13px',
    lineHeight: 1.5,
  },

  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },

  logoPreview: {
    width: '130px',
    height: '130px',
    borderRadius: '18px',
    border: '1px solid #e1e1dc',
    background: '#fafaf7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },

  logoImagem: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  logoVazia: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#999',
    fontSize: '12px',
    textAlign: 'center',
    padding: '12px',
  },

  logoAcoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'flex-start',
  },

  botaoUpload: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: '1px solid #dcdcd6',
    borderRadius: '10px',
    padding: '11px 15px',
    background: '#fff',
    color: '#333',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  botaoRemover: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    border: 'none',
    background: 'transparent',
    color: '#9a4444',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
  },

  inputArquivo: {
    display: 'none',
  },

  logoInfo: {
    margin: 0,
    fontSize: '13px',
    color: '#777',
    lineHeight: 1.5,
    maxWidth: '460px',
  },
}

export default function EditarEmpresaPage({
  empresaId,
  onVoltar,
}: EditarEmpresaPageProps) {
  const [empresa, setEmpresa] = useState<Empresa>({
    razao_social: '',
    nome_fantasia: '',
    documento: '',
    slug: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cidade: '',
    estado: '',
    descricao_publica: '',
    logo_url: '',
  })

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [removendoLogo, setRemovendoLogo] = useState(false)

  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarEmpresa()
  }, [empresaId])

  async function carregarEmpresa() {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('empresas')
      .select(`
        razao_social,
        nome_fantasia,
        documento,
        slug,
        email,
        telefone,
        whatsapp,
        cidade,
        estado,
        descricao_publica,
        logo_url
      `)
      .eq('id', empresaId)
      .maybeSingle()

    if (error) {
      console.error(error)
      setErro('Não foi possível carregar os dados da empresa.')
      setCarregando(false)
      return
    }

    if (!data) {
      setErro('Empresa não encontrada.')
      setCarregando(false)
      return
    }

    setEmpresa({
      razao_social: data.razao_social ?? '',
      nome_fantasia: data.nome_fantasia ?? '',
      documento: data.documento ?? '',
      slug: data.slug ?? '',
      email: data.email ?? '',
      telefone: data.telefone ?? '',
      whatsapp: data.whatsapp ?? '',
      cidade: data.cidade ?? '',
      estado: data.estado ?? '',
      descricao_publica: data.descricao_publica ?? '',
      logo_url: data.logo_url ?? '',
    })

    setCarregando(false)
  }

  function alterarCampo(campo: keyof Empresa, valor: string) {
    setEmpresa((atual) => ({
      ...atual,
      [campo]: valor,
    }))

    setMensagem('')
    setErro('')
  }

  function obterCaminhoArquivo(url: string) {
    const marcador = '/empresa-imagens/'

    const indice = url.indexOf(marcador)

    if (indice === -1) {
      return null
    }

    return decodeURIComponent(
      url.substring(indice + marcador.length)
    )
  }

  async function removerArquivoAnterior() {
    if (!empresa.logo_url) {
      return
    }

    const caminho = obterCaminhoArquivo(empresa.logo_url)

    if (!caminho) {
      return
    }

    const { error } = await supabase.storage
      .from('empresa-imagens')
      .remove([caminho])

    if (error) {
      console.error('Erro ao remover arquivo anterior:', error)
    }
  }

  async function selecionarLogo(
    evento: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = evento.target.files?.[0]

    evento.target.value = ''

    if (!arquivo) {
      return
    }

    setMensagem('')
    setErro('')

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro('Escolha uma imagem JPEG, PNG ou WebP.')
      return
    }

    const limite = 5 * 1024 * 1024

    if (arquivo.size > limite) {
      setErro('A imagem precisa ter no máximo 5 MB.')
      return
    }

    setEnviandoLogo(true)

    try {
      await removerArquivoAnterior()

      const extensoes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }

      const extensao = extensoes[arquivo.type]

      const caminho = `${empresaId}/logo.${extensao}`

      const { error: uploadError } = await supabase.storage
        .from('empresa-imagens')
        .upload(caminho, arquivo, {
          cacheControl: '3600',
          upsert: false,
          contentType: arquivo.type,
        })

      if (uploadError) {
        console.error(uploadError)
        setErro('Não foi possível enviar a logo.')
        setEnviandoLogo(false)
        return
      }

      const {
        data: urlData,
      } = supabase.storage
        .from('empresa-imagens')
        .getPublicUrl(caminho)

      const logoUrl = urlData.publicUrl

      const { error: empresaError } = await supabase
        .from('empresas')
        .update({
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', empresaId)

      if (empresaError) {
        console.error(empresaError)

        await supabase.storage
          .from('empresa-imagens')
          .remove([caminho])

        setErro('A imagem foi enviada, mas não foi possível salvar a logo na empresa.')
        setEnviandoLogo(false)
        return
      }

      setEmpresa((atual) => ({
        ...atual,
        logo_url: logoUrl,
      }))

      setMensagem('Logo atualizada com sucesso.')
    } catch (error) {
      console.error(error)
      setErro('Não foi possível atualizar a logo.')
    }

    setEnviandoLogo(false)
  }

  async function removerLogo() {
    if (!empresa.logo_url) {
      return
    }

    setRemovendoLogo(true)
    setMensagem('')
    setErro('')

    const caminho = obterCaminhoArquivo(empresa.logo_url)

    if (caminho) {
      const { error: storageError } = await supabase.storage
        .from('empresa-imagens')
        .remove([caminho])

      if (storageError) {
        console.error(storageError)
        setErro('Não foi possível remover a imagem.')
        setRemovendoLogo(false)
        return
      }
    }

    const { error: empresaError } = await supabase
      .from('empresas')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', empresaId)

    if (empresaError) {
      console.error(empresaError)
      setErro('A imagem foi removida, mas não foi possível atualizar a empresa.')
      setRemovendoLogo(false)
      return
    }

    setEmpresa((atual) => ({
      ...atual,
      logo_url: '',
    }))

    setMensagem('Logo removida com sucesso.')
    setRemovendoLogo(false)
  }

  async function salvar() {
    setSalvando(true)
    setMensagem('')
    setErro('')

    const { error } = await supabase
      .from('empresas')
      .update({
        razao_social: empresa.razao_social.trim(),
        nome_fantasia: empresa.nome_fantasia.trim(),
        documento: empresa.documento.trim(),
        slug: empresa.slug.trim(),
        email: empresa.email.trim(),
        telefone: empresa.telefone.trim(),
        whatsapp: empresa.whatsapp.trim(),
        cidade: empresa.cidade.trim(),
        estado: empresa.estado.trim(),
        descricao_publica: empresa.descricao_publica.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', empresaId)

    if (error) {
      console.error(error)
      setErro('Não foi possível salvar as alterações.')
      setSalvando(false)
      return
    }

    setMensagem('Informações salvas com sucesso.')
    setSalvando(false)
  }

  if (carregando) {
    return <div style={estilos.carregando}>Carregando informações...</div>
  }

  return (
    <div style={estilos.pagina}>
      <div style={estilos.container}>

        <div style={estilos.topo}>
          <button
            type="button"
            onClick={onVoltar}
            style={estilos.botaoVoltar}
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>

          <div style={estilos.tituloArea}>
            <h1 style={estilos.titulo}>
              Informações do negócio
            </h1>

            <p style={estilos.subtitulo}>
              Mantenha os dados da empresa sempre atualizados.
            </p>
          </div>
        </div>

        {erro && (
          <div style={estilos.erro}>
            {erro}
          </div>
        )}

        {mensagem && (
          <div style={estilos.mensagem}>
            {mensagem}
          </div>
        )}

        <div style={estilos.card}>
          <h2 style={estilos.tituloSecao}>
            <span style={estilos.iconeSecao}>
              <ImageIcon size={19} />
            </span>

            Logo do negócio
          </h2>

          <div style={estilos.logoArea}>

            <div style={estilos.logoPreview}>
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={`Logo de ${empresa.nome_fantasia || 'seu negócio'}`}
                  style={estilos.logoImagem}
                />
              ) : (
                <div style={estilos.logoVazia}>
                  <ImageIcon size={30} />
                  <span>
                    Nenhuma logo cadastrada
                  </span>
                </div>
              )}
            </div>

            <div style={estilos.logoAcoes}>

              <label
                htmlFor="arquivo-logo"
                style={{
                  ...estilos.botaoUpload,
                  opacity:
                    enviandoLogo || removendoLogo ? 0.6 : 1,
                  cursor:
                    enviandoLogo || removendoLogo
                      ? 'default'
                      : 'pointer',
                }}
              >
                <Upload size={17} />

                {enviandoLogo
                  ? 'Enviando...'
                  : empresa.logo_url
                    ? 'Trocar logo'
                    : 'Adicionar logo'}
              </label>

              <input
                id="arquivo-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selecionarLogo}
                disabled={enviandoLogo || removendoLogo}
                style={estilos.inputArquivo}
              />

              {empresa.logo_url && (
                <button
                  type="button"
                  onClick={removerLogo}
                  disabled={enviandoLogo || removendoLogo}
                  style={{
                    ...estilos.botaoRemover,
                    opacity:
                      enviandoLogo || removendoLogo ? 0.6 : 1,
                    cursor:
                      enviandoLogo || removendoLogo
                        ? 'default'
                        : 'pointer',
                  }}
                >
                  <Trash2 size={15} />

                  {removendoLogo
                    ? 'Removendo...'
                    : 'Remover logo'}
                </button>
              )}

              <p style={estilos.logoInfo}>
                Use uma imagem do seu negócio. Aceitamos
                JPEG, PNG ou WebP de até 5 MB.
              </p>

            </div>

          </div>
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.tituloSecao}>
            <span style={estilos.iconeSecao}>
              <Building2 size={19} />
            </span>

            Dados do negócio
          </h2>

          <div style={estilos.grade}>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Nome fantasia
              </label>

              <input
                type="text"
                value={empresa.nome_fantasia}
                onChange={(e) =>
                  alterarCampo(
                    'nome_fantasia',
                    e.target.value
                  )
                }
                style={estilos.input}
                placeholder="Nome que seus clientes conhecem"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Razão social
              </label>

              <input
                type="text"
                value={empresa.razao_social}
                onChange={(e) =>
                  alterarCampo(
                    'razao_social',
                    e.target.value
                  )
                }
                style={estilos.input}
                placeholder="Razão social"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Documento
              </label>

              <input
                type="text"
                value={empresa.documento}
                onChange={(e) =>
                  alterarCampo(
                    'documento',
                    e.target.value
                  )
                }
                style={estilos.input}
                placeholder="CPF ou CNPJ"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Identificação da página
              </label>

              <input
                type="text"
                value={empresa.slug}
                onChange={(e) =>
                  alterarCampo(
                    'slug',
                    e.target.value
                  )
                }
                style={estilos.input}
                placeholder="nome-do-negocio"
              />

              <p style={estilos.ajuda}>
                É usada no endereço público da sua vitrine.
              </p>
            </div>

          </div>
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.tituloSecao}>
            <span style={estilos.iconeSecao}>
              <FileText size={19} />
            </span>

            Como o negócio aparece para o cliente
          </h2>

          <div style={estilos.campo}>
            <label style={estilos.label}>
              Sobre o negócio
            </label>

            <textarea
              value={empresa.descricao_publica}
              onChange={(e) =>
                alterarCampo(
                  'descricao_publica',
                  e.target.value
                )
              }
              style={estilos.textarea}
              placeholder="Conte um pouco sobre seu negócio, seus produtos, sua história ou aquilo que você gostaria que seus clientes soubessem."
            />

            <p style={estilos.ajuda}>
              Esse texto poderá aparecer na sua página pública,
              na seção “Sobre o negócio”.
            </p>
          </div>
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.tituloSecao}>
            <span style={estilos.iconeSecao}>
              <MapPin size={19} />
            </span>

            Contato
          </h2>

          <div style={estilos.grade}>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                E-mail
              </label>

              <input
                type="email"
                value={empresa.email}
                onChange={(e) =>
                  alterarCampo(
                    'email',
                    e.target.value
                  )
                }
                style={estilos.input}
                placeholder="seunegocio@email.com"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Telefone
              </label>

              <input
                type="text"
                value={empresa.telefone}
                onChange={(e) =>
                  alterarCampo(
                    'telefone',
                    e.target.value
                  )
                }
                style={estilos.input}
                placeholder="Telefone"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                WhatsApp
              </label>

              <input
                type="text"
                value={empresa.whatsapp}
                onChange={(e) =>
                  alterarCampo(
                    'whatsapp',
                    e.target.value
                  )
                }
                style={estilos.input}
                placeholder="WhatsApp"
              />

              <p style={estilos.ajuda}>
                O WhatsApp será usado nas etapas de pedido,
                não como botão direto na vitrine pública.
              </p>
            </div>

          </div>

          <div style={estilos.observacao}>
            <strong>Endereço:</strong> vamos tratar os dados
            completos de endereço em uma página própria,
            incluindo CEP, número, complemento e localização.
          </div>
        </div>

        <div style={estilos.rodape}>
          <button
            type="button"
            onClick={salvar}
            disabled={
              salvando ||
              enviandoLogo ||
              removendoLogo
            }
            style={{
              ...estilos.botaoSalvar,
              opacity:
                salvando ||
                enviandoLogo ||
                removendoLogo
                  ? 0.7
                  : 1,
              cursor:
                salvando ||
                enviandoLogo ||
                removendoLogo
                  ? 'default'
                  : 'pointer',
            }}
          >
            <Save size={18} />

            {salvando
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>
        </div>

      </div>
    </div>
  )
}