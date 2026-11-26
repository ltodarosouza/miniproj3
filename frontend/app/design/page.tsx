"use client";

import { useState, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { BotaoCurtir } from "@/components/ui/BotaoCurtir";
import { celebrar } from "@/components/ui/Celebrar";
import { AreaTexto, Campo } from "@/components/ui/Campo";
import { Cartao } from "@/components/ui/Cartao";
import { Estrelas } from "@/components/ui/Estrelas";
import { EsqueletoLista } from "@/components/ui/Esqueleto";
import { Folha } from "@/components/ui/Folha";
import { Icone } from "@/components/ui/Icone";
import { Logo, CELULA_A, CELULA_B } from "@/components/ui/Logo";
import { PuxarParaAtualizar } from "@/components/ui/PuxarParaAtualizar";
import { Revelar } from "@/components/ui/Revelar";
import { SeloContador } from "@/components/ui/SeloContador";
import { Streak } from "@/components/ui/Streak";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ToqueDuplo } from "@/components/ui/ToqueDuplo";

const CORES = [
  ["fundo", "Fundo da página", "bg-fundo"],
  ["superficie", "Superfície", "bg-superficie"],
  ["superficie-2", "Superfície secundária", "bg-superficie-2"],
  ["linha", "Divisória", "bg-linha"],
  ["linha-forte", "Divisória forte", "bg-linha-forte"],
  ["texto", "Texto principal", "bg-texto"],
  ["texto-2", "Texto secundário", "bg-texto-2"],
  ["texto-3", "Rótulo discreto", "bg-texto-3"],
  ["marca", "Ação e conexão", "bg-marca"],
  ["marca-forte", "Texto de marca", "bg-marca-forte"],
  ["marca-suave", "Habilidade que sei", "bg-marca-suave"],
  ["grafite", "Superfície escura", "bg-grafite"],
  ["alta", "Variação positiva", "bg-alta"],
  ["baixa", "Variação negativa", "bg-baixa"],
  ["perigo", "Erro", "bg-perigo"],
];

