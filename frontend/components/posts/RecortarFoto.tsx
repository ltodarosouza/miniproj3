"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";

import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { LADO_MAXIMO_AVATAR, recortarImagem, type AreaRecorte } from "@/lib/imagens";
import { travarRolagem } from "@/lib/rolagem";

// Editor de recorte da foto do post (decisão 44), no jeito das outras redes:
// a moldura fica parada e a foto anda por baixo dela. Arrasta para posicionar,
// aproxima com o controle, a roda do mouse ou a pinça; as setas e +/− fazem o mesmo pelo teclado.
// Sem biblioteca: o recorte final sai do canvas em `recortarImagem`.
// No modo "perfil" (decisão 45) a foto é sempre quadrada, com máscara no hexágono
// do avatar (mesmo polígono de `components/ui/Avatar.tsx`), e sai com 512 px.

export type Proporcao = "original" | "1:1" | "4:5" | "16:9";

/** O que o editor lembra para reabrir a foto do jeito que a pessoa deixou. */
export type EstadoRecorte = { proporcao: Proporcao; zoom: number; centroX: number; centroY: number };

const PROPORCOES: { valor: Proporcao; rotulo: string }[] = [
  { valor: "original", rotulo: "Original" },
  { valor: "1:1", rotulo: "Quadrada" },
  { valor: "4:5", rotulo: "Retrato" },
  { valor: "16:9", rotulo: "Paisagem" },
];

const ZOOM_MAXIMO = 4;
// Mesmo polígono do clip-path de `components/ui/Avatar.tsx`, em coordenadas de 0 a 100.
const HEXAGONO = "50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25";

