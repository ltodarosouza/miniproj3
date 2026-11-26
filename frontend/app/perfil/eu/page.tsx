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
      <div className="mx-auto w-full max-w-3xl">
        <p role="alert" className="text-sm text-texto-2">
          {erro}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-12">
      <p role="status" className="text-sm text-texto-3">
        Abrindo sua ficha…
      </p>
    </div>
  );
}
