"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { AreaTexto, Campo, Selecao } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { ErroApi } from "@/lib/api";
import { prepararImagem } from "@/lib/imagens";
import {
  criarPost,
  enviarImagem,
  formatarTempoEstudado,
  habilidadesAgrupadas,
  LIMITE_MINUTOS,
  LIMITE_TEXTO_POST,
  validarImagem,
  type HabilidadesAgrupadas,
  type Post,
} from "@/lib/posts";

export function FormNovoPost({
  aoPublicar,
}: {
  aoPublicar: (post: Post) => void;
}) {
  const [texto, setTexto] = useState("");
  const [habilidadeId, setHabilidadeId] = useState("");
  const [minutos, setMinutos] = useState("");
  const [grupos, setGrupos] = useState<HabilidadesAgrupadas | null>(null);
  const [habilidadesCarregadas, setHabilidadesCarregadas] = useState(false);
  const [erroHabilidades, setErroHabilidades] = useState("");
  const [erroMinutos, setErroMinutos] = useState("");
  const [erroFoto, setErroFoto] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const [avisoFoto, setAvisoFoto] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [urlPrevia, setUrlPrevia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const [postFotoPendente, setPostFotoPendente] = useState<Post | null>(null);
  const [reenviandoFoto, setReenviandoFoto] = useState(false);
  const [aberto, setAberto] = useState(false);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const urlAtual = useRef("");
  const envioAtivo = useRef(false);
  const selecaoFotoAtual = useRef(0);

  useEffect(() => {
    let ativo = true;
    void habilidadesAgrupadas()
      .then((resultado) => {
        if (ativo) {
          setGrupos(resultado);
          setHabilidadesCarregadas(true);
        }
      })
      .catch(() => {
        if (ativo) {
          setErroHabilidades(
            "Não consegui carregar as habilidades. Você pode publicar sem habilidade.",
          );
          setHabilidadesCarregadas(true);
        }
      });
    return () => {
      ativo = false;
      selecaoFotoAtual.current += 1;
      if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
      urlAtual.current = "";
    };
  }, []);

  function removerFotoEscolhida() {
    // Durante um envio a foto não pode sumir: se falhar, é ela que será reenviada.
    if (enviando || reenviandoFoto) return;
    limparFoto();
  }

  function limparFoto() {
    selecaoFotoAtual.current += 1;
    setPreparandoFoto(false);
    if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
    urlAtual.current = "";
    setUrlPrevia("");
    setFoto(null);
    setErroFoto("");
    if (entradaFoto.current) entradaFoto.current.value = "";
  }

  async function escolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    if (enviando || reenviandoFoto) return;
    const arquivo = evento.target.files?.[0] ?? null;
    evento.target.value = "";
    const selecao = ++selecaoFotoAtual.current;
    setErroFoto("");
    if (!arquivo) return;
    setPreparandoFoto(true);
    try {
      const imagem = await prepararImagem(arquivo);
      if (selecao !== selecaoFotoAtual.current) return;
      const mensagem = validarImagem(imagem);
      if (mensagem) {
        setErroFoto(mensagem);
        return;
      }
      if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
      const url = URL.createObjectURL(imagem);
      urlAtual.current = url;
      setUrlPrevia(url);
      setFoto(imagem);
    } catch (erro) {
      if (selecao === selecaoFotoAtual.current) {
        setErroFoto(erro instanceof Error ? erro.message : "Não consegui preparar essa foto.");
      }
    } finally {
      if (selecao === selecaoFotoAtual.current) setPreparandoFoto(false);
    }
  }

  async function tentarEnviarFotoNovamente() {
    if (!postFotoPendente || !foto || preparandoFoto || reenviandoFoto) return;
    const arquivo = foto;
    setReenviandoFoto(true);
    try {
      const imagem_url = await enviarImagem(postFotoPendente.id, arquivo);
      aoPublicar({ ...postFotoPendente, imagem_url });
      concluirPublicacao();
    } catch (erro) {
      setAvisoFoto(
        `Seu post foi publicado, mas a foto não subiu: ${erro instanceof ErroApi ? erro.message : "tente de novo mais tarde."}`,
      );
    } finally {
      setReenviandoFoto(false);
    }
  }

  function concluirPublicacao() {
    setPostFotoPendente(null);
    setAvisoFoto("");
    setAberto(false);
    setTexto("");
    setHabilidadeId("");
    setMinutos("");
    limparFoto();
  }

  function seguirSemFoto() {
    if (!postFotoPendente || preparandoFoto || reenviandoFoto) return;
    aoPublicar(postFotoPendente);
    concluirPublicacao();
  }

  function alterarMinutos(valor: string) {
    setMinutos(valor);
    if (!valor) {
      setErroMinutos("");
      return;
    }
    const numero = Number(valor);
    setErroMinutos(
      Number.isInteger(numero) && numero >= 1 && numero <= LIMITE_MINUTOS
        ? ""
        : "Informe um número inteiro entre 1 e 1440.",
    );
  }

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (envioAtivo.current || preparandoFoto || postFotoPendente) return;
    const textoLimpo = texto.trim();
    const numeroMinutos = minutos ? Number(minutos) : null;
    const minutosInvalidos =
      numeroMinutos !== null &&
      (!Number.isInteger(numeroMinutos) ||
        numeroMinutos < 1 ||
        numeroMinutos > LIMITE_MINUTOS);
    setErroMinutos(
      minutosInvalidos ? "Informe um número inteiro entre 1 e 1440." : "",
    );
    if (!textoLimpo || minutosInvalidos) return;
    envioAtivo.current = true;
    setEnviando(true);
    setErroEnvio("");
    setAvisoFoto("");
    try {
      const post = await criarPost({
        texto: textoLimpo,
        habilidade_id: habilidadeId ? Number(habilidadeId) : null,
        minutos_estudados: numeroMinutos,
      });
      let final = post;
      if (foto) {
        try {
          final = { ...post, imagem_url: await enviarImagem(post.id, foto) };
        } catch (erro) {
          setPostFotoPendente(post);
          setAvisoFoto(
            `Seu post foi publicado, mas a foto não subiu: ${erro instanceof ErroApi ? erro.message : "tente de novo mais tarde."}`,
          );
          return;
        }
      }
      aoPublicar(final);
      concluirPublicacao();
    } catch (erro) {
      setErroEnvio(
        erro instanceof ErroApi
          ? erro.message
          : "Não consegui publicar seu post. Tente de novo.",
      );
    } finally {
      envioAtivo.current = false;
      setEnviando(false);
    }
  }

  const minutosValidos = minutos && !erroMinutos ? Number(minutos) : null;

  return (
    <div className="rounded-cartao border border-linha bg-superficie p-4">
      <form
        onSubmit={publicar}
        onFocus={() => setAberto(true)}
        className="space-y-4"
      >
        <AreaTexto
          rotulo="O que você estudou hoje?"
          required
          maxLength={LIMITE_TEXTO_POST}
          placeholder="Conte um pouco sobre seus estudos..."
          value={texto}
          disabled={Boolean(postFotoPendente)}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setAvisoFoto("");
          }}
        />
        {texto.length >= LIMITE_TEXTO_POST - 100 && (
          <p className="text-right text-xs text-texto-3">
            <span className="numeros">{texto.length}/{LIMITE_TEXTO_POST}</span>
          </p>
        )}
        {(aberto || foto) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Selecao
              rotulo="Habilidade"
              value={habilidadeId}
              onChange={(evento) => setHabilidadeId(evento.target.value)}
              disabled={!habilidadesCarregadas || Boolean(postFotoPendente)}
              erro={erroHabilidades || undefined}
            >
              {!habilidadesCarregadas ? (
                <option value="">Carregando habilidades...</option>
              ) : (
                <>
                  <option value="">Sem habilidade</option>
                  <optgroup label="Tecnologia">
                    {grupos?.tecnologia.map((habilidade) => (
                      <option key={habilidade.id} value={habilidade.id}>
                        {habilidade.nome}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Disciplinas">
                    {grupos?.disciplinas.map((habilidade) => (
                      <option key={habilidade.id} value={habilidade.id}>
                        {habilidade.nome}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </Selecao>
            <Campo
              type="number"
              rotulo="Tempo estudado (min)"
              min={1}
              max={LIMITE_MINUTOS}
              inputMode="numeric"
              value={minutos}
              onChange={(evento) => alterarMinutos(evento.target.value)}
              disabled={Boolean(postFotoPendente)}
              erro={erroMinutos || undefined}
              dica={
                minutosValidos
                  ? `${formatarTempoEstudado(minutosValidos)} de estudo`
                  : undefined
              }
            />
          </div>
        )}
        <div className="space-y-2">
          {urlPrevia && (
            <div className="relative">
              <img
                src={urlPrevia}
                alt="Prévia da foto"
                className="max-h-64 w-full rounded-controle object-cover ring-1 ring-linha"
              />
              <button
                type="button"
                onClick={removerFotoEscolhida}
                disabled={enviando || reenviandoFoto}
                aria-label="Remover foto"
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-controle bg-superficie text-texto ring-1 ring-linha transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none"
              >
                <Icone nome="fechar" tamanho={16} />
              </button>
            </div>
          )}
          <input
            ref={entradaFoto}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={escolherFoto}
          />
          <div className="flex items-center justify-between gap-3">
            <Botao
              type="button"
              variante="fantasma"
              tamanho="sm"
              disabled={preparandoFoto || enviando || reenviandoFoto}
              onClick={() => entradaFoto.current?.click()}
            >
              <Icone nome="imagem" tamanho={17} />
              {preparandoFoto ? "Preparando foto…" : foto ? "Trocar foto" : "Adicionar foto"}
            </Botao>
            <Botao
              type="submit"
              magnetico
              carregando={enviando}
              disabled={!texto.trim() || preparandoFoto || Boolean(postFotoPendente)}
            >
              Registrar estudo
            </Botao>
          </div>
          {erroFoto && (
            <p role="alert" className="text-sm text-perigo">
              {erroFoto}
            </p>
          )}
          {erroEnvio && (
            <p role="alert" className="text-sm text-perigo">
              {erroEnvio}
            </p>
          )}
          {avisoFoto && (
            <div>
              <p role="alert" className="text-sm text-perigo">{avisoFoto}</p>
              {postFotoPendente && foto && (
                <Botao type="button" variante="fantasma" tamanho="sm" disabled={preparandoFoto || reenviandoFoto} carregando={reenviandoFoto} onClick={tentarEnviarFotoNovamente}>
                  Tentar enviar a foto de novo
                </Botao>
              )}
              {postFotoPendente && (
                <Botao type="button" variante="fantasma" tamanho="sm" disabled={preparandoFoto || reenviandoFoto} onClick={seguirSemFoto}>
                  Seguir sem foto
                </Botao>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