function razao(proporcao: Proporcao, largura: number, altura: number): number {
  if (proporcao === "1:1") return 1;
  if (proporcao === "4:5") return 4 / 5;
  if (proporcao === "16:9") return 16 / 9;
  return largura / altura;
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

export function RecortarFoto({
  arquivo,
  inicial,
  modo = "post",
  aoConfirmar,
  aoCancelar,
}: {
  /** Foto já preparada; com arquivo, o editor abre. */
  arquivo: File | null;
  modo?: "post" | "perfil";
  inicial?: EstadoRecorte | null;
  aoConfirmar: (recortada: File, estado: EstadoRecorte) => void;
  aoCancelar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const liberar = useRef<(() => void) | null>(null);
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const pinca = useRef<{ distancia: number; zoom: number } | null>(null);
  const [url, setUrl] = useState("");
  const [natural, setNatural] = useState<{ largura: number; altura: number } | null>(null);
  const [espaco, setEspaco] = useState({ largura: 0, altura: 0 });
  const [proporcao, setProporcao] = useState<Proporcao>("original");
  const [zoom, setZoom] = useState(1);
  const [centro, setCentro] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const perfil = modo === "perfil";
  const aoCancelarAtual = useRef(aoCancelar);
  aoCancelarAtual.current = aoCancelar;

  // Abre e fecha o diálogo junto com o arquivo; a página não rola por baixo.
  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (arquivo) {
      const endereco = URL.createObjectURL(arquivo);
      setUrl(endereco);
      setNatural(null);
      setErro("");
      setSalvando(false);
      setProporcao(perfil ? "1:1" : inicial?.proporcao ?? "original");
      setZoom(inicial?.zoom ?? 1);
      setCentro(inicial ? { x: inicial.centroX, y: inicial.centroY } : { x: 0, y: 0 });
      if (!elemento.open) {
        liberar.current ??= travarRolagem();
        elemento.showModal();
      }
      return () => URL.revokeObjectURL(endereco);
    }
    if (elemento.open) elemento.close();
    liberar.current?.();
    liberar.current = null;
    // `inicial` só vale no momento em que a foto chega.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivo]);

  useEffect(() => () => liberar.current?.(), []);

  // Mede o espaço livre para a moldura sempre que a tela muda de tamanho.
  useLayoutEffect(() => {
    const elemento = area.current;
    if (!elemento || !arquivo) return;
    const medir = () => setEspaco({ largura: elemento.clientWidth, altura: elemento.clientHeight });
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [arquivo]);

  // Tamanho da moldura na tela, a maior que cabe no espaço com a proporção escolhida.
  const r = natural ? razao(proporcao, natural.largura, natural.altura) : 1;
  let molduraL = espaco.largura;
  let molduraA = molduraL / r;
  if (molduraA > espaco.altura) {
    molduraA = espaco.altura;
    molduraL = molduraA * r;
  }
  // Escala da foto na tela: com zoom 1 a foto cobre a moldura inteira, sem sobra.
  const escala = natural && molduraL > 0
    ? Math.max(molduraL / natural.largura, molduraA / natural.altura) * zoom
    : 0;
  // Pedaço da foto original (em pixels) que a moldura enxerga.
  const recorteL = escala ? molduraL / escala : 0;
  const recorteA = escala ? molduraA / escala : 0;

  function prender(x: number, y: number) {
    if (!natural) return { x, y };
    return {
      x: limitar(x, recorteL / 2, natural.largura - recorteL / 2),
      y: limitar(y, recorteA / 2, natural.altura - recorteA / 2),
    };
  }

  // Centro sempre dentro da foto: a moldura nunca mostra área vazia.
  const centroPreso = prender(centro.x, centro.y);

  function trocarProporcao(nova: Proporcao) {
    setProporcao(nova);
    setZoom(1);
    if (natural) setCentro({ x: natural.largura / 2, y: natural.altura / 2 });
  }

  function mudarZoom(novo: number) {
    setZoom(limitar(novo, 1, ZOOM_MAXIMO));
  }

  function mover(dxTela: number, dyTela: number) {
    if (!escala) return;
    setCentro((atual) => {
      const preso = prender(atual.x, atual.y);
      return prender(preso.x - dxTela / escala, preso.y - dyTela / escala);
    });
  }

  function distanciaDaPinca(): number {
    const [a, b] = [...ponteiros.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function apertar(evento: PointerEvent<HTMLDivElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId);
    ponteiros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    if (ponteiros.current.size === 2) pinca.current = { distancia: distanciaDaPinca(), zoom };
    setArrastando(true);
  }

  function arrastar(evento: PointerEvent<HTMLDivElement>) {
    const anterior = ponteiros.current.get(evento.pointerId);
    if (!anterior) return;
    const atual = { x: evento.clientX, y: evento.clientY };
    ponteiros.current.set(evento.pointerId, atual);
    if (ponteiros.current.size >= 2 && pinca.current) {
      const distancia = distanciaDaPinca();
      if (pinca.current.distancia > 0) mudarZoom(pinca.current.zoom * (distancia / pinca.current.distancia));
      return;
    }
    mover(atual.x - anterior.x, atual.y - anterior.y);
  }

  function soltar(evento: PointerEvent<HTMLDivElement>) {
    ponteiros.current.delete(evento.pointerId);
    if (ponteiros.current.size < 2) pinca.current = null;
    if (ponteiros.current.size === 0) setArrastando(false);
  }

  function rolar(evento: WheelEvent<HTMLDivElement>) {
    mudarZoom(zoom * Math.exp(-evento.deltaY * 0.0015));
  }

  function teclar(evento: KeyboardEvent<HTMLDivElement>) {
    const passo = evento.shiftKey ? 40 : 10;
    const acoes: Record<string, () => void> = {
      ArrowLeft: () => mover(passo, 0),
      ArrowRight: () => mover(-passo, 0),
      ArrowUp: () => mover(0, passo),
      ArrowDown: () => mover(0, -passo),
      "+": () => mudarZoom(zoom + 0.1),
      "=": () => mudarZoom(zoom + 0.1),
      "-": () => mudarZoom(zoom - 0.1),
    };
    const acao = acoes[evento.key];
    if (!acao) return;
    evento.preventDefault();
    acao();
  }

  async function confirmar() {
    if (!arquivo || !natural || !escala || salvando) return;
    setSalvando(true);
    setErro("");
    const recorte: AreaRecorte = {
      x: centroPreso.x - recorteL / 2,
      y: centroPreso.y - recorteA / 2,
      largura: recorteL,
      altura: recorteA,
    };
    try {
      const recortada = await recortarImagem(arquivo, recorte, perfil ? LADO_MAXIMO_AVATAR : undefined);
      aoConfirmar(recortada, { proporcao, zoom, centroX: centroPreso.x, centroY: centroPreso.y });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não consegui recortar essa foto.");
      setSalvando(false);
    }
  }

  return (
    <dialog
      ref={dialogo}
      aria-label={perfil ? "Ajustar foto de perfil" : "Recortar foto"}
      onKeyDown={(evento) => {
        // Não deixa o Esc chegar ao formulário de fora (o editor de post fecha com Esc).
        if (evento.key === "Escape") evento.stopPropagation();
      }}
      onCancel={(evento) => {
        evento.preventDefault();
        if (!salvando) aoCancelarAtual.current();
      }}
      className="lupa fixed inset-0 m-0 hidden h-dvh max-h-none w-full max-w-none place-items-center overscroll-contain border-0 bg-transparent p-3 open:grid sm:p-8"
    >
      <div className="lupa-foto flex h-full max-h-[44rem] w-full max-w-2xl flex-col overflow-hidden rounded-cartao border border-linha bg-superficie text-texto shadow-alta">
        <header className="flex min-h-14 items-center gap-2 border-b border-linha py-1.5 pl-4 pr-1.5">
          <h2 className="flex-1 text-[0.9375rem] font-semibold">{perfil ? "Ajustar foto de perfil" : "Recortar foto"}</h2>
          <button
            type="button"
            aria-label="Cancelar recorte"
            onClick={() => !salvando && aoCancelarAtual.current()}
            className="grid size-11 shrink-0 place-items-center rounded-controle text-texto-2 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none"
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </header>

        <div ref={area} className="relative m-3 grid min-h-0 flex-1 place-items-center sm:m-4">
          {url && (
            <div
              role="application"
              tabIndex={0}
              aria-label="Área do recorte. Arraste para posicionar a foto; setas movem e + ou − aproximam."
              onPointerDown={apertar}
              onPointerMove={arrastar}
              onPointerUp={soltar}
              onPointerCancel={soltar}
              onWheel={rolar}
              onKeyDown={teclar}
              style={{ width: molduraL, height: molduraA }}
              className={`relative touch-none select-none overflow-hidden rounded-controle bg-superficie-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-foco ${arrastando ? "cursor-grabbing" : "cursor-grab"}`}
            >
              <img
                src={url}
                alt="Foto que será recortada"
                draggable={false}
                onLoad={(evento) => {
                  const imagem = evento.currentTarget;
                  const dimensoes = { largura: imagem.naturalWidth, altura: imagem.naturalHeight };
                  setNatural(dimensoes);
                  // Sem estado anterior, começa pelo centro da foto.
                  if (!inicial) setCentro({ x: dimensoes.largura / 2, y: dimensoes.altura / 2 });
                }}
                style={
                  natural && escala
                    ? {
                        width: natural.largura * escala,
                        height: natural.altura * escala,
                        left: molduraL / 2 - centroPreso.x * escala,
                        top: molduraA / 2 - centroPreso.y * escala,
                      }
                    : { visibility: "hidden" }
                }
                className="pointer-events-none absolute max-w-none"
              />
              {/* Regra dos terços enquanto arrasta, como nas outras redes. */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 transition-opacity duration-[var(--rapido)] motion-reduce:transition-none ${arrastando ? "opacity-100" : "opacity-0"}`}
                style={{
                  backgroundImage:
                    "linear-gradient(to right, transparent calc(33.333% - 0.5px), rgb(255 255 255 / 0.6) calc(33.333% - 0.5px), rgb(255 255 255 / 0.6) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgb(255 255 255 / 0.6) calc(66.666% - 0.5px), rgb(255 255 255 / 0.6) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px)), linear-gradient(to bottom, transparent calc(33.333% - 0.5px), rgb(255 255 255 / 0.6) calc(33.333% - 0.5px), rgb(255 255 255 / 0.6) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgb(255 255 255 / 0.6) calc(66.666% - 0.5px), rgb(255 255 255 / 0.6) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px))",
                }}
              />
              {perfil ? (
                // Fora do hexágono escurece: é o que some no avatar.
                <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
                  <path fillRule="evenodd" fill="rgb(0 0 0 / 0.55)" d={`M0 0H100V100H0Z M${HEXAGONO}Z`} />
                  <path fill="none" stroke="rgb(255 255 255 / 0.85)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" d={`M${HEXAGONO}Z`} />
                </svg>
              ) : (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-controle ring-1 ring-inset ring-white/70" />
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-linha px-4 py-3">
          {perfil ? (
            <p className="text-sm text-texto-2">Arraste para centralizar o rosto no hexágono.</p>
          ) : (
          <div role="radiogroup" aria-label="Proporção" className="flex flex-wrap gap-1.5">
            {PROPORCOES.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                role="radio"
                aria-checked={proporcao === opcao.valor}
                onClick={() => trocarProporcao(opcao.valor)}
                disabled={salvando}
                className={`h-9 rounded-controle border px-3 text-sm font-medium transition-colors duration-[var(--rapido)] motion-reduce:transition-none ${proporcao === opcao.valor ? "border-texto bg-texto text-fundo" : "border-linha-forte text-texto-2 hover:border-texto hover:text-texto"}`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
          )}
          <label className="flex items-center gap-3 text-sm text-texto-2">
            <span className="shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={ZOOM_MAXIMO}
              step={0.01}
              value={zoom}
              disabled={salvando}
              onChange={(evento) => mudarZoom(Number(evento.target.value))}
              className="h-11 min-w-0 flex-1 accent-[var(--marca)]"
            />
          </label>
          {erro && <p role="alert" className="text-sm text-perigo">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Botao type="button" variante="fantasma" tamanho="sm" disabled={salvando} onClick={() => aoCancelarAtual.current()}>
              Cancelar
            </Botao>
            <Botao type="button" tamanho="sm" carregando={salvando} disabled={!natural} onClick={confirmar}>
              Usar foto
            </Botao>
          </div>
        </div>
      </div>
    </dialog>
  );
}