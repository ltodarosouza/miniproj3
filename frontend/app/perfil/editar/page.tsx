"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";
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
          setErro("não consegui carregar seu perfil.");
          setCarregando(false);
        }
      });
  }, [router]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil) return;

    setErro(null);
    setSalvando(true);

    const dados: { bio?: string; avatar_url?: string } = {};
    if (bio !== perfil.bio) dados.bio = bio;
    if (avatarUrl !== perfil.avatar_url) dados.avatar_url = avatarUrl;

    try {
      await atualizarPerfil(dados);
      router.replace(`/perfil/${encodeURIComponent(perfil.username)}`);
      router.refresh();
    } catch (err) {
      setErro(
        err instanceof ErroApi
          ? err.message
          : "não consegui salvar. tente de novo.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto flex w-full max-w-xl items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-2 border-marca border-r-transparent" />
        <span className="sr-only">Carregando</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <header>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Editar perfil
        </h1>
      </header>

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

        {erro && (
          <p role="alert" className="text-sm text-perigo">
            {erro}
          </p>
        )}

        <div className="flex gap-3">
          <Botao type="submit" carregando={salvando}>
            Salvar
          </Botao>
          <Botao
            type="button"
            variante="fantasma"
            onClick={() =>
              perfil
                ? router.push(`/perfil/${encodeURIComponent(perfil.username)}`)
                : router.push("/")
            }
          >
            Cancelar
          </Botao>
        </div>
      </form>
    </div>
  );
}
