import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Navigation,
} from 'lucide-react'

interface EditarEnderecoPageProps {
  empresaId: string
  onVoltar: () => void
}

interface Filial {
  id?: string
  empresa_id: string
  nome: string
  codigo: string
  telefone: string
  whatsapp: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  latitude: string
  longitude: string
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
    marginBottom: '18px',
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

  informacao: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '13px 15px',
    marginTop: '18px',
    borderRadius: '11px',
    background: '#fafaf7',
    border: '1px solid #eeeeea',
    color: '#777',
    fontSize: '13px',
    lineHeight: 1.5,
  },
}

export default function EditarEnderecoPage({
  empresaId,
  onVoltar,
}: EditarEnderecoPageProps) {
  const [filial, setFilial] = useState<Filial>({
    empresa_id: empresaId,
    nome: '',
    codigo: '',
    telefone: '',
    whatsapp: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    latitude: '',
    longitude: '',
  })

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarFilial()
  }, [empresaId])

  async function carregarFilial() {
    setCarregando(true)
    setErro('')
    setMensagem('')

    const { data, error } = await supabase
      .from('filiais')
      .select(`
        id,
        empresa_id,
        nome,
        codigo,
        telefone,
        whatsapp,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        latitude,
        longitude
      `)
      .eq('empresa_id', empresaId)
      .eq('ativa', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)
      setErro('Não foi possível carregar o endereço do negócio.')
      setCarregando(false)
      return
    }

    if (!data) {
      /*
       * Ainda não existe uma filial cadastrada.
       * Mantemos o formulário vazio para permitir
       * o primeiro cadastro.
       */
      setFilial({
        empresa_id: empresaId,
        nome: 'Loja principal',
        codigo: '',
        telefone: '',
        whatsapp: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        latitude: '',
        longitude: '',
      })

      setCarregando(false)
      return
    }

    setFilial({
      id: data.id,
      empresa_id: data.empresa_id,
      nome: data.nome ?? '',
      codigo: data.codigo ?? '',
      telefone: data.telefone ?? '',
      whatsapp: data.whatsapp ?? '',
      cep: data.cep ?? '',
      logradouro: data.logradouro ?? '',
      numero: data.numero ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro ?? '',
      cidade: data.cidade ?? '',
      estado: data.estado ?? '',
      latitude:
        data.latitude !== null && data.latitude !== undefined
          ? String(data.latitude)
          : '',
      longitude:
        data.longitude !== null && data.longitude !== undefined
          ? String(data.longitude)
          : '',
    })

    setCarregando(false)
  }

  function alterarCampo(campo: keyof Filial, valor: string) {
    setFilial((atual) => ({
      ...atual,
      [campo]: valor,
    }))

    setMensagem('')
    setErro('')
  }

  async function salvar() {
    setSalvando(true)
    setMensagem('')
    setErro('')

    const dados = {
      empresa_id: empresaId,
      nome: filial.nome.trim(),
      codigo: filial.codigo.trim(),
      telefone: filial.telefone.trim(),
      whatsapp: filial.whatsapp.trim(),
      cep: filial.cep.trim(),
      logradouro: filial.logradouro.trim(),
      numero: filial.numero.trim(),
      complemento: filial.complemento.trim(),
      bairro: filial.bairro.trim(),
      cidade: filial.cidade.trim(),
      estado: filial.estado.trim(),
      latitude: filial.latitude.trim()
        ? Number(filial.latitude.replace(',', '.'))
        : null,
      longitude: filial.longitude.trim()
        ? Number(filial.longitude.replace(',', '.'))
        : null,
      updated_at: new Date().toISOString(),
    }

    if (
      (filial.latitude.trim() &&
        Number.isNaN(dados.latitude)) ||
      (filial.longitude.trim() &&
        Number.isNaN(dados.longitude))
    ) {
      setErro('Latitude ou longitude inválida.')
      setSalvando(false)
      return
    }

    if (filial.id) {
      const { error } = await supabase
        .from('filiais')
        .update(dados)
        .eq('id', filial.id)

      if (error) {
        console.error(error)
        setErro('Não foi possível salvar o endereço.')
        setSalvando(false)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('filiais')
        .insert({
          ...dados,
          ativa: true,
        })
        .select(`
          id,
          empresa_id,
          nome,
          codigo,
          telefone,
          whatsapp,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          latitude,
          longitude
        `)
        .single()

      if (error) {
        console.error(error)
        setErro('Não foi possível cadastrar o endereço.')
        setSalvando(false)
        return
      }

      setFilial({
        id: data.id,
        empresa_id: data.empresa_id,
        nome: data.nome ?? '',
        codigo: data.codigo ?? '',
        telefone: data.telefone ?? '',
        whatsapp: data.whatsapp ?? '',
        cep: data.cep ?? '',
        logradouro: data.logradouro ?? '',
        numero: data.numero ?? '',
        complemento: data.complemento ?? '',
        bairro: data.bairro ?? '',
        cidade: data.cidade ?? '',
        estado: data.estado ?? '',
        latitude:
          data.latitude !== null && data.latitude !== undefined
            ? String(data.latitude)
            : '',
        longitude:
          data.longitude !== null && data.longitude !== undefined
            ? String(data.longitude)
            : '',
      })
    }

    setMensagem('Endereço salvo com sucesso.')
    setSalvando(false)
  }

  if (carregando) {
    return (
      <div style={estilos.carregando}>
        Carregando endereço...
      </div>
    )
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
              Endereço do negócio
            </h1>

            <p style={estilos.subtitulo}>
              Informe onde seus clientes podem encontrar sua loja.
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
              <MapPin size={19} />
            </span>

            Endereço
          </h2>

          <div style={estilos.grade}>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                CEP
              </label>

              <input
                type="text"
                value={filial.cep}
                onChange={(e) =>
                  alterarCampo('cep', e.target.value)
                }
                style={estilos.input}
                placeholder="00000-000"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Estado
              </label>

              <input
                type="text"
                value={filial.estado}
                onChange={(e) =>
                  alterarCampo('estado', e.target.value)
                }
                style={estilos.input}
                placeholder="SP"
                maxLength={2}
              />
            </div>

          </div>

          <div style={estilos.grade}>
            <div style={estilos.campoLargo}>
              <label style={estilos.label}>
                Logradouro
              </label>

              <input
                type="text"
                value={filial.logradouro}
                onChange={(e) =>
                  alterarCampo('logradouro', e.target.value)
                }
                style={estilos.input}
                placeholder="Rua, avenida, estrada..."
              />
            </div>

            <div style={estilos.campoLargo}>
              <label style={estilos.label}>
                Número
              </label>

              <input
                type="text"
                value={filial.numero}
                onChange={(e) =>
                  alterarCampo('numero', e.target.value)
                }
                style={estilos.input}
                placeholder="Número"
              />
            </div>
          </div>

          <div style={estilos.grade}>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Complemento
              </label>

              <input
                type="text"
                value={filial.complemento}
                onChange={(e) =>
                  alterarCampo('complemento', e.target.value)
                }
                style={estilos.input}
                placeholder="Sala, loja, bloco..."
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Bairro
              </label>

              <input
                type="text"
                value={filial.bairro}
                onChange={(e) =>
                  alterarCampo('bairro', e.target.value)
                }
                style={estilos.input}
                placeholder="Bairro"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Cidade
              </label>

              <input
                type="text"
                value={filial.cidade}
                onChange={(e) =>
                  alterarCampo('cidade', e.target.value)
                }
                style={estilos.input}
                placeholder="Cidade"
              />
            </div>

          </div>
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.tituloSecao}>
            <span style={estilos.iconeSecao}>
              <Phone size={19} />
            </span>

            Contato desta unidade
          </h2>

          <div style={estilos.grade}>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Telefone
              </label>

              <input
                type="text"
                value={filial.telefone}
                onChange={(e) =>
                  alterarCampo('telefone', e.target.value)
                }
                style={estilos.input}
                placeholder="Telefone da loja"
              />
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                WhatsApp
              </label>

              <input
                type="text"
                value={filial.whatsapp}
                onChange={(e) =>
                  alterarCampo('whatsapp', e.target.value)
                }
                style={estilos.input}
                placeholder="WhatsApp da loja"
              />
            </div>

          </div>

          <div style={estilos.informacao}>
            <Navigation size={17} style={{ flexShrink: 0, marginTop: 2 }} />

            <span>
              A latitude e a longitude ficam disponíveis no banco para
              localização da unidade e recursos futuros do Mercado Local.
              Por enquanto, não é necessário preenchê-las manualmente.
            </span>
          </div>
        </div>

        <div style={estilos.card}>
          <h2 style={estilos.tituloSecao}>
            Identificação da unidade
          </h2>

          <div style={estilos.grade}>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Nome da unidade
              </label>

              <input
                type="text"
                value={filial.nome}
                onChange={(e) =>
                  alterarCampo('nome', e.target.value)
                }
                style={estilos.input}
                placeholder="Loja principal"
              />

              <p style={estilos.ajuda}>
                Útil quando o negócio tiver mais de uma unidade.
              </p>
            </div>

            <div style={estilos.campo}>
              <label style={estilos.label}>
                Código da unidade
              </label>

              <input
                type="text"
                value={filial.codigo}
                onChange={(e) =>
                  alterarCampo('codigo', e.target.value)
                }
                style={estilos.input}
                placeholder="Ex.: 001"
              />

              <p style={estilos.ajuda}>
                Identificação interna da filial.
              </p>
            </div>

          </div>
        </div>

        <div style={estilos.rodape}>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            style={{
              ...estilos.botaoSalvar,
              opacity: salvando ? 0.7 : 1,
              cursor: salvando ? 'default' : 'pointer',
            }}
          >
            <Save size={18} />

            {salvando
              ? 'Salvando...'
              : 'Salvar endereço'}
          </button>
        </div>

      </div>
    </div>
  )
}