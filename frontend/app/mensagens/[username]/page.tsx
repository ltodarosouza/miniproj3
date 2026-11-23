"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { BalaoMensagem } from "@/components/mensagens/BalaoMensagem";
import { CaixaMensagem } from "@/components/mensagens/CaixaMensagem";
import { aplicarEntreguesAte, confirmarEnvio, maiorIdRecebido, reconciliarMensagens, type MensagemLocal } from "@/components/mensagens/mensagemLocal";
import { listarConversas, listarMensagens, listarTrocas, type Conversa, type Troca } from "@/lib/api";
import { chaveDoDia, formatarDia } from "@/lib/datas";
import { meuId } from "@/lib/sessao";
import { CartaoTroca } from "@/components/trocas/CartaoTroca";
import { FormAgendarTroca } from "@/components/trocas/FormAgendarTroca";
import { enviarMensagemComId, marcarConversaLida } from "@/lib/mensagens";

type RespostaMensagens = { items: MensagemLocal[]; lidas_ate_id?: number | null; entregues_ate_id?: number | null };

type ItemLinhaDoTempo = { tipo: "mensagem"; mensagem: MensagemLocal } | { tipo: "troca"; troca: Troca };

export default function PaginaConversa() {
  const parametros = useParams<{ username: string }>();
  const username = decodeURIComponent(parametros.username);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<MensagemLocal[]>([]);
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [idsRecentes, setIdsRecentes] = useState<number[]>([]);
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erroInicial, setErroInicial] = useState(false);
  const [semConexao, setSemConexao] = useState(false);
  const [novas, setNovas] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const primeiroCarregamento = useRef(true);
  const ciclosPolling = useRef(0);
  const proximoIdLocal = useRef(-1);
  const pollingEmVoo = useRef(false);
  const cursorRef = useRef(0);
  const mensagensRef = useRef(mensagens);
  const cargaInicialConcluida = useRef(false);
  const trocasRef = useRef(trocas);
  mensagensRef.current = mensagens;
  trocasRef.current = trocas;

  const linhaDoTempo = useMemo<ItemLinhaDoTempo[]>(() => [
    ...mensagens.map((mensagem): ItemLinhaDoTempo => ({ tipo: "mensagem", mensagem })),
    ...trocas.map((troca): ItemLinhaDoTempo => ({ tipo: "troca", troca })),
  ].sort((a, b) => {
    if (a.tipo === "mensagem" && b.tipo === "mensagem") {
      const pendenteA = a.mensagem.idLocal !== undefined && a.mensagem.id < 0;
      const pendenteB = b.mensagem.idLocal !== undefined && b.mensagem.id < 0;
      if (pendenteA !== pendenteB) return pendenteA ? 1 : -1;
      if (pendenteA && pendenteB) return (b.mensagem.idLocal ?? 0) - (a.mensagem.idLocal ?? 0);
    }
    const dataA = a.tipo === "mensagem" ? a.mensagem.em : a.troca.respondida_em ?? a.troca.criada_em;
    const dataB = b.tipo === "mensagem" ? b.mensagem.em : b.troca.respondida_em ?? b.troca.criada_em;
    const diferenca = new Date(dataA).getTime() - new Date(dataB).getTime();
    if (diferenca) return diferenca;
    if (a.tipo !== b.tipo) return a.tipo === "troca" ? 1 : -1;
    return a.tipo === "mensagem" && b.tipo === "mensagem" ? a.mensagem.id - b.mensagem.id : a.tipo === "troca" && b.tipo === "troca" ? a.troca.id - b.troca.id : 0;
  }), [mensagens, trocas]);

  const carregarConversa = useCallback(
    () => Promise.all([listarMensagens(username), listarConversas(), listarTrocas(username)]),
    [username],
  );

  const aplicarCarga = useCallback(
    ([resposta, conversas, trocasCarregadas]: Awaited<ReturnType<typeof carregarConversa>>) => {
      const dados = resposta as RespostaMensagens;
      cursorRef.current = maiorIdRecebido(dados.items, 0);
      setMensagens((atuais) => reconciliarMensagens(atuais.filter((mensagem) => mensagem.id < 0), dados.items));
      setMensagens((atuais) => aplicarEntreguesAte(atuais, dados.entregues_ate_id, username));
      if (dados.lidas_ate_id != null) {
        setMensagens((atuais) => atuais.map((mensagem) => mensagem.de_username !== username && mensagem.id > 0 && mensagem.id <= dados.lidas_ate_id! && !mensagem.lida_em ? { ...mensagem, entregue_em: mensagem.entregue_em ?? mensagem.em, lida_em: new Date().toISOString() } : mensagem));
      }
      setTrocas(trocasCarregadas.items);
      setConversa(conversas.items.find((item) => item.com.username === username) ?? null);
      setSemConexao(false);
      cargaInicialConcluida.current = true;
    },
    [username],
  );

  const rolarAteFim = useCallback((behavior: ScrollBehavior) => {
    const elemento = lista.current;
    if (elemento) elemento.scrollTo({ top: elemento.scrollHeight, behavior });
    setNovas(false);
  }, []);

  useEffect(() => {
    setIdUsuario(meuId());
  }, []);

  useEffect(() => {
    if (idUsuario === null) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    setMensagens([]);
    setTrocas([]);
    setConversa(null);
    setNaoEncontrado(false);
    setErroInicial(false);
    cargaInicialConcluida.current = false;
    cursorRef.current = 0;
    primeiroCarregamento.current = true;
    ciclosPolling.current = 0;
    carregarConversa()
      .then((dados) => {
        if (ativo) aplicarCarga(dados);
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        const detalhe = erro instanceof Error ? erro.message.toLocaleLowerCase("pt-BR") : "";
        if (detalhe.includes("usuário não encontrado")) setNaoEncontrado(true);
        else {
          setSemConexao(true);
          setErroInicial(true);
        }
      })
      .finally(() => {
        if (!ativo) return;
        setCarregando(false);
        requestAnimationFrame(() => {
          if (primeiroCarregamento.current) rolarAteFim("auto");
          primeiroCarregamento.current = false;
        });
      });
    return () => { ativo = false; };
  }, [idUsuario, username, rolarAteFim, carregarConversa, aplicarCarga]);

  const aplicarLidasAte = useCallback((id: number | null | undefined) => {
    if (id == null) return;
    setMensagens((atuais) => {
      const pendente = (mensagem: MensagemLocal) => mensagem.de_username !== username && mensagem.id > 0 && mensagem.id <= id && !mensagem.lida_em;
      if (!atuais.some(pendente)) return atuais;
      const agora = new Date().toISOString();
      return atuais.map((mensagem) => pendente(mensagem) ? { ...mensagem, entregue_em: mensagem.entregue_em ?? mensagem.em, lida_em: agora } : mensagem);
    });
  }, [username]);

  const marcarLidas = useCallback(() => {
    if (document.hidden || !cargaInicialConcluida.current) return;
    void marcarConversaLida(username).then((resposta) => aplicarLidasAte(resposta.lidas_ate_id)).catch(() => {});
  }, [aplicarLidasAte, username]);

  const buscarNovas = useCallback(async () => {
    if (document.hidden || idUsuario === null || pollingEmVoo.current) return;
    pollingEmVoo.current = true;
    ciclosPolling.current += 1;
    const buscarTrocasAgora = ciclosPolling.current % 2 === 0;
    try {
      const [respostaBase, respostaTrocas] = await Promise.all([listarMensagens(username, cursorRef.current), buscarTrocasAgora ? listarTrocas(username) : Promise.resolve(null)]);
      const resposta = respostaBase as RespostaMensagens;
      cursorRef.current = maiorIdRecebido(resposta.items, cursorRef.current);
      setMensagens((atuais) => aplicarEntreguesAte(atuais, resposta.entregues_ate_id, username));
      aplicarLidasAte(resposta.lidas_ate_id);
      const idsTrocasAtuais = new Set(trocasRef.current.map((troca) => troca.id));
      const trocasNovas = respostaTrocas?.items.filter((troca) => !idsTrocasAtuais.has(troca.id)) ?? [];
      if (respostaTrocas) setTrocas(respostaTrocas.items);
      if (!resposta.items.length) {
        setSemConexao(false);
        if (trocasNovas.length) {
          const container = lista.current;
          const pertoDoFim = !container || container.scrollHeight - container.scrollTop - container.clientHeight < 120;
          if (pertoDoFim) requestAnimationFrame(() => rolarAteFim(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"));
          else setNovas(true);
        }
        return;
      }
      const container = lista.current;
      const pertoDoFim = !container || container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      const recebidas = resposta.items;
      const chegaramDoOutro = recebidas.some((mensagem) => mensagem.de_username === username);
      if (chegaramDoOutro) marcarLidas();
      setIdsRecentes(recebidas.filter((mensagem) => mensagem.de_username === username).map((mensagem) => mensagem.id));
      setMensagens((atuais) => reconciliarMensagens(atuais, recebidas));
      setSemConexao(false);
      if (trocasNovas.length) {
        if (pertoDoFim) requestAnimationFrame(() => rolarAteFim(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"));
        else setNovas(true);
      } else if (pertoDoFim || recebidas.some((mensagem) => mensagem.de_username !== username)) {
        requestAnimationFrame(() => rolarAteFim(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"));
      } else {
        setNovas(true);
      }
    } catch {
      setSemConexao(true);
    } finally {
      pollingEmVoo.current = false;
    }
  }, [aplicarLidasAte, idUsuario, marcarLidas, rolarAteFim, username]);

  useEffect(() => {
    if (!carregando && cargaInicialConcluida.current) marcarLidas();
  }, [carregando, marcarLidas]);

  useEffect(() => {
    if (idUsuario === null) return;
    const temporizador = window.setInterval(() => { void buscarNovas(); }, 1500);
    const aoMudarVisibilidade = () => { if (!document.hidden) { marcarLidas(); void buscarNovas(); } };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      window.clearInterval(temporizador);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [buscarNovas, idUsuario, marcarLidas]);

  function aoEnviar(texto: string) {
    const idLocal = proximoIdLocal.current--;
    const clienteId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
    const meuUsername = mensagensRef.current.find((mensagem) => mensagem.de_username !== username)?.de_username
      ?? mensagensRef.current.find((mensagem) => mensagem.para_username !== username)?.para_username
      ?? "";
    const temporaria: MensagemLocal = { id: idLocal, idLocal, cliente_id: clienteId, de_username: meuUsername, para_username: username, texto, em: new Date().toISOString(), estado: "enviando" };
    setMensagens((atuais) => [...atuais, temporaria]);
    requestAnimationFrame(() => rolarAteFim(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"));
    void enviarMensagemComId(username, texto, clienteId).then((enviada) => {
      setMensagens((atuais) => confirmarEnvio(atuais, clienteId, enviada));
    }).catch(() => {
      setMensagens((atuais) => atuais.map((mensagem) => mensagem.idLocal === idLocal && mensagem.id < 0 ? { ...mensagem, estado: "falhou" } : mensagem));
    });
  }

  function tentarEnviarDeNovo(idLocal: number) {
    const mensagem = mensagensRef.current.find((item) => item.idLocal === idLocal);
    if (!mensagem) return;
    setMensagens((atuais) => atuais.map((item) => item.idLocal === idLocal ? { ...item, estado: "enviando" } : item));
    const clienteId = mensagem.cliente_id;
    if (!clienteId) return;
    void enviarMensagemComId(username, mensagem.texto, clienteId).then((enviada) => {
      setMensagens((atuais) => confirmarEnvio(atuais, clienteId, enviada));
    }).catch(() => {
      setMensagens((atuais) => atuais.map((item) => item.idLocal === idLocal && item.id < 0 ? { ...item, estado: "falhou" } : item));
    });
  }

  if (idUsuario === null) {
    return <div className="flex h-full items-center justify-center px-6 text-center"><div className="max-w-sm"><p className="text-texto">Entre na sua conta para ver suas mensagens.</p><Link className="mt-3 inline-block text-sm font-medium text-marca-forte" href="/login">Entrar</Link></div></div>;
  }

  if (naoEncontrado) {
    return <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"><p className="text-lg font-medium text-texto">Não encontramos @{username}</p><Link href="/mensagens" className="text-sm font-medium text-marca-forte">Voltar para as conversas</Link></div>;
  }

  if (erroInicial && mensagens.length === 0) {
    return <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"><p className="max-w-sm text-texto-2">Não conseguimos carregar esta conversa. Confira sua conexão e tente de novo.</p><Botao variante="secundario" onClick={() => { setErroInicial(false); setCarregando(true); void carregarConversa().then(aplicarCarga).catch(() => { setErroInicial(true); setSemConexao(true); }).finally(() => setCarregando(false)); }}>Tentar de novo</Botao></div>;
  }

  const com = conversa?.com;
  const titulo = com?.name || `@${username}`;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-linha px-4">
        <Link href="/mensagens" aria-label="Voltar para as conversas" className="-ml-2 flex size-10 items-center justify-center rounded-full text-texto-2 transition-colors duration-[var(--rapido)] ease-saida hover:bg-superficie-2 hover:text-texto md:hidden"><Icone nome="voltar" tamanho={19} /></Link>
        {com && <Avatar nome={com.name} url={com.avatar_url} />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[0.9375rem] font-semibold text-texto">{titulo}</h1>
          {com && <p className="truncate text-xs text-texto-3">@{username}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Botao variante="secundario" tamanho="sm" aria-label="Agendar troca" onClick={() => setFormAberto(true)}>
            <Icone nome="calendario" tamanho={16} />
            <span className="hidden sm:inline">Agendar troca</span>
          </Botao>
        </div>
      </header>

      <div ref={lista} className="relative flex-1 overflow-y-auto px-4 py-6">
        {semConexao && <p className="sticky top-0 z-10 mb-3 rounded-controle bg-superficie-2 px-3 py-2 text-center text-xs text-texto-2" role="status">Sem conexão, tentando de novo…</p>}
        {carregando ? <p className="py-8 text-center text-sm text-texto-3">Carregando mensagens…</p> : mensagens.length === 0 && trocas.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Avatar nome={titulo} url={com?.avatar_url} tamanho="lg" />
            <h2 className="mt-4 text-lg font-semibold text-texto">Comece a conversa com @{username}</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-texto-2">Contem o que cada um sabe e quer aprender e, quando combinarem, agendem a troca.</p>
            <Botao className="mt-4" variante="secundario" onClick={() => setFormAberto(true)}>Agendar troca</Botao>
          </div>
        ) : (
          <div aria-live="polite" className="mx-auto flex max-w-3xl flex-col">
            {linhaDoTempo.map((item, indice) => {
              if (item.tipo === "troca") {
                return <div key={`troca-${item.troca.id}`} className="my-4"><CartaoTroca troca={item.troca} aoAtualizar={(atualizada) => { setTrocas((atuais) => atuais.map((troca) => troca.id === atualizada.id ? atualizada : troca)); requestAnimationFrame(() => rolarAteFim("smooth")); }} /></div>;
              }
              const mensagem = item.mensagem;
              const anterior = linhaDoTempo[indice - 1];
              const proxima = linhaDoTempo[indice + 1];
              const mensagemAnterior = anterior?.tipo === "mensagem" ? anterior.mensagem : null;
              const mensagemProxima = proxima?.tipo === "mensagem" ? proxima.mensagem : null;
              const ultimaMensagemAntes = linhaDoTempo.slice(0, indice).findLast((anteriorItem) => anteriorItem.tipo === "mensagem");
              const mesmoDia = ultimaMensagemAntes?.tipo === "mensagem" && chaveDoDia(ultimaMensagemAntes.mensagem.em) === chaveDoDia(mensagem.em);
              const agrupada = Boolean(mensagemAnterior && mensagemAnterior.de_username === mensagem.de_username && new Date(mensagem.em).getTime() - new Date(mensagemAnterior.em).getTime() < 5 * 60 * 1000);
              const horaAoFinal = !mensagemProxima || mensagemProxima.de_username !== mensagem.de_username || new Date(mensagemProxima.em).getTime() - new Date(mensagem.em).getTime() >= 5 * 60 * 1000;
              return (
                <div key={`mensagem-${mensagem.cliente_id ?? mensagem.id}`}>
                  {!mesmoDia && <p className="my-5 text-center text-xs text-texto-3">{formatarDia(mensagem.em)}</p>}
                  <BalaoMensagem mensagem={mensagem} minha={mensagem.de_username !== username} mostrarHora={horaAoFinal} agrupadaComAnterior={agrupada} recemChegada={idsRecentes.includes(mensagem.id)} aoTentarDeNovo={tentarEnviarDeNovo} />
                </div>
              );
            })}
          </div>
        )}
        {novas && <div className="sticky bottom-2 flex justify-center"><Botao tamanho="sm" variante="secundario" onClick={() => rolarAteFim("smooth")}>Novas mensagens</Botao></div>}
      </div>
      <CaixaMensagem aoEnviar={aoEnviar} desabilitada={carregando || naoEncontrado} />
      <FormAgendarTroca comUsername={username} comNome={com?.name || username} aberto={formAberto} aoFechar={() => setFormAberto(false)} aoCriar={(troca) => { setTrocas((atuais) => atuais.some((item) => item.id === troca.id) ? atuais : [...atuais, troca]); requestAnimationFrame(() => rolarAteFim("smooth")); }} />
    </div>
  );
}
