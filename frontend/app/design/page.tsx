"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { BotaoCurtir } from "@/components/ui/BotaoCurtir";
import { AreaTexto, Campo } from "@/components/ui/Campo";
import { Cartao } from "@/components/ui/Cartao";
import { Estrelas } from "@/components/ui/Estrelas";
import { Icone } from "@/components/ui/Icone";
import { QuadroArrastavel, type Coluna } from "@/components/ui/QuadroArrastavel";
import { Revelar } from "@/components/ui/Revelar";
import { TagHabilidade } from "@/components/ui/TagHabilidade";

type Habilidade = { id: string; nome: string; nivel: number };

const CORES = [
  { nome: "fundo", classe: "bg-fundo" },
  { nome: "superficie", classe: "bg-superficie" },
  { nome: "superficie-2", classe: "bg-superficie-2" },
  { nome: "linha", classe: "bg-linha" },
  { nome: "texto", classe: "bg-texto" },
  { nome: "texto-2", classe: "bg-texto-2" },
  { nome: "marca", classe: "bg-marca" },
  { nome: "marca-suave", classe: "bg-marca-suave" },
  { nome: "troca", classe: "bg-troca" },
  { nome: "troca-suave", classe: "bg-troca-suave" },
  { nome: "estrela", classe: "bg-estrela" },
  { nome: "perigo", classe: "bg-perigo" },
];

function Secao({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <Revelar>
      <section className="grid gap-5 border-t border-linha pt-10 md:grid-cols-[14rem_1fr] md:gap-10">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-texto">{titulo}</h2>
          <p className="mt-1 text-sm leading-relaxed text-texto-2">{descricao}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </section>
    </Revelar>
  );
}

