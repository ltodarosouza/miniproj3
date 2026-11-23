"use client";

import { useEffect, useRef, useState } from "react";

import { AutocompleteHabilidade } from "@/components/perfil/AutocompleteHabilidade";
import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import {
  buscarAutocomplete,
  ErroApi,
  listarHabilidades,
  mapearHabilidade,
  type HabilidadeResumo,
} from "@/lib/api";
import {
  LIMITE_HABILIDADES,
  salvarHabilidades,
  type HabilidadePerfil,
  type TipoHabilidade,
} from "@/lib/perfil";
import { meuId } from "@/lib/sessao";

type ItemEditor = {
  id: string;
  habilidade_id: number;
  nome: string;
  tipo: TipoHabilidade;
  nivel: number;
};

function converter(habilidades: HabilidadePerfil[]): ItemEditor[] {
  return habilidades.map((habilidade) => ({
    id: String(habilidade.id),
    habilidade_id: habilidade.id,
    nome: habilidade.nome,
    tipo: habilidade.tipo,
    nivel: habilidade.nivel,
  }));
}

function assinatura(itens: ItemEditor[]): string {
  return itens
    .map(
      ({ habilidade_id, tipo, nivel }) => `${habilidade_id}:${tipo}:${nivel}`,
    )
    .sort()
    .join("|");
}

