"use client";

import { useEffect, useRef, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { ErroApi, listarHabilidades, listarMatches, type HabilidadeResumo } from "@/lib/api";
import { normalizar } from "@/lib/busca";
import {
  LIMITE_HABILIDADES,
  salvarHabilidades,
  type HabilidadePerfil,
  type TipoHabilidade,
} from "@/lib/perfil";
import { meuId } from "@/lib/sessao";

type ItemEditor = {
  habilidade_id: number;
  nome: string;
  tipo: TipoHabilidade;
  nivel: number;
};

const NIVEIS = [1, 2, 3, 4, 5];
const TOTAL_SUGESTOES = 6;
const ROTULO = "font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-3";
const FOCO =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca";
const NOME_TIPO: Record<TipoHabilidade, string> = { sei: "Sei", quero_aprender: "Quero aprender" };

// Nível em 5 segmentos, só leitura (ficha do perfil).
export function SegmentosNivel({ nivel }: { nivel: number }) {
  return (
    <span role="img" aria-label={`nível ${nivel} de 5`} className="flex shrink-0 gap-0.5">
      {NIVEIS.map((n) => (
        <span key={n} className={`h-2 w-3 rounded-[1px] ${n <= nivel ? "bg-marca" : "bg-texto-3/30"}`} />
      ))}
    </span>
  );
}

// Nível em 5 segmentos clicáveis: cada segmento escolhe aquele nível.
function SeletorNivel({ nome, nivel, aoEscolher }: { nome: string; nivel: number; aoEscolher: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label={`Nível em ${nome}`} className="flex shrink-0 gap-0.5">
      {NIVEIS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={nivel === n}
          aria-label={`Nível ${n}`}
          onClick={() => aoEscolher(n)}
          className={`relative h-3 w-4 rounded-[1px] transition-colors duration-[var(--rapido)] motion-reduce:transition-none after:absolute after:-inset-x-px after:-inset-y-3 after:content-[''] ${FOCO} ${
            n <= nivel ? "bg-marca" : "bg-texto-3/30 hover:bg-texto-3/60"
          }`}
        />
      ))}
    </div>
  );
}

function converter(habilidades: HabilidadePerfil[]): ItemEditor[] {
  return habilidades.map(({ id, nome, tipo, nivel }) => ({
    habilidade_id: id,
    nome,
    tipo,
    nivel,
  }));
}

function assinatura(itens: ItemEditor[]): string {
  return itens
    .map(({ habilidade_id, tipo, nivel }) => `${habilidade_id}:${tipo}:${nivel}`)
    .sort()
    .join("|");
}

function calcularSugestoes(
  catalogo: HabilidadeResumo[],
  itens: ItemEditor[],
): HabilidadeResumo[] {
  const marcadas = new Set(itens.map((i) => i.habilidade_id));
  const categoriasMarcadas = new Set(
    catalogo.filter((h) => marcadas.has(h.id)).map((h) => h.categoria),
  );
  const porCategoria = catalogo.filter(
    (h) => !marcadas.has(h.id) && categoriasMarcadas.has(h.categoria),
  );
  const populares = catalogo.filter((h) => !marcadas.has(h.id));
  const vistos = new Set<number>();
  const resultado: HabilidadeResumo[] = [];
  for (const h of [...porCategoria, ...populares]) {
    if (vistos.has(h.id)) continue;
    vistos.add(h.id);
    resultado.push(h);
    if (resultado.length >= TOTAL_SUGESTOES) break;
  }
  return resultado;
}

