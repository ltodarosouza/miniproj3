"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EditorHabilidades } from "@/components/perfil/EditorHabilidades";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Avatar } from "@/components/ui/Avatar";
import { AreaTexto } from "@/components/ui/Campo";
import { ErroApi, eu } from "@/lib/api";
import { atualizarPerfil, buscarPerfil, enviarAvatar, removerAvatar, type Perfil } from "@/lib/perfil";
import { LADO_MAXIMO_AVATAR, prepararImagem } from "@/lib/imagens";
import { prefereMenosMovimento } from "@/lib/movimento";
import { temToken } from "@/lib/sessao";

export default function EditarPerfilPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alterandoFoto, setAlterandoFoto] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);
  const avatarUrlAtual = useRef(avatarUrl);
  const operacaoFoto = useRef(0);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!temToken()) {
      router.replace("/login");
      return;
    }

    eu()
      .then((usuario) => buscarPerfil(usuario.username))
      .then((p) => {
        setPerfil(p);
        setBio(p.bio);
        setAvatarUrl(p.avatar_url);
        avatarUrlAtual.current = p.avatar_url;
        setCarregando(false);
      })
      .catch((err) => {
        if (err instanceof ErroApi && err.status === 401) {
          router.replace("/login");
        } else {
          setErro("Não consegui carregar seu perfil.");
          setCarregando(false);
        }
      });
  }, [router]);

  useEffect(() => {
    if (carregando || window.location.hash !== "#habilidades") return;
    const behavior = prefereMenosMovimento() ? "auto" : "smooth";
    document.getElementById("habilidades")?.scrollIntoView({ behavior, block: "start" });
  }, [carregando]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil) return;

    setErro(null);
    setSalvo(false);
    setSalvando(true);

    const dados: { bio?: string } = {};
    if (bio !== perfil.bio) dados.bio = bio;

    try {
      const atualizado = await atualizarPerfil(dados);
      setPerfil({ ...atualizado, avatar_url: avatarUrlAtual.current });
      setBio(atualizado.bio);
      setSalvo(true);
    } catch (err) {
      setErro(
        err instanceof ErroApi ? err.message : "Não consegui salvar. Tente de novo.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const operacao = ++operacaoFoto.current;
    setErro(null);
    setAlterandoFoto(true);
    try {
      const preparada = await prepararImagem(arquivo, { ladoMaximo: LADO_MAXIMO_AVATAR });
      const url = await enviarAvatar(preparada);
      if (operacao === operacaoFoto.current) {
        avatarUrlAtual.current = url;
        setAvatarUrl(url);
      }
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : err instanceof Error ? err.message : "Não consegui enviar a foto.");
    } finally {
      e.target.value = "";
      setAlterandoFoto(false);
    }
  }

  async function apagarFoto() {
    const operacao = ++operacaoFoto.current;
    setErro(null);
    setAlterandoFoto(true);
    try {
      await removerAvatar();
      if (operacao === operacaoFoto.current) {
        avatarUrlAtual.current = "";
        setAvatarUrl("");
      }
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : err instanceof Error ? err.message : "Não consegui remover a foto.");
    } finally {
      setAlterandoFoto(false);
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4" aria-label="Carregando seu perfil">
        <div className="h-48 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
        <div className="h-64 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
      </div>
    );
  }

  if (erro && !perfil) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-3">
        <p role="alert" className="text-sm text-perigo">{erro}</p>
        <Botao variante="secundario" tamanho="sm" onClick={() => window.location.reload()}>
          Tentar de novo
        </Botao>
      </div>
    );
  }

  if (!perfil) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <header>
        <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-0.025em] text-texto">
          Editar perfil
        </h1>
        <p className="mt-1 text-sm text-texto-2">Conte quem você é e o que quer trocar.</p>
      </header>

      <section aria-labelledby="titulo-sobre" className="space-y-5 border-t border-linha pt-4">
        <h2 id="titulo-sobre" className="text-[0.8125rem] text-texto-3 font-semibold">
          <span className="font-mono font-medium text-texto-2 numeros">01</span> · Sobre você
        </h2>
        <form onSubmit={enviar} className="space-y-5">
          <AreaTexto
            rotulo="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            placeholder="Conte um pouco sobre você e o que quer aprender..."
            dica="Máximo de 280 caracteres"
          />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-texto">Foto de perfil</h3>
            <div className="flex items-center gap-4">
              <span className="shrink-0 *:size-20! *:text-2xl!">
                <Avatar tamanho="lg" nome={perfil.name} url={avatarUrl} />
              </span>
              <div className="flex flex-wrap gap-3">
                <input ref={inputFoto} type="file" accept="image/*" className="sr-only" onChange={escolherFoto} />
                <Botao type="button" variante="secundario" disabled={alterandoFoto} onClick={() => inputFoto.current?.click()}>
                  {avatarUrl ? "Trocar foto" : "Escolher foto"}
                </Botao>
                {avatarUrl && <Botao type="button" variante="fantasma" disabled={alterandoFoto} onClick={apagarFoto}>Remover foto</Botao>}
              </div>
            </div>
            <p className="text-sm text-texto-2">JPG, PNG ou WebP. A gente reduz o tamanho automaticamente.</p>
            {alterandoFoto && <p role="status" className="text-sm text-texto-2">Enviando foto…</p>}
            {erro && <p role="alert" className="text-sm text-perigo">{erro}</p>}
          </div>
          {salvo && <p role="status" className="text-sm text-sucesso">Perfil salvo.</p>}
          <div className="flex flex-wrap gap-3">
            <Botao type="submit" variante="secundario" carregando={salvando}>Salvar perfil</Botao>
            <BotaoLink href={`/perfil/${encodeURIComponent(perfil.username)}`} variante="fantasma">
              Ver meu perfil
            </BotaoLink>
          </div>
        </form>
      </section>

      <section id="habilidades" aria-labelledby="titulo-habilidades" className="scroll-mt-20 space-y-5 border-t border-linha pt-4">
        <div>
          <h2 id="titulo-habilidades" className="text-[0.8125rem] text-texto-3 font-semibold">
            <span className="font-mono font-medium text-texto-2 numeros">02</span> · Habilidades
          </h2>
          <p className="mt-1 text-sm text-texto-2">É daqui que saem seus matches.</p>
        </div>
        <EditorHabilidades iniciais={perfil.habilidades} />
      </section>
    </div>
  );
}