export default function DesignPage() {
  const [curtido, setCurtido] = useState(false);
  const [nota, setNota] = useState(0);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [colunas, setColunas] = useState<Coluna<Habilidade>[]>([
    {
      id: "sei",
      titulo: "Sei",
      descricao: "O que você pode ensinar",
      itens: [
        { id: "py", nome: "Python", nivel: 3 },
        { id: "git", nome: "Git", nivel: 2 },
      ],
    },
    {
      id: "quero",
      titulo: "Quero aprender",
      descricao: "O que você procura",
      itens: [
        { id: "calc", nome: "Cálculo 1", nivel: 1 },
        { id: "react", nome: "React", nivel: 1 },
        { id: "sql", nome: "SQL", nivel: 1 },
      ],
    },
  ]);

  function mover(itemId: string, de: string, para: string) {
    setColunas((atual) => {
      const item = atual.find((c) => c.id === de)?.itens.find((i) => i.id === itemId);
      if (!item) return atual;
      return atual.map((c) =>
        c.id === de
          ? { ...c, itens: c.itens.filter((i) => i.id !== itemId) }
          : c.id === para
            ? { ...c, itens: [...c.itens, item] }
            : c
      );
    });
  }

  return (
    <div className="space-y-10 pb-24">
      <header className="max-w-2xl">
        <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.025em] text-texto text-balance">
          Guia visual
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-texto-2">
          As peças que todas as telas usam. Passe o mouse, arraste e clique: o movimento faz parte do design. Os dados desta página são fictícios.
        </p>
      </header>

      <Secao titulo="Cores" descricao="Tokens em app/globals.css. Use as classes (bg-marca, text-texto-2...), nunca hex solto. Mudam sozinhas no tema escuro.">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {CORES.map((c) => (
            <div key={c.nome} className="space-y-1.5">
              <div className={`h-14 rounded-controle border border-linha ${c.classe}`} />
              <p className="font-mono text-xs text-texto-2">{c.nome}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Tipografia" descricao="Geist para tudo; Geist Mono só para números de tempo e código. Pesos 400, 500 e 600.">
        <div className="space-y-3">
          <p className="text-[2rem] leading-tight font-semibold tracking-[-0.025em]">Título de página</p>
          <p className="text-lg font-semibold tracking-tight">Título de seção</p>
          <p className="max-w-[65ch] text-[0.9375rem] leading-relaxed text-texto">
            Texto de post. Hoje finalmente entendi recursão desenhando a pilha de chamadas no papel. Alguém troca uma explicação de Cálculo 1 por uma de Python?
          </p>
          <p className="text-sm text-texto-2">Texto secundário, metadados e legendas</p>
          <p className="numeros font-mono text-sm text-texto-2">2h 30min · 14 dias seguidos</p>
        </div>
      </Secao>

      <Secao titulo="Botões" descricao="Primário para a ação principal da tela (uma por tela). Troca só para propor troca. Magnético nos CTAs grandes.">
        <div className="flex flex-wrap items-center gap-3">
          <Botao magnetico>Publicar</Botao>
          <Botao variante="troca" magnetico>
            <Icone nome="troca" tamanho={18} />
            Propor troca
          </Botao>
          <Botao variante="secundario">Seguir</Botao>
          <Botao variante="fantasma">Cancelar</Botao>
          <Botao carregando>Salvando</Botao>
          <Botao disabled>Desabilitado</Botao>
          <Botao tamanho="sm" variante="secundario">
            <Icone nome="mais" tamanho={16} />
            Pequeno
          </Botao>
        </div>
      </Secao>

      <Secao titulo="Campos" descricao="Rótulo sempre visível em cima, dica ou erro embaixo. Erro diz o problema e como resolver.">
        <div className="grid max-w-xl gap-4">
          <Campo rotulo="Usuário" placeholder="ana_dev" dica="Letras minúsculas, números e _" />
          <Campo rotulo="Senha" type="password" defaultValue="123" erro="A senha precisa de pelo menos 8 caracteres." />
          <Campo
            rotulo="Senha com ação"
            type={senhaVisivel ? "text" : "password"}
            defaultValue="senha-forte-123"
            dica="De 8 a 32 caracteres"
            acao={
              <button
                type="button"
                onClick={() => setSenhaVisivel((atual) => !atual)}
                aria-pressed={senhaVisivel}
                className="rounded-controle px-2 py-1 text-sm font-medium text-texto-2 transition-colors hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
              >
                {senhaVisivel ? "Ocultar" : "Mostrar"}
              </button>
            }
          />
          <AreaTexto rotulo="O que você estudou hoje?" placeholder="Conte sua rotina de estudos..." />
        </div>
      </Secao>

      <Secao titulo="Habilidades" descricao="Cheia = sei. Tracejada = quero aprender. Laranja = a habilidade que fecha um match de troca. Os pontinhos são o nível (1 a 5), só informativo.">
        <div className="flex flex-wrap gap-2">
          <TagHabilidade nome="Python" tipo="sei" nivel={4} />
          <TagHabilidade nome="Git" tipo="sei" nivel={2} />
          <TagHabilidade nome="Cálculo 1" tipo="quero_aprender" />
          <TagHabilidade nome="React" tipo="sei" nivel={3} destaque />
          <TagHabilidade nome="Estrutura de Dados" />
        </div>
      </Secao>

      <Secao titulo="Arrastar" descricao="QuadroArrastavel: o item segue o mouse, inclina com a velocidade e assenta com mola. Pelo teclado, Enter manda para a outra coluna.">
        <QuadroArrastavel
          colunas={colunas}
          aoMover={mover}
          renderItem={(item, coluna) => (
            <TagHabilidade nome={item.nome} tipo={coluna === "sei" ? "sei" : "quero_aprender"} nivel={coluna === "sei" ? item.nivel : undefined} />
          )}
        />
      </Secao>

      <Secao titulo="Avaliação" descricao="Estrelas só leitura no perfil; interativas no fim da troca, acendendo em sequência.">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-2">
            <Estrelas valor={4.6} />
            <span className="numeros text-sm text-texto-2">4,6 · 12 trocas</span>
          </div>
          <div className="flex items-center gap-3">
            <Estrelas valor={nota} aoMudar={setNota} />
            <span className="numeros text-sm text-texto-2">{nota ? `${nota} de 5` : "Toque para avaliar"}</span>
          </div>
        </div>
      </Secao>

      <Secao titulo="Avatares" descricao="Sem foto, mostra as iniciais numa cor estável derivada do nome.">
        <div className="flex items-center gap-3">
          <Avatar nome="Ana Souza" tamanho="lg" />
          <Avatar nome="Bia Lima" online />
          <Avatar nome="Caio Melo" />
          <Avatar nome="Duda Reis" tamanho="sm" />
        </div>
      </Secao>

      <Secao titulo="Cartões" descricao="Cartao interativo tem holofote que segue o mouse e sobe levemente. Use para posts e matches, nunca um cartão dentro de outro.">
        <div className="grid gap-4">
          <Cartao interativo className="p-4">
            <div className="flex items-start gap-3">
              <Avatar nome="Bia Lima" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-texto">Bia Lima</span>
                  <span className="text-sm text-texto-3">@bia · há 2 h</span>
                </div>
                <p className="mt-1.5 max-w-[65ch] text-[0.9375rem] leading-relaxed">
                  Terminei a lista de limites. O truque foi parar de decorar e desenhar o gráfico antes de calcular.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <TagHabilidade nome="Cálculo 1" tipo="sei" />
                  <span className="numeros inline-flex items-center gap-1 font-mono text-[0.8125rem] text-texto-2">
                    <Icone nome="relogio" tamanho={15} />
                    1h 45min
                  </span>
                </div>
                <div className="mt-2 -ml-2.5 flex items-center gap-1">
                  <BotaoCurtir curtido={curtido} total={curtido ? 8 : 7} aoAlternar={() => setCurtido((c) => !c)} />
                  <button className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm text-texto-3 transition-colors hover:bg-superficie-2 hover:text-texto">
                    <Icone nome="comentario" tamanho={18} />
                    <span className="numeros">3</span>
                  </button>
                </div>
              </div>
            </div>
          </Cartao>

          <Cartao interativo className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar nome="Caio Melo" tamanho="lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Caio Melo</span>
                  <span className="rounded-full bg-troca-suave px-2 py-0.5 text-xs font-semibold text-texto">Match de troca</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-texto-2">
                  Te ensina <TagHabilidade nome="React" tipo="sei" nivel={3} destaque />
                  você ensina <TagHabilidade nome="Python" tipo="sei" nivel={4} />
                </div>
              </div>
              <Botao variante="troca" magnetico>
                <Icone nome="mensagem" tamanho={18} />
                Conversar
              </Botao>
            </div>
          </Cartao>
        </div>
      </Secao>

      <Secao titulo="Aparecer ao rolar" descricao="Envolva blocos em <Revelar>: surgem com leve subida e desfoque quando entram na tela. Use atraso para escalonar listas.">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Primeiro", "Segundo", "Terceiro"].map((t, i) => (
            <Revelar key={t} atraso={i * 90}>
              <div className="rounded-cartao border border-linha bg-superficie p-4 text-sm text-texto-2">{t} item da lista</div>
            </Revelar>
          ))}
        </div>
      </Secao>
    </div>
  );
}
