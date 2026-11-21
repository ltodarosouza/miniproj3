"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { animarMola } from "@/lib/movimento";

import { Icone } from "./Icone";

export type Coluna<T> = { id: string; titulo: string; descricao?: string; itens: T[] };

type Arraste = { id: string; de: string; inicioX: number; inicioY: number; el: HTMLElement };

export function QuadroArrastavel<T extends { id: string }>({
  colunas,
  aoMover,
  renderItem,
}: {
  colunas: Coluna<T>[];
  aoMover: (itemId: string, de: string, para: string) => void;
  renderItem: (item: T, colunaId: string) => ReactNode;
}) {
  const arraste = useRef<Arraste | null>(null);
  const pouso = useRef<{ id: string; x: number; y: number } | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const [zonaAlvo, setZonaAlvo] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);

  useLayoutEffect(() => {
    const p = pouso.current;
    if (!p || !raiz.current) return;
    pouso.current = null;
    const el = raiz.current.querySelector<HTMLElement>(`[data-item="${p.id}"]`);
    if (!el) return;
    el.style.transform = "";
    const caixa = el.getBoundingClientRect();
    animarMola(
      { x: p.x - caixa.left, y: p.y - caixa.top },
      (x, y) => {
        el.style.transform = `translate(${x}px, ${y}px)`;
      },
      () => {
        el.style.transform = "";
        el.style.zIndex = "";
      }
    );
  });

  function zonaEm(x: number, y: number): string | null {
    const arrastado = arraste.current?.el;
    const embaixo = document.elementsFromPoint(x, y).find((el) => !arrastado?.contains(el));
    const zona = embaixo?.closest<HTMLElement>("[data-zona]");
    return zona?.dataset.zona ?? null;
  }

  function soltar(x: number, y: number) {
    const a = arraste.current;
    if (!a) return;
    arraste.current = null;
    setArrastando(null);
    setZonaAlvo(null);
    a.el.style.transition = "";
    const para = zonaEm(x, y);
    const caixa = a.el.getBoundingClientRect();

    if (para && para !== a.de) {
      pouso.current = { id: a.id, x: caixa.left, y: caixa.top };
      aoMover(a.id, a.de, para);
      return;
    }
    const dx = x - a.inicioX;
    const dy = y - a.inicioY;
    animarMola(
      { x: dx, y: dy },
      (nx, ny) => {
        a.el.style.transform = `translate(${nx}px, ${ny}px)`;
      },
      () => {
        a.el.style.transform = "";
        a.el.style.zIndex = "";
      }
    );
  }

  function moverPorTeclado(itemId: string, de: string) {
    const indice = colunas.findIndex((c) => c.id === de);
    const para = colunas[(indice + 1) % colunas.length].id;
    aoMover(itemId, de, para);
  }

  return (
    <div ref={raiz} className="grid gap-3 sm:grid-cols-2" aria-describedby="quadro-dica">
      <p id="quadro-dica" className="sr-only">
        Arraste os itens entre as colunas, ou foque um item e aperte Enter para mandá-lo para a próxima coluna.
      </p>
      {colunas.map((coluna) => (
        <section
          key={coluna.id}
          data-zona={coluna.id}
          className={`flex min-h-40 flex-col gap-3 rounded-cartao border p-3 transition-[border-color,background-color,box-shadow] duration-[var(--medio)] ease-saida ${
            zonaAlvo === coluna.id
              ? "border-marca bg-marca-suave shadow-[0_0_0_4px_var(--brilho)]"
              : "border-linha bg-superficie-2/60"
          }`}
        >
          <header className="px-1">
            <h3 className="text-sm font-semibold text-texto">{coluna.titulo}</h3>
            {coluna.descricao && <p className="text-[0.8125rem] text-texto-3">{coluna.descricao}</p>}
          </header>
          <ul className="flex flex-wrap gap-2">
            {coluna.itens.map((item) => (
              <li
                key={item.id}
                data-item={item.id}
                tabIndex={0}
                aria-grabbed={arrastando === item.id}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    moverPorTeclado(item.id, coluna.id);
                  }
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  const el = e.currentTarget;
                  el.setPointerCapture(e.pointerId);
                  el.style.zIndex = "30";
                  arraste.current = { id: item.id, de: coluna.id, inicioX: e.clientX, inicioY: e.clientY, el };
                  setArrastando(item.id);
                }}
                onPointerMove={(e) => {
                  const a = arraste.current;
                  if (!a || a.id !== item.id) return;
                  const dx = e.clientX - a.inicioX;
                  const dy = e.clientY - a.inicioY;
                  const giro = Math.max(-6, Math.min(6, e.movementX * 0.6));
                  a.el.style.transition = "rotate 180ms var(--ease-saida), scale 180ms var(--ease-saida)";
                  a.el.style.transform = `translate(${dx}px, ${dy}px)`;
                  a.el.style.rotate = `${giro}deg`;
                  a.el.style.scale = "1.06";
                  setZonaAlvo(zonaEm(e.clientX, e.clientY));
                }}
                onPointerUp={(e) => {
                  e.currentTarget.style.rotate = "";
                  e.currentTarget.style.scale = "";
                  soltar(e.clientX, e.clientY);
                }}
                onPointerCancel={(e) => {
                  e.currentTarget.style.rotate = "";
                  e.currentTarget.style.scale = "";
                  soltar(arraste.current?.inicioX ?? 0, arraste.current?.inicioY ?? 0);
                }}
                className={`relative flex cursor-grab touch-none items-center gap-1 rounded-full select-none active:cursor-grabbing ${
                  arrastando === item.id ? "drop-shadow-[0_10px_18px_oklch(0.3_0.04_195_/_0.25)]" : ""
                }`}
              >
                <Icone nome="arrastar" tamanho={14} className="text-texto-3" />
                {renderItem(item, coluna.id)}
              </li>
            ))}
            {coluna.itens.length === 0 && (
              <li className="w-full rounded-controle border border-dashed border-linha-forte px-3 py-4 text-center text-sm text-texto-3">
                Solte aqui
              </li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