export function EditorHabilidades({
  iniciais,
  aoSalvar,
}: {
  iniciais: HabilidadePerfil[];
  aoSalvar?: (habilidades: HabilidadePerfil[]) => void;
}) {
  const [itens, setItens] = useState(() => converter(iniciais));
  const [catalogo, setCatalogo] = useState<HabilidadeResumo[]>([]);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);
  const [erroCatalogo, setErroCatalogo] = useState(false);
  const [logado, setLogado] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null);
  const [assinaturaSalva, setAssinaturaSalva] = useState(() =>
    assinatura(converter(iniciais)),
  );
  const [filtro, setFiltro] = useState("");
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const salvamentoEmCurso = useRef(false);

  useEffect(() => {
    setLogado(meuId() !== null);
    listarHabilidades()
      .then((resposta) => setCatalogo(resposta.items))
      .catch(() => setErroCatalogo(true))
      .finally(() => setCarregandoCatalogo(false));
    listarMatches()
      .then((m) => setTotalMatches(m.troca.length))
      .catch(() => setTotalMatches(null));
  }, []);

  function tem(habilidadeId: number, tipo: TipoHabilidade): boolean {
    return itens.some((i) => i.habilidade_id === habilidadeId && i.tipo === tipo);
  }

  // Liga ou desliga uma habilidade num dos dois lados. Respeita o limite ao ligar.
  function alternar(habilidade: HabilidadeResumo, tipo: TipoHabilidade) {
    setItens((atuais) => {
      const existe = atuais.some((i) => i.habilidade_id === habilidade.id && i.tipo === tipo);
      if (existe) return atuais.filter((i) => !(i.habilidade_id === habilidade.id && i.tipo === tipo));
      if (atuais.length >= LIMITE_HABILIDADES) return atuais;
      return [...atuais, { habilidade_id: habilidade.id, nome: habilidade.nome, tipo, nivel: 1 }];
    });
    setMensagem(null);
  }

  function ajustarNivel(habilidadeId: number, tipo: TipoHabilidade, nivel: number) {
    setItens((atuais) =>
      atuais.map((item) =>
        item.habilidade_id === habilidadeId && item.tipo === tipo ? { ...item, nivel } : item,
      ),
    );
    setMensagem(null);
  }

  // Passa a habilidade para o outro lado. Se ela já estiver lá, só sai deste lado.
  function mover(item: ItemEditor) {
    const destino: TipoHabilidade = item.tipo === "sei" ? "quero_aprender" : "sei";
    setItens((atuais) => {
      const semEste = atuais.filter((i) => !(i.habilidade_id === item.habilidade_id && i.tipo === item.tipo));
      if (semEste.some((i) => i.habilidade_id === item.habilidade_id && i.tipo === destino)) return semEste;
      return [...semEste, { ...item, tipo: destino }];
    });
    setMensagem(null);
  }

  function remover(item: ItemEditor) {
    setItens((atuais) => atuais.filter((i) => !(i.habilidade_id === item.habilidade_id && i.tipo === item.tipo)));
    setMensagem(null);
  }

  async function salvar() {
    if (salvamentoEmCurso.current || assinatura(itens) === assinaturaSalva) return;
    salvamentoEmCurso.current = true;
    setSalvando(true);
    setMensagem(null);
    try {
      const enviada = assinatura(itens);
      const resposta = await salvarHabilidades(
        itens.map(({ habilidade_id, tipo, nivel }) => ({ habilidade_id, tipo, nivel })),
      );
      const atualizados = converter(resposta);
      setItens((atuais) => (assinatura(atuais) === enviada ? atualizados : atuais));
      setAssinaturaSalva(assinatura(atualizados));
      setMensagem({ texto: "Habilidades salvas.", erro: false });
      aoSalvar?.(resposta);
      listarMatches()
        .then((m) => setTotalMatches(m.troca.length))
        .catch(() => {});
    } catch (erro) {
      setMensagem({
        texto:
          erro instanceof ErroApi ? erro.message : "Não deu para salvar. Tente de novo.",
        erro: true,
      });
    } finally {
      salvamentoEmCurso.current = false;
      setSalvando(false);
    }
  }

  const termo = normalizar(filtro.trim());
  const catalogoFiltrado = termo
    ? catalogo.filter((h) => normalizar(h.nome).includes(termo))
    : catalogo;

  const grupos = [
    { titulo: "Tecnologia", habilidades: catalogoFiltrado.filter((h) => h.categoria === "tech") },
    { titulo: "Disciplinas", habilidades: catalogoFiltrado.filter((h) => h.categoria !== "tech") },
  ];

  const sugestoes = carregandoCatalogo || termo ? [] : calcularSugestoes(catalogo, itens);
  const limiteAtingido = itens.length >= LIMITE_HABILIDADES;
  const itensSei = itens.filter((i) => i.tipo === "sei");
  const itensQuero = itens.filter((i) => i.tipo === "quero_aprender");

  // Linha do catálogo: nome e dois botões, um para cada lado.
  function linhaCatalogo(habilidade: HabilidadeResumo) {
    return (
      <li key={habilidade.id} className="flex items-center gap-2 border-b border-linha py-1.5">
        <span className="min-w-0 flex-1 truncate text-sm text-texto">{habilidade.nome}</span>
        {(["sei", "quero_aprender"] as TipoHabilidade[]).map((tipo) => {
          const ligado = tem(habilidade.id, tipo);
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={ligado}
              aria-label={`${habilidade.nome}: ${NOME_TIPO[tipo].toLowerCase()}`}
              disabled={!ligado && limiteAtingido}
              onClick={() => alternar(habilidade, tipo)}
              className={`h-8 shrink-0 rounded-controle border px-2 font-mono text-xs transition-colors duration-[var(--rapido)] motion-reduce:transition-none disabled:opacity-40 ${FOCO} ${
                ligado
                  ? "border-texto bg-texto text-fundo"
                  : "border-linha-forte text-texto-2 hover:border-texto hover:text-texto"
              }`}
            >
              {tipo === "sei" ? "Sei" : "Quero"}
            </button>
          );
        })}
      </li>
    );
  }

  // Linha do registro: nome, nível em segmentos e ações discretas.
  function linhaRegistro(item: ItemEditor) {
    const outro = item.tipo === "sei" ? "Quero aprender" : "Sei";
    return (
      <li key={`${item.habilidade_id}-${item.tipo}`} className="flex items-center gap-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm text-texto">{item.nome}</span>
        <SeletorNivel nome={item.nome} nivel={item.nivel} aoEscolher={(n) => ajustarNivel(item.habilidade_id, item.tipo, n)} />
        <span className="flex shrink-0">
          <button
            type="button"
            onClick={() => mover(item)}
            aria-label={`Mover ${item.nome} para ${outro}`}
            title={`Mover para ${outro}`}
            className={`inline-flex size-8 items-center justify-center rounded-controle text-texto-3 hover:bg-superficie-2 hover:text-texto ${FOCO}`}
          >
            <Icone nome="troca" tamanho={15} />
          </button>
          <button
            type="button"
            onClick={() => remover(item)}
            aria-label={`Remover ${item.nome}`}
            title="Remover"
            className={`inline-flex size-8 items-center justify-center rounded-controle text-texto-3 hover:bg-superficie-2 hover:text-perigo ${FOCO}`}
          >
            <Icone nome="fechar" tamanho={15} />
          </button>
        </span>
      </li>
    );
  }

  if (logado === false) {
    return (
      <p className="text-sm text-texto-2">Entre na sua conta para editar suas habilidades.</p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Registro: o que já está na ficha, com nível e ações. */}
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        {[
          { numero: "01", tipo: "sei" as TipoHabilidade, lista: itensSei },
          { numero: "02", tipo: "quero_aprender" as TipoHabilidade, lista: itensQuero },
        ].map(({ numero, tipo, lista }) => (
          <section key={tipo} aria-labelledby={`registro-${tipo}`}>
            <h3 id={`registro-${tipo}`} className={`flex items-baseline justify-between border-b border-linha pb-2 ${ROTULO}`}>
              <span>
                <span className="text-texto-2 numeros">{numero}</span> · {NOME_TIPO[tipo]}
              </span>
              <span className="numeros">{lista.length}</span>
            </h3>
            {lista.length === 0 ? (
              <p className="py-3 text-sm text-texto-3">Escolha no catálogo abaixo.</p>
            ) : (
              <ul className="divide-y divide-linha">{lista.map(linhaRegistro)}</ul>
            )}
          </section>
        ))}
      </div>
      <p className="-mt-5 text-xs text-texto-3">Nível de 1 (iniciante) a 5 (avançado). Toque num segmento para escolher.</p>

      <div className="flex flex-wrap items-center gap-3">
        <Botao
          magnetico
          carregando={salvando}
          onClick={salvar}
          disabled={assinatura(itens) === assinaturaSalva}
          className={FOCO}
        >
          Salvar habilidades
        </Botao>
        {mensagem && (
          <p
            role={mensagem.erro ? "alert" : "status"}
            className={`text-sm ${mensagem.erro ? "text-perigo" : "text-sucesso"}`}
          >
            {mensagem.texto}
          </p>
        )}
        {!mensagem && totalMatches !== null && totalMatches > 0 && (
          <p className="text-sm text-texto-2">
            Já dá para trocar com <span className="font-mono text-texto numeros">{totalMatches}</span>{" "}
            {totalMatches === 1 ? "pessoa" : "pessoas"}.
          </p>
        )}
      </div>

      {/* Catálogo: lista compacta com Sei e Quero em cada linha. */}
      <div className="space-y-4 border-t border-linha pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold tracking-tight text-texto">Catálogo</h3>
          <span className={ROTULO}>
            <span className="numeros">{itens.length}</span>/<span className="numeros">{LIMITE_HABILIDADES}</span>
          </span>
        </div>
        <label className="block">
          <span className="sr-only">Filtrar habilidades</span>
          <input
            type="search"
            placeholder="Filtrar habilidades…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="h-10 w-full rounded-controle border border-linha-forte bg-superficie px-3 text-[0.9375rem] text-texto placeholder:text-texto-3 focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] focus:outline-none"
          />
        </label>

        {sugestoes.length > 0 && (
          <section aria-labelledby="titulo-sugestoes">
            <h4 id="titulo-sugestoes" className={`pb-1 ${ROTULO}`}>Sugestões para você</h4>
            <ul className="grid sm:grid-cols-2 sm:gap-x-6">{sugestoes.map(linhaCatalogo)}</ul>
          </section>
        )}

        {carregandoCatalogo ? (
          <p className="text-sm text-texto-3">Carregando catálogo…</p>
        ) : erroCatalogo ? (
          <p role="alert" className="text-sm text-perigo">
            Não consegui carregar o catálogo. Recarregue a página.
          </p>
        ) : (
          <div className="space-y-5">
            {grupos.map(
              (grupo) =>
                grupo.habilidades.length > 0 && (
                  <section key={grupo.titulo} aria-label={grupo.titulo}>
                    <h4 className={`pb-1 ${ROTULO}`}>{grupo.titulo}</h4>
                    <ul className="grid sm:grid-cols-2 sm:gap-x-6">{grupo.habilidades.map(linhaCatalogo)}</ul>
                  </section>
                ),
            )}
            {termo && catalogoFiltrado.length === 0 && (
              <p className="text-sm text-texto-3">Nenhuma habilidade encontrada para &quot;{filtro}&quot;.</p>
            )}
            {limiteAtingido && (
              <p className="text-sm text-texto-3">Limite de {LIMITE_HABILIDADES} habilidades atingido.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