function Secao({
  numero,
  titulo,
  descricao,
  children,
}: {
  numero: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 border-t border-linha pt-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <div>
        <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-2">
          {numero} · {titulo}
        </h2>
        <p className="mt-2 text-sm text-texto-2">{descricao}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const STATUS = "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-[0.6875rem]";

export default function DesignPage() {
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [nota, setNota] = useState(0);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [duplo, setDuplo] = useState(false);
  const [curtidaExemplo, setCurtidaExemplo] = useState(false);

  return (
    <div className="space-y-10 pb-24">
      <header className="space-y-4">
        <Logo variante="completo" tamanho="lg" />
        <h1 className="font-display text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em]">
          Guia visual
        </h1>
        <p className="max-w-2xl text-sm text-texto-2">
          Tokens, tipos e peças que todas as telas usam. Mel só onde há ação ou conexão; réguas de 1 px no
          lugar de cartões.
        </p>
      </header>

      <Secao
        numero="01"
        titulo="Logo"
        descricao="Duas células ligadas = o par de troca; a vazia = a próxima conexão."
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-8">
            {(["sm", "md", "lg"] as const).map((s) => (
              <div key={s} className="space-y-2">
                <Logo tamanho={s} />
                <p className="font-mono text-xs text-texto-2">completo · {s}</p>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-8">
            {(["sm", "md", "lg"] as const).map((s) => (
              <div key={s} className="space-y-2">
                <Logo variante="simbolo" tamanho={s} />
                <p className="font-mono text-xs text-texto-2">símbolo · {s}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-texto-2">
            No tema claro, “match” usa o token <code className="font-mono">marca-forte</code>; no tema
            escuro, usa <code className="font-mono">marca</code>.
          </p>
        </div>
      </Secao>

      <Secao numero="02" titulo="Cores" descricao="Tokens nomeados pelo papel que cumprem na interface.">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {CORES.map(([nome, papel, classe]) => (
            <div key={nome}>
              <div className={`h-12 rounded-controle border border-linha ${classe}`} />
              <p className="mt-1.5 font-mono text-xs">{nome}</p>
              <p className="text-xs text-texto-2">{papel}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao
        numero="03"
        titulo="Tipografia"
        descricao="Space Grotesk para títulos, IBM Plex Sans no corpo e IBM Plex Mono em dados."
      >
        <div className="space-y-4">
          <p className="font-display text-4xl font-bold tracking-[-0.02em]">Bolsa de saberes</p>
          <p className="font-display text-2xl font-semibold tracking-[-0.02em]">Título de seção</p>
          <p className="max-w-[65ch] font-sans text-sm text-texto-2">
            Hoje entendi recursão desenhando a pilha de chamadas no papel. Quero trocar uma explicação de
            Cálculo 1 por uma de Python.
          </p>
          <p className="numeros font-mono text-sm">19:42 · 2h 30min · @ana_dev · ORD-0042</p>
        </div>
      </Secao>

      <Secao numero="04" titulo="Botões" descricao="Ação principal, alternativas e estados de interação.">
        <div className="flex flex-wrap items-center gap-3">
          <Botao>Publicar</Botao>
          <Botao variante="secundario">Secundário</Botao>
          <Botao variante="fantasma">Fantasma</Botao>
          <Botao carregando>Salvando</Botao>
          <Botao disabled>Desabilitado</Botao>
          <Botao tamanho="sm" variante="secundario">
            Pequeno
          </Botao>
          <BotaoLink href="/matches" variante="secundario">
            Ver pares
          </BotaoLink>
          <Botao>
            <Icone nome="par" />
            Propor troca
          </Botao>
        </div>
      </Secao>

      <Secao numero="05" titulo="Campos" descricao="Rótulo visível, dica objetiva e erro com orientação.">
        <div className="grid max-w-xl gap-4">
          <Campo rotulo="Usuário" placeholder="ana_dev" dica="Letras minúsculas, números e _" />
          <Campo
            rotulo="Senha"
            type="password"
            defaultValue="123"
            erro="A senha precisa de pelo menos 8 caracteres."
          />
          <Campo
            rotulo="Senha com ação"
            type={senhaVisivel ? "text" : "password"}
            defaultValue="senha-forte-123"
            dica="De 8 a 32 caracteres"
            acao={
              <button
                type="button"
                onClick={() => setSenhaVisivel((v) => !v)}
                aria-pressed={senhaVisivel}
                className="rounded-controle px-2 py-1 text-sm text-texto-2"
              >
                {senhaVisivel ? "Ocultar" : "Mostrar"}
              </button>
            }
          />
          <AreaTexto rotulo="O que você estudou hoje?" placeholder="Conte sua rotina de estudos..." />
        </div>
      </Secao>

      <Secao
        numero="06"
        titulo="Habilidades"
        descricao="Mel suave = sei, tracejada = quero aprender, mel cheio = a habilidade que fecha o par."
      >
        <div className="flex flex-wrap gap-2">
          <TagHabilidade nome="Python" tipo="sei" nivel={4} />
          <TagHabilidade nome="Cálculo 1" tipo="quero" />
          <TagHabilidade nome="Git" tipo="neutra" />
          <TagHabilidade nome="React" tipo="sei" nivel={3} destaque />
        </div>
      </Secao>

      <Secao
        numero="07"
        titulo="Avatares"
        descricao="Sem foto, iniciais em mono dentro do hexágono. Cor neutra e estável."
      >
        <div className="flex items-center gap-4">
          <Avatar nome="Ana Souza" tamanho="lg" />
          <Avatar nome="Bruno Lima" tamanho="md" />
          <Avatar nome="Caio Melo" tamanho="sm" />
        </div>
      </Secao>

      <Secao
        numero="08"
        titulo="Painel"
        descricao="Régua separa linhas; o painel interativo reforça a borda ao passar o cursor."
      >
        <div className="grid gap-4">
          <Cartao rotulo="01 · Pares de troca" className="px-4 pt-3 pb-1">
            <ul>
              {[
                ["Ana Souza", "@ana_dev", "Python", "19:42"],
                ["Bruno Lima", "@bruno", "Cálculo 1", "20:10"],
                ["Caio Melo", "@caio_m", "React", "Amanhã"],
              ].map(([nome, user, habilidade, hora]) => (
                <li
                  key={user}
                  className="flex items-center gap-3 border-b border-linha py-2.5 last:border-b-0"
                >
                  <Avatar nome={nome} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      {nome} <span className="font-mono text-xs text-texto-2">{user}</span>
                    </p>
                  </div>
                  <TagHabilidade nome={habilidade} tipo="sei" />
                  <span className="font-mono text-xs text-texto-2">{hora}</span>
                </li>
              ))}
            </ul>
          </Cartao>
          <Cartao interativo className="p-4 text-sm text-texto-2">
            Painel interativo: foco e hover usam borda, sem sombra.
          </Cartao>
        </div>
      </Secao>

      <Secao numero="09" titulo="Rótulo numerado" descricao="Toda seção de tela abre com um rótulo assim.">
        <div className="space-y-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-2">
          <p>01 · Pares de troca</p>
          <p>02 · Pode te ensinar</p>
        </div>
      </Secao>

      <Secao
        numero="10"
        titulo="Ordem"
        descricao="Identificador, participantes, habilidades e estado em texto."
      >
        <div className="flex flex-wrap items-center gap-3 border-y border-linha py-3">
          <Icone nome="ordem" />
          <span className="font-mono text-xs">ORD-0042</span>
          <span className="text-sm">Ana ↔ Bruno</span>
          <TagHabilidade nome="Python" tipo="sei" />
          <TagHabilidade nome="Cálculo 1" tipo="sei" />
          <span className={`${STATUS} text-texto-2 border-linha-forte`}>aberta</span>
          <span className={`${STATUS} text-texto-2 border-marca`}>confirmada</span>
          <span className={`${STATUS} text-texto-2 border-alta`}>concluída</span>
          <span className={`${STATUS} text-texto-2 border-baixa`}>recusada</span>
        </div>
      </Secao>

      <Secao
        numero="11"
        titulo="Cotação ▲▼"
        descricao="Horas de estudo na semana e variação em relação à semana anterior."
      >
        <table className="w-full font-mono text-sm numeros">
          <thead>
            <tr className="border-b border-linha text-xs text-texto-2">
              <th className="py-2 text-left font-normal">Habilidade</th>
              <th className="py-2 text-right font-normal">Horas (semana)</th>
              <th className="py-2 text-right font-normal">Variação</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Python", "42h", "12%", "alta"],
              ["Cálculo 1", "31h", "4%", "alta"],
              ["SQL", "18h", "6%", "baixa"],
              ["React", "15h", "2%", "baixa"],
            ].map(([nome, horas, variacao, direcao]) => (
              <tr key={nome} className="border-b border-linha last:border-b-0">
                <td className="py-2.5">{nome}</td>
                <td className="py-2.5 text-right">{horas}</td>
                <td className={`py-2.5 text-right ${direcao === "alta" ? "text-alta" : "text-baixa"}`}>
                  <span className="inline-flex items-center gap-1">
                    <span className="sr-only">{direcao === "alta" ? "Alta de " : "Queda de "}</span>
                    <Icone nome={direcao as "alta" | "baixa"} preenchido tamanho={12} />
                    {variacao}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Secao>

      <Secao numero="12" titulo="Ticker" descricao="Eventos e variações em uma faixa horizontal rolável.">
        <div className="overflow-x-auto border-y border-linha bg-superficie py-2">
          <p className="w-max whitespace-nowrap px-3 font-mono text-xs">
            ORD-0041 Ana ↔ Bruno confirmada · PYTHON ▲12% · ORD-0040 Caio ↔ Duda concluída · SQL ▼6%
          </p>
        </div>
      </Secao>

      <Secao
        numero="13"
        titulo="Nó de match"
        descricao="O hexágono indica conexão: no logo, no avatar e neste nó. Nunca como textura de fundo."
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm">Ana · ensina Python</span>
          <svg viewBox="0 0 40 40" className="h-24 w-24" aria-label="Duas células conectadas">
            <path d={CELULA_A} fill="var(--marca)" />
            <path d={CELULA_B} fill="var(--marca)" />
            <rect x="18" y="25.8" width="4" height="3" fill="var(--marca)" />
          </svg>
          <span className="text-sm">Bruno · ensina Cálculo 1</span>
        </div>
      </Secao>

      <Secao
        numero="14"
        titulo="Interações"
        descricao="Exemplos de avaliação, navegação, feedback e carregamento."
      >
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm text-texto-2">Avaliação · leitura e interativa</p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Estrelas valor={4.6} />
                <span className="font-mono text-sm text-texto-2">4,6 · 12 trocas</span>
              </div>
              <div className="flex items-center gap-3">
                <Estrelas valor={nota} aoMudar={setNota} />
                <span className="font-mono text-sm text-texto-2">
                  {nota ? `${nota} de 5` : "Toque para avaliar"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-texto-2">Folha</p>
            <Botao variante="secundario" onClick={() => setFolhaAberta(true)}>
              Abrir folha
            </Botao>
            <Folha aberta={folhaAberta} aoFechar={() => setFolhaAberta(false)} titulo="Exemplo de folha">
              <div className="space-y-4">
                <p className="text-sm text-texto-2">Ações e detalhes rápidos.</p>
                <Botao onClick={() => setFolhaAberta(false)}>Entendi</Botao>
              </div>
            </Folha>
          </div>
          <div>
            <p className="mb-3 text-sm text-texto-2">Contador e sequência</p>
            <div className="flex items-center gap-4">
              <SeloContador total={3} />
              <SeloContador total={120} />
              <Streak dias={5} postouHoje />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-texto-2">Toque duplo e curtida</p>
            <div className="flex flex-col items-start gap-3">
              <ToqueDuplo aoToqueDuplo={() => setDuplo(true)} className="w-full max-w-sm">
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-cartao border border-linha bg-superficie-2 text-sm text-texto-2">
                  {duplo ? "Curtido" : "Toque duas vezes"}
                </div>
              </ToqueDuplo>
              <BotaoCurtir
                curtido={curtidaExemplo}
                total={12 + Number(curtidaExemplo)}
                aoAlternar={() => setCurtidaExemplo((v) => !v)}
              />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-texto-2">Celebrar</p>
            <Botao variante="secundario" onClick={() => celebrar()}>
              Celebrar
            </Botao>
          </div>
          <div>
            <p className="mb-3 text-sm text-texto-2">Carregando</p>
            <div className="max-w-md">
              <EsqueletoLista itens={1} />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-texto-2">Puxar para atualizar</p>
            <PuxarParaAtualizar aoAtualizar={() => new Promise((r) => setTimeout(r, 900))}>
              <Cartao className="p-4 text-sm text-texto-2">Puxe para baixo no celular</Cartao>
            </PuxarParaAtualizar>
          </div>
          <div>
            <p className="mb-3 text-sm text-texto-2">Aparecer ao rolar</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Primeiro", "Segundo", "Terceiro"].map((t, i) => (
                <Revelar key={t} atraso={i * 90}>
                  <div className="rounded-cartao border border-linha bg-superficie p-4 text-sm text-texto-2">
                    {t} item da lista
                  </div>
                </Revelar>
              ))}
            </div>
          </div>
        </div>
      </Secao>

      <Secao numero="15" titulo="Não pode" descricao="Evite estes padrões em qualquer tela.">
        <ul className="divide-y divide-linha border-y border-linha text-sm">
          {[
            "Padrão de favo de fundo",
            "Avatar com cor pastel aleatória",
            "Pílula em toda etiqueta",
            "Sombra grande e difusa",
            "Gradiente",
            "Emoji como ícone",
            "Ícone decorativo ao lado de todo título",
            "Tudo centralizado",
            "Texto de marketing vago",
          ].map((item) => (
            <li key={item} className="py-2.5">
              {item}
            </li>
          ))}
        </ul>
      </Secao>
    </div>
  );
}
