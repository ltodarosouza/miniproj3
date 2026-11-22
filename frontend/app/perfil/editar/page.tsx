"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EditorHabilidades } from "@/components/perfil/EditorHabilidades";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { AreaTexto, Campo } from "@/components/ui/Campo";
import { ErroApi, eu } from "@/lib/api";
import { atualizarPerfil, buscarPerfil, type Perfil } from "@/lib/perfil";
import { temToken } from "@/lib/sessao";

export default function EditarPerfilPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
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
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    document.getElementById("habilidades")?.scrollIntoView({ behavior, block: "start" });
  }, [carregando]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil) return;

    setErro(null);
    setSalvo(false);
    setSalvando(true);

    const dados: { bio?: string; avatar_url?: string } = {};
    if (bio !== perfil.bio) dados.bio = bio;
    if (avatarUrl !== perfil.avatar_url) dados.avatar_url = avatarUrl;

    try {
      const atualizado = await atualizarPerfil(dados);
      setPerfil(atualizado);
      setBio(atualizado.bio);
      setAvatarUrl(atualizado.avatar_url);
      setSalvo(true);
    } catch (err) {
      setErro(
        err instanceof ErroApi ? err.message : "Não consegui salvar. Tente de novo.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4" aria-label="Carregando seu perfil">
        <div className="h-48 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none" />
        <div className="h-64 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none" />
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
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <header>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Editar perfil
        </h1>
        <p className="mt-1 text-sm text-texto-2">Conte quem você é e o que quer trocar.</p>
      </header>

      <section aria-labelledby="titulo-sobre">
        <Cartao className="space-y-5 p-5">
          <h2 id="titulo-sobre" className="text-lg font-semibold tracking-tight text-texto">
            Sobre você
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
            <Campo
              rotulo="URL do avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              dica="Imagem quadrada, preferencialmente 400×400"
            />
            {erro && <p role="alert" className="text-sm text-perigo">{erro}</p>}
            {salvo && <p role="status" className="text-sm text-sucesso">Perfil salvo.</p>}
            <div className="flex flex-wrap gap-3">
              <Botao type="submit" carregando={salvando}>Salvar perfil</Botao>
              <BotaoLink href={`/perfil/${encodeURIComponent(perfil.username)}`} variante="fantasma">
                Ver meu perfil
              </BotaoLink>
            </div>
          </form>
        </Cartao>
      </section>

      <section id="habilidades" aria-labelledby="titulo-habilidades" className="scroll-mt-20">
        <Cartao className="space-y-5 p-5">
          <div>
            <h2 id="titulo-habilidades" className="text-lg font-semibold tracking-tight text-texto">
              Habilidades
            </h2>
            <p className="text-sm text-texto-2">É daqui que saem seus matches.</p>
          </div>
          <EditorHabilidades iniciais={perfil.habilidades} />
        </Cartao>
      </section>
    </div>
  );
}
