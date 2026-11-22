"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { eu, ErroApi } from "@/lib/api";
import { temToken } from "@/lib/sessao";

export default function MeuPerfilPage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!temToken()) {
      router.replace("/login");
      return;
    }

    eu()
      .then((usuario) => {
        router.replace(`/perfil/${encodeURIComponent(usuario.username)}`);
      })
      .catch((err) => {
        if (err instanceof ErroApi && err.status === 401) {
          router.replace("/login");
        } else {
          setErro("não consegui carregar seu perfil. tente de novo.");
        }
      });
  }, [router]);

  if (erro) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p role="alert" className="text-sm text-texto-2">
          {erro}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl items-center justify-center py-12">
      <div className="size-8 animate-spin rounded-full border-2 border-marca border-r-transparent" />
      <span className="sr-only">Carregando seu perfil</span>
    </div>
  );
}
