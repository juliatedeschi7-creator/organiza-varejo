import {
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  Phone,
  Save,
  Store,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface EditarEmpresaPageProps {
  empresaId: string
  onVoltar: () => void
}

interface Empresa {
  id: string
  razao_social: string | null
  nome_fantasia: string | null
  documento: string | null
  email: string | null
  telefone: string | null
  whatsapp: string | null
  cidade: string | null
  estado: string | null
  descricao_publica: string | null
}

export default function EditarEmpresaPage({
  empresaId,
  onVoltar,
}: EditarEmpresaPageProps) {
  const [empresa, setEmpresa] =
    useState<Empresa | null>(null)

  const [nomeFantasia, setNomeFantasia] =
    useState('')

  const [razaoSocial, setRazaoSocial] =
    useState('')

  const [documento, setDocumento] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [telefone, setTelefone] =
    useState('')

  const [whatsapp, setWhatsapp] =
    useState('')

  const [descricaoPublica, setDescricaoPublica] =
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
    carregarEmpresa()
  }, [empresaId])

  async function carregarEmpresa() {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('empresas')
      .select(
        `
          id,
          razao_social,
          nome_fantasia,
          documento,
          email,
          telefone,
          whatsapp,
          cidade,
          estado,
          descricao_publica
        `
      )
      .eq('id', empresaId)
      .maybeSingle()

    if (error) {
      console.error(error)
      setErro(
        'Não foi possível carregar os dados do negócio.'
      )
      setCarregando(false)
      return
    }

    if (!data) {
      setErro(
        'Não encontramos os dados deste negócio.'
      )
      setCarregando(false)
      return
    }

    const dados = data as Empresa

    setEmpresa(dados)
    setNomeFantasia(
      dados.nome_fantasia ?? ''
    )
    setRazaoSocial(
      dados.razao_social ?? ''
    )
    setDocumento(
      dados.documento ?? ''
    )
    setEmail(
      dados.email ?? ''
    )
    setTelefone(
      dados.telefone ?? ''
    )
    setWhatsapp(
      dados.whatsapp ?? ''
    )
    setDescricaoPublica(
      dados.descricao_publica ?? ''
    )

    setCarregando(false)
  }

  async function salvar() {
    setErro('')
    setSucesso(false)

    if (!nomeFantasia.trim()) {
      setErro(
        'Informe o nome que aparecerá para seus clientes.'
      )
      return
    }

    setSalvando(true)

    const { error } = await supabase
      .from('empresas')
      .update({
        nome_fantasia:
          nomeFantasia.trim(),
        razao_social:
          razaoSocial.trim() || null,
        documento:
          documento.trim() || null,
        email:
          email.trim() || null,
        telefone:
          telefone.trim() || null,
        whatsapp:
          whatsapp.trim() || null,
        descricao_publica:
          descricaoPublica.trim() || null,
      })
      .eq('id', empresaId)

    setSalvando(false)

    if (error) {
      console.error(error)

      setErro(
        'Não foi possível salvar as alterações.'
      )
      return
    }

    setSucesso(true)

    await carregarEmpresa()

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
            Carregando dados...
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dbe5df] bg-white text-[#202622]"
              aria-label="Voltar"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-lg font-bold">
                Informações do negócio
              </h1>

              <p className="text-xs text-[#66706a]">
                Dados que identificam sua empresa
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
              Alterações salvas com sucesso.
            </div>
          )}

          <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf7ef]">
                <Store
                  size={21}
                  className="text-[#159447]"
                />
              </div>

              <div>
                <h2 className="font-bold">
                  Identidade do negócio
                </h2>

                <p className="text-sm text-[#66706a]">
                  Como seu negócio será apresentado.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Campo
                label="Nome do negócio"
                value={nomeFantasia}
                onChange={setNomeFantasia}
                placeholder="Ex.: Maria Magnólia"
              />

              <Campo
                label="Razão social"
                value={razaoSocial}
                onChange={setRazaoSocial}
                placeholder="Razão social"
              />

              <Campo
                label="CNPJ ou CPF"
                value={documento}
                onChange={setDocumento}
                placeholder="Documento"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-bold">
                Dados de contato
              </h2>

              <p className="mt-1 text-sm text-[#66706a]">
                Informações usadas para identificação
                do negócio.
              </p>
            </div>

            <div className="space-y-4">
              <Campo
                label="E-mail"
                value={email}
                onChange={setEmail}
                placeholder="seunegocio@email.com"
                type="email"
                icon={
                  <Mail size={17} />
                }
              />

              <Campo
                label="Telefone"
                value={telefone}
                onChange={setTelefone}
                placeholder="Telefone"
                icon={
                  <Phone size={17} />
                }
              />

              <Campo
                label="WhatsApp"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="WhatsApp"
                icon={
                  <Phone size={17} />
                }
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[#e1e8e3] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-bold">
                Sobre o negócio
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#66706a]">
                Escreva uma apresentação do seu negócio.
                Esse texto poderá aparecer na sua vitrine
                pública.
              </p>
            </div>

            <textarea
              value={descricaoPublica}
              onChange={(event) =>
                setDescricaoPublica(
                  event.target.value
                )
              }
              rows={7}
              placeholder="Conte um pouco sobre seu negócio, seus produtos, seu atendimento ou o que você gostaria que seus clientes soubessem..."
              className="w-full resize-none rounded-2xl border border-[#dbe5df] bg-[#fbfcfb] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10"
            />

            <p className="mt-2 text-xs text-[#8a948e]">
              Você pode alterar esse texto quando quiser.
            </p>
          </section>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#159447] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#0f6f38] disabled:cursor-not-allowed disabled:opacity-60"
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
                Salvar alterações
              </>
            )}
          </button>
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
  type?: string
  icon?: React.ReactNode
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}: CampoProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#202622]">
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a948e]">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className={`h-12 w-full rounded-2xl border border-[#dbe5df] bg-[#fbfcfb] text-sm outline-none transition focus:border-[#159447] focus:ring-4 focus:ring-[#159447]/10 ${
            icon ? 'pl-11' : 'px-4'
          } pr-4`}
        />
      </div>
    </label>
  )
}