import {
  ArrowLeft,
  Check,
  Loader2,
  MapPin,
  Save,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface EditarEnderecoPageProps {
  empresaId: string
  onVoltar: () => void
}

interface Filial {
  id: string
  empresa_id: string
  nome: string | null
  codigo: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  ativa: boolean
}

export default function EditarEnderecoPage({
  empresaId,
  onVoltar,
}: EditarEnderecoPageProps) {
  const [filial, setFilial] =
    useState<Filial | null>(null)

  const [nome, setNome] =
    useState('')

  const [codigo, setCodigo] =
    useState('')

  const [cep, setCep] =
    useState('')

  const [logradouro, setLogradouro] =
    useState('')

  const [numero, setNumero] =
    useState('')

  const [complemento, setComplemento] =
    useState('')

  const [bairro, setBairro] =
    useState('')

  const [cidade, setCidade] =
    useState('')

  const [estado, setEstado] =
    useState('')

  const [carregando, setCarregando] =
    useState(true)

  const [salvando, setSalvando] =
    useState(false)

  const [erro, setErro] =
    useState('')

  const [sucesso, setSucesso] =
    useState(false)

  useEffect(() => {
    carregarEndereco()
  }, [empresaId])

  async function carregarEndereco() {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('filiais')
      .select(
        `
          id,
          empresa_id,
          nome,
          codigo,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          ativa
        `
      )
      .eq('empresa_id', empresaId)
      .eq('ativa', true)
      .order('created_at', {
        ascending: true,
      })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)

      setErro(
        'Não foi possível carregar o endereço.'
      )
      setCarregando(false)
      return
    }

    if (!data) {
      setErro(
        'Este negócio ainda não possui uma unidade ativa para editar.'
      )
      setCarregando(false)
      return
    }

    const dados = data as Filial

    setFilial(dados)

    setNome(dados.nome ?? '')
    setCodigo(dados.codigo ?? '')
    setCep(dados.cep ?? '')
    setLogradouro(
      dados.logradouro ?? ''
    )
    setNumero(dados.numero ?? '')
    setComplemento(
      dados.complemento ?? ''
    )
    setBairro(dados.bairro ?? '')
    setCidade(dados.cidade ?? '')
    setEstado(dados.estado ?? '')

    setCarregando(false)
  }

  async function salvar() {
    if (!filial) return

    setErro('')
    setSucesso(false)

    if (!logradouro.trim()) {
      setErro(
        'Informe o endereço.'
      )
      return
    }

    if (!cidade.trim()) {
      setErro(
        'Informe a cidade.'
      )
      return
    }

    if (!estado.trim()) {
      setErro(
        'Informe o estado.'
      )
      return
    }

    setSalvando(true)

    const { error } = await supabase
      .from('filiais')
      .update({
        nome:
          nome.trim() || null,
        codigo:
          codigo.trim() || null,
        cep:
          cep.trim() || null,
        logradouro:
          logradouro.trim(),
        numero:
          numero.trim() || null,
        complemento:
          complemento.trim() || null,
        bairro:
          bairro.trim() || null,
        cidade:
          cidade.trim(),
        estado:
          estado.trim(),
      })
      .eq('id', filial.id)

    setSalvando(false)

    if (error) {
      console.error(error)

      setErro(
        'Não foi possível salvar o endereço.'
      )
      return
    }

    setSucesso(true)

    await carregarEndereco()

    window.setTimeout(() => {
      setSucesso(false)
    }, 3000)
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-[#159447]"
          />

          <p className="mt-3 text-sm text-[#66706a]">
            Carregando endereço...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-[#202622]">
      <div className="mx-auto min-h-screen max-w-3xl">
        <header className="sticky top-0 z-20 border-b border-[#e1e8e3] bg-white/95 px-4 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onVoltar}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dbe5df] bg-white"
              aria-label="Voltar"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-lg font-bold">
                Endereço
              </h1>

              <p className="text-xs text-[#66706a]">
                Onde seus clientes encontram seu negócio
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-5 px-4 py-5">
          {erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#bfe2cb] bg-[#eaf7ef] p-4 text-sm font-medium text-[#0f6f38]">
              <Check size={18} />
              Endereço salvo com sucesso.
            </div>
          )}

          {filial && (
            <>
              <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf7ef]">
                    <MapPin
                      size={21}
                      className="text-[#159447]"
                    />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Unidade
                    </h2>

                    <p className="text-sm text-[#66706a]">
                      Identificação deste endereço.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Campo
                    label="Nome da unidade"
                    value={nome}
                    onChange={setNome}
                    placeholder="Ex.: Loja principal"
                  />

                  <Campo
                    label="Código da unidade"
                    value={codigo}
                    onChange={setCodigo}
                    placeholder="Código interno"
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="font-bold">
                    Endereço
                  </h2>

                  <p className="mt-1 text-sm text-[#66706a]">
                    Essas informações podem aparecer na
                    sua vitrine pública.
                  </p>
                </div>

                <div className="space-y-4">
                  <Campo
                    label="CEP"
                    value={cep}
                    onChange={setCep}
                    placeholder="00000-000"
                  />

                  <Campo
                    label="Logradouro"
                    value={logradouro}
                    onChange={setLogradouro}
                    placeholder="Rua, avenida, praça..."
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Campo
                      label="Número"
                      value={numero}
                      onChange={setNumero}
                      placeholder="Número"
                    />

                    <Campo
                      label="Complemento"
                      value={complemento}
                      onChange={setComplemento}
                      placeholder="Sala, loja..."
                    />
                  </div>

                  <Campo
                    label="Bairro"
                    value={bairro}
                    onChange={setBairro}
                    placeholder="Bairro"
                  />

                  <Campo
                    label="Cidade"
                    value={cidade}
                    onChange={setCidade}
                    placeholder="Cidade"
                  />

                  <Campo
                    label="Estado"
                    value={estado}
                    onChange={setEstado}
                    placeholder="SP"
                  />
                </div>
              </section>

              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#159447] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#0f6f38] disabled:opacity-60"
              >
                {salvando ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={19} />
                    Salvar endereço
                  </>
                )}
              </button>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

interface CampoProps {
  label: string
  value: string
  onChange: (valor: string) => void
  placeholder?: string
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: CampoProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[#dbe5df] bg-[#fbfcfb] px-4 text-sm outline-none transition focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10"
      />
    </label>
  )
}