function alternarTipo(tipo: TipoHabilidade): TipoHabilidade {
  return tipo === "sei" ? "quero_aprender" : "sei";
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
  const [mensagem, setMensagem] = useState<{
    texto: string;
    erro: boolean;
  } | null>(null);
  const [textoHabilidade, setTextoHabilidade] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoHabilidade>("sei");
  const [assinaturaSalva, setAssinaturaSalva] = useState(() =>
    assinatura(converter(iniciais)),
  );
  const salvamentoEmCurso = useRef(false);

  useEffect(() => {
    setLogado(meuId() !== null);
    listarHabilidades()
      .then((resposta) => setCatalogo(resposta.items))
      .catch(() => setErroCatalogo(true))
      .finally(() => setCarregandoCatalogo(false));
  }, []);

  function adicionar(habilidade: HabilidadeResumo) {
    if (
      !habilidade ||
      itens.some((item) => item.habilidade_id === habilidade.id) ||
      itens.length >= LIMITE_HABILIDADES
    )
      return;
    setItens((atuais) => [
      ...atuais,
      {
        id: String(habilidade.id),
        habilidade_id: habilidade.id,
        nome: habilidade.nome,
        tipo: tipoSelecionado,
        nivel: 1,
      },
    ]);
    setTextoHabilidade("");
    setMensagem(null);
  }

  function remover(itemId: string) {
    setItens((atuais) => atuais.filter((item) => item.id !== itemId));
    setMensagem(null);
  }

  function mover(itemId: string) {
    setItens((atuais) =>
      atuais.map((item) =>
        item.id === itemId ? { ...item, tipo: alternarTipo(item.tipo) } : item,
      ),
    );
    setMensagem(null);
  }

  function ajustarNivel(itemId: string, nivel: number) {
    setItens((atuais) =>
      atuais.map((item) =>
        item.id === itemId ? { ...item, nivel } : item,
      ),
    );
    setMensagem(null);
  }

  async function salvar() {
    if (salvamentoEmCurso.current || assinatura(itens) === assinaturaSalva)
      return;
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
          erro instanceof ErroApi
            ? erro.message
            : "Não deu para salvar. Tente de novo.",
        erro: true,
      });
    } finally {
      salvamentoEmCurso.current = false;
      setSalvando(false);
    }
  }

  const idsSelecionados = itens.map((item) => item.habilidade_id);

  const disponiveis = catalogo.filter(
    (habilidade) => !idsSelecionados.includes(habilidade.id),
  );

  const tecnologia = disponiveis.filter((habilidade) => habilidade.categoria === "tech");
  const disciplinas = disponiveis.filter((habilidade) => habilidade.categoria !== "tech");

  const sei = itens.filter((item) => item.tipo === "sei");
  const quero = itens.filter((item) => item.tipo === "quero_aprender");

  return (
    <div className="space-y-6">
      {logado === false ? (
        <p className="text-sm text-texto-2">
          Entre na sua conta para editar suas habilidades.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColunaHabilidades
              titulo="Sei"
              descricao="O que você pode ensinar"
              itens={sei}
              onMover={mover}
              onRemover={remover}
              onNivel={ajustarNivel}
            />
            <ColunaHabilidades
              titulo="Quero aprender"
              descricao="O que você procura"
              itens={quero}
              onMover={mover}
              onRemover={remover}
              onNivel={ajustarNivel}
            />
          </div>

          <div className="space-y-4 border-t border-linha pt-5">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-texto">Adicionar habilidade</h3>
              <p className="text-sm text-texto-3">
                Busque pelo nome ou toque numa sugestão abaixo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <AutocompleteHabilidade
                  rotulo="Buscar"
                  placeholder="Ex: Python, React, Cálculo 1..."
                  value={textoHabilidade}
                  onChange={setTextoHabilidade}
                  onSelect={adicionar}
                  buscarSugestoes={buscarAutocomplete}
                  mapearTexto={mapearHabilidade}
                  habilidadesExistentes={idsSelecionados}
                  disabled={itens.length >= LIMITE_HABILIDADES}
                />
              </div>
              <div className="sm:w-60">
                <p id="rotulo-tipo-habilidade" className="mb-1.5 block text-sm font-medium text-texto">
                  Vai para
                </p>
                <div role="group" aria-labelledby="rotulo-tipo-habilidade" className="flex rounded-controle border border-linha-forte bg-superficie p-1">
                  <button
                    type="button"
                    aria-pressed={tipoSelecionado === "sei"}
                    onClick={() => setTipoSelecionado("sei")}
                    className={`flex-1 rounded-controle py-1.5 text-sm font-medium transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca ${
                      tipoSelecionado === "sei"
                        ? "bg-marca text-marca-texto"
                        : "text-texto-2 hover:bg-superficie-2"
                    }`}
                  >
                    Sei
                  </button>
                  <button
                    type="button"
                    aria-pressed={tipoSelecionado === "quero_aprender"}
                    onClick={() => setTipoSelecionado("quero_aprender")}
                    className={`flex-1 rounded-controle py-1.5 text-sm font-medium transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca ${
                      tipoSelecionado === "quero_aprender"
                        ? "bg-marca text-marca-texto"
                        : "text-texto-2 hover:bg-superficie-2"
                    }`}
                  >
                    Quero aprender
                  </button>
                </div>
              </div>
            </div>

            {carregandoCatalogo ? (
              <p className="text-sm text-texto-3">Carregando catálogo…</p>
            ) : erroCatalogo ? (
              <p role="alert" className="text-sm text-perigo">
                Não consegui carregar o catálogo. Recarregue a página.
              </p>
            ) : (
              disponiveis.length === 0 ? (
                <p className="text-sm text-texto-3">Você já adicionou todas as habilidades do catálogo.</p>
              ) : (
                <div className="space-y-3">
                  {[{ titulo: "Tecnologia", habilidades: tecnologia }, { titulo: "Disciplinas", habilidades: disciplinas }].map((grupo) => grupo.habilidades.length > 0 && (
                    <div key={grupo.titulo} className="space-y-2">
                      <h4 className="text-xs text-texto-3">{grupo.titulo}</h4>
                      <div className="flex flex-wrap gap-2">
                        {grupo.habilidades.map((habilidade) => (
                          <button
                            key={habilidade.id}
                            type="button"
                            onClick={() => adicionar(habilidade)}
                            disabled={itens.length >= LIMITE_HABILIDADES}
                            className="inline-flex items-center gap-1.5 rounded-full border border-linha-forte bg-superficie-2 px-3 py-1.5 text-sm text-texto transition-colors duration-[var(--rapido)] ease-saida hover:border-marca hover:text-marca-forte disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca motion-reduce:transition-none"
                          >
                            <Icone nome="mais" tamanho={14} />
                            {habilidade.nome}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            {itens.length >= LIMITE_HABILIDADES && (
              <p className="text-sm text-texto-3">Limite de 40 habilidades atingido.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Botao
              magnetico
              carregando={salvando}
              onClick={salvar}
              disabled={assinatura(itens) === assinaturaSalva}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
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
        </>
      )}
    </div>
  );
}

function ColunaHabilidades({
  titulo,
  descricao,
  itens,
  onMover,
  onRemover,
  onNivel,
}: {
  titulo: string;
  descricao: string;
  itens: ItemEditor[];
  onMover: (id: string) => void;
  onRemover: (id: string) => void;
  onNivel: (id: string, nivel: number) => void;
}) {
  return (
    <div className="rounded-controle bg-superficie-2 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-texto">{titulo}</h3>
        <p className="text-xs text-texto-3">{descricao}</p>
      </div>
      {itens.length === 0 ? (
        <p className="py-4 text-center text-sm text-texto-3">
          Nenhuma habilidade aqui.
        </p>
      ) : (
        <ul className="space-y-2">
          {itens.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-2 rounded-controle bg-superficie p-2"
            >
              <span className="min-w-0 flex-1 truncate">
                <TagHabilidade nome={item.nome} tipo={item.tipo} />
              </span>
              <select
                aria-label={`Nível em ${item.nome}`}
                value={item.nivel}
                onChange={(evento) => onNivel(item.id, Number(evento.target.value))}
                className="h-8 min-w-0 rounded-controle border border-linha-forte bg-superficie px-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
              >
                {[1, 2, 3, 4, 5].map((nivel) => (
                  <option key={nivel} value={nivel}>{`Nível ${nivel}`}</option>
                ))}
              </select>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`Mover ${item.nome} para ${alternarTipo(item.tipo) === "sei" ? "Sei" : "Quero aprender"}`}
                  onClick={() => onMover(item.id)}
                  className="flex size-8 items-center justify-center rounded-full text-texto-2 transition-colors duration-[var(--rapido)] ease-saida hover:bg-superficie hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca motion-reduce:transition-none"
                  title="Mover"
                >
                  <Icone nome="troca" tamanho={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Remover ${item.nome}`}
                  onClick={() => onRemover(item.id)}
                  className="flex size-8 items-center justify-center rounded-full text-texto-2 transition-colors duration-[var(--rapido)] ease-saida hover:bg-superficie hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca motion-reduce:transition-none"
                  title="Remover"
                >
                  <Icone nome="fechar" tamanho={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
