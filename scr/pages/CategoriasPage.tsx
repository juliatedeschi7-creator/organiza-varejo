import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

interface CategoriasPageProps {
  empresaId: string
  onVoltar: () => void
}

interface Categoria {
  id: string
  empresa_id: string
  categoria_pai_id: string | null
  nome: string
  slug: string
  descricao: string | null
  imagem_url: string | null
  ordem: number
  ativa: boolean
  visivel_vitrine: boolean
  created_at: string
}

interface FormularioCategoria {
  nome: string
  descricao: string
  imagem_url: string
  categoria_pai_id: string
  ordem: string
  ativa: boolean
  visivel_vitrine: boolean
}

const formularioInicial: FormularioCategoria = {
  nome: '',
  descricao: '',
  imagem_url: '',
  categoria_pai_id: '',
  ordem: '0',
  ativa: true,
  visivel_vitrine: true,
}

function gerarSlug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CategoriasPage({
  empresaId,
  onVoltar,
}: CategoriasPageProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] =
    useState<Categoria | null>(null)

  const [formulario, setFormulario] =
    useState<FormularioCategoria>(formularioInicial)

  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarCategorias()
  }, [empresaId])

  async function carregarCategorias() {
    setCarregando(true)
    setErro('')

    try {
      const { data, error } = await supabase
        .from('categorias_produto')
        .select(`
          id,
          empresa_id,
          categoria_pai_id,
          nome,
          slug,
          descricao,
          imagem_url,
          ordem,
          ativa,
          visivel_vitrine,
          created_at
        `)
        .eq('empresa_id', empresaId)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true })

      if (error) {
        throw error
      }

      setCategorias((data || []) as Categoria[])
    } catch (error) {
      console.error(
        'Erro ao carregar categorias:',
        error
      )

      setErro(
        'Não foi possível carregar as categorias.'
      )
    } finally {
      setCarregando(false)
    }
  }

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) {
      return categorias
    }

    return categorias.filter((categoria) =>
      categoria.nome.toLowerCase().includes(termo)
    )
  }, [categorias, busca])

  const categoriasPai = useMemo(() => {
    return categorias.filter((categoria) => {
      if (!categoria.ativa) return false

      if (categoriaEditando) {
        return categoria.id !== categoriaEditando.id
      }

      return true
    })
  }, [categorias, categoriaEditando])

  function abrirNovaCategoria() {
    setCategoriaEditando(null)
    setFormulario(formularioInicial)
    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEditando(categoria)

    setFormulario({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      imagem_url: categoria.imagem_url || '',
      categoria_pai_id:
        categoria.categoria_pai_id || '',
      ordem: String(categoria.ordem ?? 0),
      ativa: categoria.ativa,
      visivel_vitrine:
        categoria.visivel_vitrine,
    })

    setErro('')
    setMensagem('')
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return

    setModalAberto(false)
    setCategoriaEditando(null)
    setFormulario(formularioInicial)
    setErro('')
  }

  async function gerarSlugUnico(
    nome: string,
    idAtual?: string
  ) {
    const slugBase =
      gerarSlug(nome) ||
      `categoria-${Date.now()}`

    let slug = slugBase
    let tentativa = 2

    while (tentativa <= 20) {
      const { data, error } = await supabase
        .from('categorias_produto')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data || data.id === idAtual) {
        return slug
      }

      slug = `${slugBase}-${tentativa}`
      tentativa += 1
    }

    return `${slugBase}-${Date.now()}`
  }

  async function salvarCategoria(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const nome = formulario.nome.trim()

    if (!nome) {
      setErro('Informe o nome da categoria.')
      return
    }

    const ordem = Number(
      formulario.ordem.replace(',', '.')
    )

    if (!Number.isFinite(ordem) || ordem < 0) {
      setErro(
        'A ordem deve ser um número igual ou maior que zero.'
      )
      return
    }

    if (
      formulario.categoria_pai_id &&
      categoriaEditando?.id ===
        formulario.categoria_pai_id
    ) {
      setErro(
        'Uma categoria não pode ser pai dela mesma.'
      )
      return
    }

    setSalvando(true)
    setErro('')
    setMensagem('')

    try {
      const slug = await gerarSlugUnico(
        nome,
        categoriaEditando?.id
      )

      const dados = {
        empresa_id: empresaId,
        categoria_pai_id:
          formulario.categoria_pai_id || null,
        nome,
        slug,
        descricao:
          formulario.descricao.trim() || null,
        imagem_url:
          formulario.imagem_url.trim() || null,
        ordem,
        ativa: formulario.ativa,
        visivel_vitrine:
          formulario.visivel_vitrine,
      }

      if (categoriaEditando) {
        const { error } = await supabase
          .from('categorias_produto')
          .update(dados)
          .eq('id', categoriaEditando.id)
          .eq('empresa_id', empresaId)

        if (error) {
          throw error
        }

        setMensagem(
          'Categoria atualizada com sucesso.'
        )
      } else {
        const { error } = await supabase
          .from('categorias_produto')
          .insert(dados)

        if (error) {
          throw error
        }

        setMensagem(
          'Categoria cadastrada com sucesso.'
        )
      }

      await carregarCategorias()

      setModalAberto(false)
      setCategoriaEditando(null)
      setFormulario(formularioInicial)
    } catch (error) {
      console.error(
        'Erro ao salvar categoria:',
        error
      )

      setErro(
        'Não foi possível salvar a categoria. Verifique os dados e tente novamente.'
      )
    } finally {
      setSalvando(false)
    }
  }

  async function alternarStatus(
    categoria: Categoria
  ) {
    setErro('')
    setMensagem('')

    const novoStatus = !categoria.ativa

    const { error } = await supabase
      .from('categorias_produto')
      .update({
        ativa: novoStatus,
      })
      .eq('id', categoria.id)
      .eq('empresa_id', empresaId)

    if (error) {
      console.error(
        'Erro ao alterar status da categoria:',
        error
      )

      setErro(
        'Não foi possível alterar o status da categoria.'
      )

      return
    }

    setCategorias((anteriores) =>
      anteriores.map((item) =>
        item.id === categoria.id
          ? {
              ...item,
              ativa: novoStatus,
            }
          : item
      )
    )

    setMensagem(
      novoStatus
        ? 'Categoria ativada.'
        : 'Categoria desativada.'
    )
  }

  function nomeCategoriaPai(
    categoriaPaiId: string | null
  ) {
    if (!categoriaPaiId) return ''

    return (
      categorias.find(
        (categoria) =>
          categoria.id === categoriaPaiId
      )?.nome || ''
    )
  }

  function atualizarCampo<
    K extends keyof FormularioCategoria
  >(
    campo: K,
    valor: FormularioCategoria[K]
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }))
  }

  if (carregando) {
    return (
      <div className="categorias-loading">
        <Logo />

        <div className="categorias-spinner" />

        <p>Carregando suas categorias...</p>

        <style>{`
          .categorias-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 24px;
            background: #f7f7f5;
            color: #222;
            font-family: Arial, sans-serif;
          }

          .categorias-loading p {
            margin: 0;
            color: #777;
            font-size: 14px;
          }

          .categorias-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #e7e7e4;
            border-top-color: #222;
            border-radius: 50%;
            animation: categoriasSpin .8s linear infinite;
          }

          @keyframes categoriasSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="categorias-page">
      <header className="categorias-topbar">
        <div className="categorias-topbar-inner">
          <button
            type="button"
            className="categorias-voltar"
            onClick={onVoltar}
            aria-label="Voltar"
          >
            ←
          </button>

          <div className="categorias-topbar-title">
            <span>Organiza</span>
            <strong>Categorias</strong>
          </div>

          <button
            type="button"
            className="categorias-novo-top"
            onClick={abrirNovaCategoria}
          >
            + Nova
          </button>
        </div>
      </header>

      <main className="categorias-main">
        <section className="categorias-heading">
          <div>
            <span className="categorias-eyebrow">
              Organização do catálogo
            </span>

            <h1>Categorias</h1>

            <p>
              Organize seus produtos para que seus
              clientes encontrem tudo com facilidade.
            </p>
          </div>

          <button
            type="button"
            className="categorias-primary-button"
            onClick={abrirNovaCategoria}
          >
            + Cadastrar categoria
          </button>
        </section>

        {erro && !modalAberto && (
          <div className="categorias-alerta categorias-alerta-erro">
            {erro}
          </div>
        )}

        {mensagem && !modalAberto && (
          <div className="categorias-alerta categorias-alerta-sucesso">
            {mensagem}
          </div>
        )}

        <section className="categorias-resumo">
          <div className="categorias-resumo-card">
            <span>Total</span>
            <strong>{categorias.length}</strong>
          </div>

          <div className="categorias-resumo-card">
            <span>Ativas</span>
            <strong>
              {
                categorias.filter(
                  (categoria) => categoria.ativa
                ).length
              }
            </strong>
          </div>

          <div className="categorias-resumo-card">
            <span>Na vitrine</span>
            <strong>
              {
                categorias.filter(
                  (categoria) =>
                    categoria.ativa &&
                    categoria.visivel_vitrine
                ).length
              }
            </strong>
          </div>
        </section>

        <section className="categorias-busca">
          <span>⌕</span>

          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Buscar categoria"
          />
        </section>

        {categoriasFiltradas.length === 0 ? (
          <section className="categorias-vazio">
            <div className="categorias-vazio-icon">
              ≡
            </div>

            <h2>
              {categorias.length === 0
                ? 'Seu catálogo ainda não tem categorias'
                : 'Nenhuma categoria encontrada'}
            </h2>

            <p>
              {categorias.length === 0
                ? 'Crie categorias como Roupas, Calçados, Alimentos, Serviços ou outras que façam sentido para o seu negócio.'
                : 'Tente mudar o termo da busca.'}
            </p>

            {categorias.length === 0 && (
              <button
                type="button"
                className="categorias-primary-button"
                onClick={abrirNovaCategoria}
              >
                Criar primeira categoria
              </button>
            )}
          </section>
        ) : (
          <section className="categorias-lista">
            {categoriasFiltradas.map(
              (categoria) => (
                <article
                  key={categoria.id}
                  className={
                    categoria.ativa
                      ? 'categoria-card'
                      : 'categoria-card categoria-card-inativa'
                  }
                >
                  <div className="categoria-card-icon">
                    {categoria.imagem_url ? (
                      <img
                        src={categoria.imagem_url}
                        alt=""
                      />
                    ) : (
                      <span>≡</span>
                    )}
                  </div>

                  <div className="categoria-card-content">
                    <div className="categoria-card-title">
                      <h2>{categoria.nome}</h2>

                      <span
                        className={
                          categoria.ativa
                            ? 'categoria-status categoria-status-ativa'
                            : 'categoria-status'
                        }
                      >
                        {categoria.ativa
                          ? 'Ativa'
                          : 'Inativa'}
                      </span>
                    </div>

                    {categoria.categoria_pai_id && (
                      <span className="categoria-pai">
                        Dentro de{' '}
                        <strong>
                          {nomeCategoriaPai(
                            categoria.categoria_pai_id
                          )}
                        </strong>
                      </span>
                    )}

                    {categoria.descricao && (
                      <p>
                        {categoria.descricao}
                      </p>
                    )}

                    <div className="categoria-card-meta">
                      <span>
                        Ordem {categoria.ordem}
                      </span>

                      <span>
                        {categoria.visivel_vitrine
                          ? 'Visível na vitrine'
                          : 'Oculta da vitrine'}
                      </span>
                    </div>
                  </div>

                  <div className="categoria-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        abrirEdicao(categoria)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        alternarStatus(
                          categoria
                        )
                      }
                    >
                      {categoria.ativa
                        ? 'Desativar'
                        : 'Ativar'}
                    </button>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </main>

      {modalAberto && (
        <div
          className="categorias-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              fecharModal()
            }
          }}
        >
          <div className="categorias-modal">
            <div className="categorias-modal-header">
              <div>
                <span className="categorias-eyebrow">
                  {categoriaEditando
                    ? 'Editar categoria'
                    : 'Nova categoria'}
                </span>

                <h2>
                  {categoriaEditando
                    ? 'Ajuste os dados'
                    : 'Crie uma categoria'}
                </h2>
              </div>

              <button
                type="button"
                className="categorias-modal-close"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form
              className="categorias-form"
              onSubmit={salvarCategoria}
            >
              {erro && (
                <div className="categorias-alerta categorias-alerta-erro">
                  {erro}
                </div>
              )}

              <label>
                <span>Nome da categoria *</span>

                <input
                  type="text"
                  value={formulario.nome}
                  onChange={(event) =>
                    atualizarCampo(
                      'nome',
                      event.target.value
                    )
                  }
                  placeholder="Ex.: Roupas"
                  autoFocus
                  disabled={salvando}
                />
              </label>

              <label>
                <span>Categoria principal</span>

                <select
                  value={
                    formulario.categoria_pai_id
                  }
                  onChange={(event) =>
                    atualizarCampo(
                      'categoria_pai_id',
                      event.target.value
                    )
                  }
                  disabled={salvando}
                >
                  <option value="">
                    Nenhuma — categoria principal
                  </option>

                  {categoriasPai.map(
                    (categoria) => (
                      <option
                        key={categoria.id}
                        value={categoria.id}
                      >
                        {categoria.nome}
                      </option>
                    )
                  )}
                </select>

                <small>
                  Use este campo para criar
                  subcategorias.
                </small>
              </label>

              <label>
                <span>Descrição</span>

                <textarea
                  value={formulario.descricao}
                  onChange={(event) =>
                    atualizarCampo(
                      'descricao',
                      event.target.value
                    )
                  }
                  placeholder="Explique brevemente o que entra nesta categoria."
                  rows={3}
                  disabled={salvando}
                />
              </label>

              <label>
                <span>Imagem da categoria</span>

                <input
                  type="url"
                  value={formulario.imagem_url}
                  onChange={(event) =>
                    atualizarCampo(
                      'imagem_url',
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  disabled={salvando}
                />

                <small>
                  Por enquanto usamos uma imagem por
                  endereço. O envio de imagens será
                  conectado depois.
                </small>
              </label>

              <div className="categorias-form-grid">
                <label>
                  <span>Ordem</span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.ordem}
                    onChange={(event) =>
                      atualizarCampo(
                        'ordem',
                        event.target.value
                      )
                    }
                    disabled={salvando}
                  />
                </label>
              </div>

              <div className="categorias-switches">
                <button
                  type="button"
                  className={
                    formulario.ativa
                      ? 'categoria-switch ativo'
                      : 'categoria-switch'
                  }
                  onClick={() =>
                    atualizarCampo(
                      'ativa',
                      !formulario.ativa
                    )
                  }
                  disabled={salvando}
                >
                  <span className="categoria-switch-dot" />

                  <div>
                    <strong>
                      Categoria ativa
                    </strong>

                    <small>
                      Pode ser usada no catálogo.
                    </small>
                  </div>
                </button>

                <button
                  type="button"
                  className={
                    formulario.visivel_vitrine
                      ? 'categoria-switch ativo'
                      : 'categoria-switch'
                  }
                  onClick={() =>
                    atualizarCampo(
                      'visivel_vitrine',
                      !formulario.visivel_vitrine
                    )
                  }
                  disabled={salvando}
                >
                  <span className="categoria-switch-dot" />

                  <div>
                    <strong>
                      Mostrar na vitrine
                    </strong>

                    <small>
                      Clientes poderão visualizar
                      esta categoria.
                    </small>
                  </div>
                </button>
              </div>

              <div className="categorias-form-actions">
                <button
                  type="button"
                  className="categorias-button-secondary"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="categorias-primary-button"
                  disabled={salvando}
                >
                  {salvando
                    ? 'Salvando...'
                    : categoriaEditando
                      ? 'Salvar alterações'
                      : 'Cadastrar categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .categorias-page {
          min-height: 100vh;
          padding-bottom: 40px;
          background: #f7f7f5;
          color: #222;
          font-family: Arial, sans-serif;
        }

        .categorias-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255,255,255,.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e7e7e5;
        }

        .categorias-topbar-inner {
          width: 100%;
          max-width: 1180px;
          min-height: 72px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .categorias-voltar {
          width: 44px;
          height: 44px;
          border: 1px solid #e7e7e5;
          border-radius: 13px;
          background: #fff;
          font-size: 21px;
          cursor: pointer;
        }

        .categorias-topbar-title {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .categorias-topbar-title span {
          color: #999;
          font-size: 10px;
          font-weight: 700;
        }

        .categorias-topbar-title strong {
          font-size: 15px;
        }

        .categorias-novo-top {
          border: 0;
          border-radius: 13px;
          background: #222;
          color: #fff;
          padding: 12px 15px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .categorias-main {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px 20px;
        }

        .categorias-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .categorias-eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #999;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .11em;
          text-transform: uppercase;
        }

        .categorias-heading h1 {
          margin: 0;
          font-size: clamp(30px,5vw,44px);
          letter-spacing: -1.2px;
        }

        .categorias-heading p {
          max-width: 620px;
          margin: 9px 0 0;
          color: #777;
          font-size: 14px;
          line-height: 1.5;
        }

        .categorias-primary-button {
          border: 0;
          border-radius: 14px;
          padding: 13px 18px;
          background: #222;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .categorias-primary-button:disabled {
          opacity: .55;
          cursor: default;
        }

        .categorias-resumo {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .categorias-resumo-card {
          padding: 18px;
          border: 1px solid #e8e8e5;
          border-radius: 18px;
          background: #fff;
        }

        .categorias-resumo-card span {
          display: block;
          color: #999;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .categorias-resumo-card strong {
          font-size: 25px;
        }

        .categorias-busca {
          height: 50px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          margin-bottom: 18px;
          border: 1px solid #e5e5e2;
          border-radius: 15px;
          background: #fff;
        }

        .categorias-busca span {
          color: #999;
          font-size: 20px;
        }

        .categorias-busca input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #222;
          font-size: 14px;
        }

        .categorias-alerta {
          padding: 13px 15px;
          margin-bottom: 16px;
          border-radius: 13px;
          font-size: 13px;
          line-height: 1.4;
        }

        .categorias-alerta-erro {
          background: #fff0f0;
          border: 1px solid #f1d4d4;
          color: #9a3333;
        }

        .categorias-alerta-sucesso {
          background: #f0f7f0;
          border: 1px solid #d7e8d7;
          color: #397039;
        }

        .categorias-lista {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .categoria-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 17px;
          border: 1px solid #e8e8e5;
          border-radius: 20px;
          background: #fff;
        }

        .categoria-card-inativa {
          opacity: .68;
        }

        .categoria-card-icon {
          width: 58px;
          height: 58px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 16px;
          background: #f1f1ee;
          color: #555;
          font-size: 24px;
        }

        .categoria-card-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .categoria-card-content {
          min-width: 0;
          flex: 1;
        }

        .categoria-card-title {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .categoria-card-title h2 {
          margin: 0;
          font-size: 16px;
        }

        .categoria-status {
          padding: 4px 8px;
          border-radius: 999px;
          background: #f0f0ee;
          color: #888;
          font-size: 10px;
          font-weight: 700;
        }

        .categoria-status-ativa {
          background: #eef6ef;
          color: #4c7b51;
        }

        .categoria-pai {
          display: block;
          margin-top: 5px;
          color: #999;
          font-size: 11px;
        }

        .categoria-pai strong {
          color: #666;
        }

        .categoria-card-content p {
          margin: 7px 0 0;
          color: #777;
          font-size: 12px;
          line-height: 1.4;
        }

        .categoria-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 9px;
          color: #aaa;
          font-size: 10px;
        }

        .categoria-card-actions {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .categoria-card-actions button {
          min-width: 88px;
          padding: 8px 10px;
          border: 1px solid #e2e2df;
          border-radius: 10px;
          background: #fff;
          color: #444;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .categorias-vazio {
          padding: 60px 24px;
          text-align: center;
          border: 1px dashed #d9d9d5;
          border-radius: 24px;
          background: #fff;
        }

        .categorias-vazio-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: #f1f1ee;
          color: #777;
          font-size: 27px;
        }

        .categorias-vazio h2 {
          margin: 0;
          font-size: 20px;
        }

        .categorias-vazio p {
          max-width: 520px;
          margin: 9px auto 20px;
          color: #888;
          font-size: 13px;
          line-height: 1.5;
        }

        .categorias-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0,0,0,.42);
        }

        .categorias-modal {
          width: min(560px,100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 25px 80px rgba(0,0,0,.18);
        }

        .categorias-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 24px 18px;
          border-bottom: 1px solid #eeeeeb;
        }

        .categorias-modal-header h2 {
          margin: 0;
          font-size: 23px;
        }

        .categorias-modal-close {
          width: 40px;
          height: 40px;
          border: 1px solid #e5e5e2;
          border-radius: 12px;
          background: #fff;
          font-size: 24px;
          cursor: pointer;
        }

        .categorias-form {
          display: flex;
          flex-direction: column;
          gap: 17px;
          padding: 22px 24px 24px;
        }

        .categorias-form label {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .categorias-form label > span {
          color: #444;
          font-size: 12px;
          font-weight: 700;
        }

        .categorias-form label small {
          color: #999;
          font-size: 10px;
          line-height: 1.4;
        }

        .categorias-form input,
        .categorias-form select,
        .categorias-form textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dededb;
          border-radius: 12px;
          padding: 12px 13px;
          outline: 0;
          background: #fff;
          color: #222;
          font-family: inherit;
          font-size: 14px;
        }

        .categorias-form textarea {
          resize: vertical;
        }

        .categorias-form input:focus,
        .categorias-form select:focus,
        .categorias-form textarea:focus {
          border-color: #999;
        }

        .categorias-form-grid {
          display: grid;
          grid-template-columns: 1fr;
        }

        .categorias-switches {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .categoria-switch {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border: 1px solid #e4e4e1;
          border-radius: 14px;
          background: #fff;
          text-align: left;
          cursor: pointer;
        }

        .categoria-switch-dot {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          border: 2px solid #ccc;
          border-radius: 50%;
        }

        .categoria-switch.ativo {
          border-color: #cfcfca;
          background: #fafaf8;
        }

        .categoria-switch.ativo .categoria-switch-dot {
          border-color: #222;
          box-shadow: inset 0 0 0 4px #fff;
          background: #222;
        }

        .categoria-switch div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .categoria-switch strong {
          font-size: 12px;
        }

        .categoria-switch small {
          color: #999;
          font-size: 10px;
        }

        .categorias-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 4px;
        }

        .categorias-button-secondary {
          border: 1px solid #ddd;
          border-radius: 13px;
          padding: 13px 17px;
          background: #fff;
          color: #444;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width:760px) {
          .categorias-main {
            padding: 22px 14px;
          }

          .categorias-heading {
            flex-direction: column;
            align-items: stretch;
          }

          .categorias-heading .categorias-primary-button {
            width: 100%;
          }

          .categorias-resumo {
            grid-template-columns: 1fr;
          }

          .categoria-card {
            align-items: flex-start;
          }

          .categoria-card-actions {
            flex-shrink: 0;
          }
        }

        @media (max-width:520px) {
          .categorias-topbar-inner {
            padding: 10px 14px;
          }

          .categorias-topbar-title {
            align-items: flex-start;
          }

          .categorias-novo-top {
            padding: 11px 12px;
          }

          .categoria-card {
            flex-wrap: wrap;
          }

          .categoria-card-content {
            width: calc(100% - 74px);
            flex: initial;
          }

          .categoria-card-actions {
            width: 100%;
            flex-direction: row;
          }

          .categoria-card-actions button {
            flex: 1;
          }

          .categorias-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .categorias-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 24px 24px 0 0;
          }

          .categorias-form-actions {
            flex-direction: column-reverse;
          }

          .categorias-form-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}