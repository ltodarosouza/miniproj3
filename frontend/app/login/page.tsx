"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CabecalhoAuth, TelaAuth } from "@/components/auth/CabecalhoAuth";
import { CampoDeSenha } from "@/components/auth/CampoDeSenha";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { ErroApi } from "@/lib/api";
import { entrar } from "@/lib/auth";
import { temToken } from "@/lib/sessao";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (temToken()) router.replace("/feed");
  }, [router]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCampos({});
    setCarregando(true);

    try {
      await entrar(username.trim().toLowerCase(), password);
      router.replace("/feed");
      router.refresh();
    } catch (err) {
      if (err instanceof ErroApi) {
        if (err.status === 401) setErro("Usuário ou senha inválidos.");
        else if (err.status === 422) setCampos(err.campos);
        else setErro(err.message);
      } else {
        setErro("Não consegui falar com o servidor. Tente de novo em alguns segundos.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAuth>
      <CabecalhoAuth
        titulo="Entrar"
        descricao="Use seu nome de usuário e senha."
      />

      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo
          rotulo="Nome de usuário"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value.toLowerCase());
            setCampos((atual) => ({ ...atual, username: "" }));
          }}
          erro={campos.username || undefined}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={30}
          placeholder="ana_dev"
        />

        <CampoDeSenha
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setCampos((atual) => ({ ...atual, password: "" }));
          }}
          erro={campos.password || undefined}
          autoComplete="current-password"
          maxLength={32}
        />

        {erro && (
          <p
            role="alert"
            className="border-l-2 border-perigo pl-3 text-sm text-perigo"
          >
            {erro}
          </p>
        )}

        <Botao type="submit" carregando={carregando} className="w-full">
          Entrar
        </Botao>
      </form>

      <p className="mt-6 border-t border-linha pt-5 text-sm text-texto-2">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-texto underline decoration-linha-forte underline-offset-4 hover:decoration-texto">
          Criar conta
        </Link>
      </p>
    </TelaAuth>
  );
}
