"use client";

import { useEffect, useRef, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { QuadroArrastavel } from "@/components/ui/QuadroArrastavel";
import { Selecao } from "@/components/ui/Campo";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ErroApi, type HabilidadeResumo } from "@/lib/api";
import { habilidadesAgrupadas } from "@/lib/posts";
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

export function EditorHabilidades({
  iniciais,
  aoSalvar,
}: {
  iniciais: HabilidadePerfil[];
  aoSalvar?: (habilidades: HabilidadePerfil[]) => void;
}) {
  const [itens, setItens] = useState(() => converter(iniciais));
  const [catalogo, setCatalogo] = useState<{
    tecnologia: HabilidadeResumo[];
    disciplinas: HabilidadeResumo[];
  }>({ tecnologia: [], disciplinas: [] });
  const [carregando, setCarregando] = useState(true);
  const [erroCatalogo, setErroCatalogo] = useState(false);
  const [logado, setLogado] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{
    texto: string;
    erro: boolean;
  } | null>(null);
  const [habilidadeSelecionada, setHabilidadeSelecionada] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoHabilidade>("sei");
  const [assinaturaSalva, setAssinaturaSalva] = useState(() =>
    assinatura(converter(iniciais)),
  );
  const salvamentoEmCurso = useRef(false);

  useEffect(() => {
    setLogado(meuId() !== null);
    habilidadesAgrupadas()
      .then(setCatalogo)
      .catch(() => setErroCatalogo(true))
      .finally(() => setCarregando(false));
  }, []);

  function mover(itemId: string, _de: string, para: string) {
    if (para !== "sei" && para !== "quero_aprender") return;
    setItens((atuais) =>
      atuais.map((item) =>
        item.id === itemId ? { ...item, tipo: para } : item,
      ),
    );
    setMensagem(null);
  }

  function adicionar() {
    const id = Number(habilidadeSelecionada);
    const habilidade = [...catalogo.tecnologia, ...catalogo.disciplinas].find(
      (item) => item.id === id,
    );
    if (
      !habilidade ||
      itens.some((item) => item.habilidade_id === id) ||
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
    setHabilidadeSelecionada("");
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

  const disponiveis = (lista: HabilidadeResumo[]) =>
    lista.filter(
      (habilidade) =>
        !itens.some((item) => item.habilidade_id === habilidade.id),
    );
  const colunas = [
    {
      id: "sei",
      titulo: "Sei",
      descricao: "O que você pode ensinar",
      itens: itens.filter((item) => item.tipo === "sei"),
    },
    {
      id: "quero_aprender",
      titulo: "Quero aprender",
      descricao: "O que você procura",
      itens: itens.filter((item) => item.tipo === "quero_aprender"),
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-texto-2">
        Arraste entre as colunas ou use os controles. O nível é só informativo.
      </p>
      {logado === false ? (
        <p className="text-sm text-texto-2">
          Entre na sua conta para editar suas habilidades.
        </p>
      ) : (
        <>
          <QuadroArrastavel
            colunas={colunas}
            aoMover={mover}
            renderItem={(item) => (
              <>
                <TagHabilidade nome={item.nome} tipo={item.tipo} />
                <select
                  aria-label={`Nível em ${item.nome}`}
                  value={item.nivel}
                  onChange={(evento) => {
                    const nivel = Number(evento.target.value);
                    setItens((atuais) =>
                      atuais.map((atual) =>
                        atual.id === item.id ? { ...atual, nivel } : atual,
                      ),
                    );
                    setMensagem(null);
                  }}
                  onPointerDown={(evento) => evento.stopPropagation()}
                  className="h-8 rounded-controle border border-linha-forte bg-superficie px-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                >
                  {[1, 2, 3, 4, 5].map((nivel) => (
                    <option
                      key={nivel}
                      value={nivel}
                    >{`Nível ${nivel}`}</option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Remover ${item.nome}`}
                  onClick={() => {
                    setItens((atuais) =>
                      atuais.filter((atual) => atual.id !== item.id),
                    );
                    setMensagem(null);
                  }}
                  onPointerDown={(evento) => evento.stopPropagation()}
                  className="flex size-8 items-center justify-center rounded-full text-texto-2 transition-colors duration-[var(--rapido)] hover:bg-superficie hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca motion-reduce:transition-none"
                >
                  <Icone nome="fechar" tamanho={16} />
                </button>
              </>
            )}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Selecao
                rotulo="Habilidade"
                value={habilidadeSelecionada}
                onChange={(evento) =>
                  setHabilidadeSelecionada(evento.target.value)
                }
              >
                <option value="">Escolha uma habilidade</option>
                <optgroup label="Tecnologia">
                  {disponiveis(catalogo.tecnologia).map((habilidade) => (
                    <option key={habilidade.id} value={habilidade.id}>
                      {habilidade.nome}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Disciplinas">
                  {disponiveis(catalogo.disciplinas).map((habilidade) => (
                    <option key={habilidade.id} value={habilidade.id}>
                      {habilidade.nome}
                    </option>
                  ))}
                </optgroup>
              </Selecao>
            </div>
            <div className="sm:w-44">
              <Selecao
                rotulo="Onde"
                value={tipoSelecionado}
                onChange={(evento) =>
                  setTipoSelecionado(evento.target.value as TipoHabilidade)
                }
              >
                <option value="sei">Sei</option>
                <option value="quero_aprender">Quero aprender</option>
              </Selecao>
            </div>
            <Botao
              variante="secundario"
              onClick={adicionar}
              disabled={
                !habilidadeSelecionada || itens.length >= LIMITE_HABILIDADES
              }
            >
              <Icone nome="mais" tamanho={16} />
              Adicionar
            </Botao>
          </div>

          {carregando && (
            <p className="text-sm text-texto-2">Carregando habilidades…</p>
          )}
          {erroCatalogo && (
            <p role="alert" className="text-sm text-perigo">
              Não consegui carregar o catálogo. Recarregue a página.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Botao
              magnetico
              carregando={salvando}
              onClick={salvar}
              disabled={assinatura(itens) === assinaturaSalva}
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
