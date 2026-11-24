"use client";

import { useEffect, useRef, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { ErroApi, listarHabilidades, type HabilidadeResumo } from "@/lib/api";
import {
  LIMITE_HABILIDADES,
  salvarHabilidades,
  type HabilidadePerfil,
  type TipoHabilidade,
} from "@/lib/perfil";
import { meuId } from "@/lib/sessao";

type EstadoChip = "nenhum" | "sei" | "quero_aprender" | "ambos";

type ItemEditor = {
  habilidade_id: number;
  nome: string;
  tipo: TipoHabilidade;
  nivel: number;
};

const NIVEIS = [1, 2, 3, 4, 5];
const TOTAL_SUGESTOES = 6;

const FOCO =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca";

function proximoEstado(atual: EstadoChip): EstadoChip {
  const ciclo: EstadoChip[] = ["nenhum", "sei", "quero_aprender", "ambos", "nenhum"];
  return ciclo[ciclo.indexOf(atual) + 1];
}

function estadoDoChip(itens: ItemEditor[], habilidadeId: number): EstadoChip {
  const temSei = itens.some((i) => i.habilidade_id === habilidadeId && i.tipo === "sei");
  const temQuero = itens.some((i) => i.habilidade_id === habilidadeId && i.tipo === "quero_aprender");
  if (temSei && temQuero) return "ambos";
  if (temSei) return "sei";
  if (temQuero) return "quero_aprender";
  return "nenhum";
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

function estiloChip(estado: EstadoChip): string {
  switch (estado) {
    case "sei":
      return "border-marca bg-marca-suave font-medium text-marca-forte";
    case "quero_aprender":
      return "border-troca bg-troca-suave font-medium text-texto";
    case "ambos":
      return "border-marca bg-gradient-to-r from-marca-suave to-troca-suave font-medium text-marca-forte";
    default:
      return "border-linha-forte bg-superficie-2 text-texto hover:border-marca";
  }
}

function calcularSugestoes(
  catalogo: HabilidadeResumo[],
  itens: ItemEditor[],
): HabilidadeResumo[] {
  const marcadas = new Set(itens.map((i) => i.habilidade_id));

  // Categorias que a pessoa já marcou
  const categoriasMarcadas = new Set(
    catalogo
      .filter((h) => marcadas.has(h.id))
      .map((h) => h.categoria),
  );

  // Habilidades não marcadas da mesma categoria (combinam com o que já marcou)
  const porCategoria = catalogo.filter(
    (h) => !marcadas.has(h.id) && categoriasMarcadas.has(h.categoria),
  );

  // Completa com as primeiras do catálogo (mais populares / ordem do backend)
  const populares = catalogo.filter((h) => !marcadas.has(h.id));

  // Junta sem repetir, limitando ao total
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
  const salvamentoEmCurso = useRef(false);

  useEffect(() => {
    setLogado(meuId() !== null);
    listarHabilidades()
      .then((resposta) => setCatalogo(resposta.items))
      .catch(() => setErroCatalogo(true))
      .finally(() => setCarregandoCatalogo(false));
  }, []);

  function ciclarChip(habilidade: HabilidadeResumo) {
    const estado = estadoDoChip(itens, habilidade.id);
    const proximo = proximoEstado(estado);

    setItens((atuais) => {
      const sem = atuais.filter((i) => i.habilidade_id !== habilidade.id);
      const totalSemEsta = sem.length;

      if (proximo === "nenhum") return sem;

      const novos: ItemEditor[] = [];
      if (proximo === "sei" || proximo === "ambos") {
        if (totalSemEsta + novos.length < LIMITE_HABILIDADES)
          novos.push({ habilidade_id: habilidade.id, nome: habilidade.nome, tipo: "sei", nivel: 1 });
      }
      if (proximo === "quero_aprender" || proximo === "ambos") {
        if (totalSemEsta + novos.length < LIMITE_HABILIDADES)
          novos.push({ habilidade_id: habilidade.id, nome: habilidade.nome, tipo: "quero_aprender", nivel: 1 });
      }
      return [...sem, ...novos];
    });
    setMensagem(null);
  }

  function ajustarNivel(habilidadeId: number, tipo: TipoHabilidade, nivel: number) {
    setItens((atuais) =>
      atuais.map((item) =>
        item.habilidade_id === habilidadeId && item.tipo === tipo
          ? { ...item, nivel }
          : item,
      ),
    );
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

  const filtroLower = filtro.toLowerCase();
  const catalogoFiltrado = filtro
    ? catalogo.filter((h) => h.nome.toLowerCase().includes(filtroLower))
    : catalogo;

  const grupos = [
    { titulo: "Tecnologia", habilidades: catalogoFiltrado.filter((h) => h.categoria === "tech") },
    { titulo: "Disciplinas", habilidades: catalogoFiltrado.filter((h) => h.categoria !== "tech") },
  ];

  const sugestoes = carregandoCatalogo ? [] : calcularSugestoes(catalogo, itens);
  const totalSei = itens.filter((i) => i.tipo === "sei").length;
  const totalQuero = itens.filter((i) => i.tipo === "quero_aprender").length;
  const limiteAtingido = itens.length >= LIMITE_HABILIDADES;
  const itensSei = itens.filter((i) => i.tipo === "sei");
  const itensQuero = itens.filter((i) => i.tipo === "quero_aprender");

  if (logado === false) {
    return (
      <p className="text-sm text-texto-2">Entre na sua conta para editar suas habilidades.</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-texto-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full border border-marca bg-marca-suave" />
          Sei
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full border border-troca bg-troca-suave" />
          Quero aprender
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full border border-marca bg-gradient-to-r from-marca-suave to-troca-suave" />
          Os dois
        </span>
      </div>

      <p className="text-sm text-texto-2">
        Toque num chip para ciclar: neutro → Sei → Quero aprender → Os dois.
      </p>

      {/* Sugestões */}
      {sugestoes.length > 0 && (
        <div className="space-y-2 rounded-cartao border border-linha-forte bg-superficie-2/50 p-4">
          <p className="text-xs font-medium text-texto-2">Sugestões para você</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((habilidade) => {
              const estado = estadoDoChip(itens, habilidade.id);
              return (
                <button
                  key={habilidade.id}
                  type="button"
                  aria-pressed={estado !== "nenhum"}
                  onClick={() => ciclarChip(habilidade)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none ${FOCO} ${estiloChip(estado)}`}
                >
                  {estado === "sei" && <Icone nome="confirmar" tamanho={14} />}
                  {estado === "quero_aprender" && <Icone nome="mais" tamanho={14} />}
                  {estado === "ambos" && <Icone nome="confirmar" tamanho={14} />}
                  {habilidade.nome}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtro */}
      <input
        type="search"
        placeholder="Filtrar habilidades…"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full rounded-controle border border-linha-forte bg-superficie px-3 py-2 text-sm text-texto placeholder:text-texto-3 focus:border-marca focus:outline-none"
      />

      {carregandoCatalogo ? (
        <p className="text-sm text-texto-3">Carregando catálogo…</p>
      ) : erroCatalogo ? (
        <p role="alert" className="text-sm text-perigo">
          Não consegui carregar o catálogo. Recarregue a página.
        </p>
      ) : (
        <div className="space-y-4">
          {grupos.map(
            (grupo) =>
              grupo.habilidades.length > 0 && (
                <div key={grupo.titulo} className="space-y-2">
                  <h3 className="text-xs font-medium text-texto-3">{grupo.titulo}</h3>
                  <div className="flex flex-wrap gap-2">
                    {grupo.habilidades.map((habilidade) => {
                      const estado = estadoDoChip(itens, habilidade.id);
                      return (
                        <button
                          key={habilidade.id}
                          type="button"
                          aria-pressed={estado !== "nenhum"}
                          aria-label={`${habilidade.nome} — ${
                            estado === "nenhum"
                              ? "não selecionado"
                              : estado === "sei"
                              ? "sei"
                              : estado === "quero_aprender"
                              ? "quero aprender"
                              : "sei e quero aprender"
                          }`}
                          onClick={() => ciclarChip(habilidade)}
                          className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none ${FOCO} ${estiloChip(estado)}`}
                        >
                          {estado === "sei" && <Icone nome="confirmar" tamanho={14} />}
                          {estado === "quero_aprender" && <Icone nome="mais" tamanho={14} />}
                          {estado === "ambos" && <Icone nome="confirmar" tamanho={14} />}
                          {habilidade.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ),
          )}
          {filtro && catalogoFiltrado.length === 0 && (
            <p className="text-sm text-texto-3">Nenhuma habilidade encontrada para "{filtro}".</p>
          )}
          {limiteAtingido && (
            <p className="text-sm text-texto-3">Limite de 40 habilidades atingido.</p>
          )}
        </div>
      )}

      {/* Níveis */}
      {(itensSei.length > 0 || itensQuero.length > 0) && (
        <div className="space-y-3 border-t border-linha pt-5">
          <div>
            <h3 className="text-sm font-semibold text-texto">Seu nível</h3>
            <p className="text-xs text-texto-3">1 é iniciante e 5 é avançado.</p>
          </div>
          {[
            { label: "Sei", lista: itensSei, tipo: "sei" as TipoHabilidade },
            { label: "Quero aprender", lista: itensQuero, tipo: "quero_aprender" as TipoHabilidade },
          ].map(
            ({ label, lista, tipo }) =>
              lista.length > 0 && (
                <div key={tipo} className="space-y-2">
                  <p className="text-xs font-medium text-texto-2">{label}</p>
                  <ul className="space-y-2">
                    {lista.map((item) => (
                      <li
                        key={item.habilidade_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-controle bg-superficie-2 p-3"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-texto">
                          {item.nome}
                        </span>
                        <div
                          role="group"
                          aria-label={`Nível em ${item.nome}`}
                          className="flex items-center gap-1.5"
                        >
                          {NIVEIS.map((nivel) => (
                            <button
                              key={nivel}
                              type="button"
                              aria-pressed={item.nivel === nivel}
                              aria-label={`Nível ${nivel}`}
                              onClick={() => ajustarNivel(item.habilidade_id, tipo, nivel)}
                              className={`numeros size-10 rounded-full border text-sm transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none ${FOCO} ${
                                item.nivel === nivel
                                  ? "border-marca bg-marca text-marca-texto"
                                  : "border-linha-forte text-texto-2 hover:border-marca"
                              }`}
                            >
                              {nivel}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}

      {/* Resumo vivo */}
      {(totalSei > 0 || totalQuero > 0) && (
        <p className="text-sm text-texto-2">
          Você sabe <strong className="text-texto">{totalSei}</strong>{" "}
          {totalSei === 1 ? "coisa" : "coisas"} e quer aprender{" "}
          <strong className="text-texto">{totalQuero}</strong>.
        </p>
      )}

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
      </div>
    </div>
  );
}