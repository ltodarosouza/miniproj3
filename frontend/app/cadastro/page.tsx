"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CabecalhoAuth } from "@/components/auth/CabecalhoAuth";
import { CampoDeSenha } from "@/components/auth/CampoDeSenha";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Cartao } from "@/components/ui/Cartao";
import { ErroApi, registrar } from "@/lib/api";
import { entrar } from "@/lib/auth";
import { temToken } from "@/lib/sessao";

const PADRAO_USERNAME = /^[a-z0-9_]{3,30}$/;
const CARACTERE_INVALIDO = /[^a-z0-9_]/;

type Erros = {
  name?: string;
  username?: string;
  password?: string;
  confirmacao?: string;
};

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (temToken()) router.replace("/");
  }, [router]);

  function limparErro(campo: keyof Erros) {
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function aoMudarUsername(valor: string) {
    const novo = valor.toLowerCase();
    setUsername(novo);
    if (CARACTERE_INVALIDO.test(novo)) {
      setErros((atual) => ({
        ...atual,
        username: "use apenas letras sem acento, números ou _",
      }));
    } else {
      limparErro("username");
    }
  }

  function validar(): Erros {
    const novos: Erros = {};

    if (!name.trim()) novos.name = "informe seu nome";
    if (!PADRAO_USERNAME.test(username.trim())) {
      novos.username = "use de 3 a 30 letras sem acento, números ou _";
    }
    if (password.length < 8) {
      novos.password = "a senha deve ter pelo menos 8 caracteres";
    } else if (password.length > 32) {
      novos.password = "a senha deve ter no máximo 32 caracteres";
    } else if (new TextEncoder().encode(password).length > 72) {
      novos.password = "sua senha tem caracteres especiais demais; use menos emojis";
    }
    if (confirmacao !== password) novos.confirmacao = "as senhas não conferem";

    return novos;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErroGeral(null);

    const novos = validar();
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    const dados = {
      username: username.trim().toLowerCase(),
      name: name.trim(),
      password,
    };

    setCarregando(true);
    try {
      await registrar(dados);
      await entrar(dados.username, dados.password);
      router.replace("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ErroApi) {
        if (err.status === 409) {
          setErros({ username: "esse nome de usuário já está em uso" });
        } else if (err.status === 422) {
          setErros({
            name: err.campos.name,
            username: err.campos.username,
            password: err.campos.password,
          });
        } else {
          setErroGeral(err.message);
        }
      } else {
        setErroGeral("não consegui falar com o servidor — ele está rodando?");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-4">
      <Cartao className="w-full max-w-md p-6 sm:p-8">
        <CabecalhoAuth
          titulo="Criar conta"
          descricao="Diga o que você sabe e o que quer aprender. A rede encontra a troca."
        />

        <form onSubmit={enviar} noValidate className="space-y-4">
          <Campo
            rotulo="Nome"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              limparErro("name");
            }}
            erro={erros.name}
            dica="Como você quer aparecer no perfil (pode usar acento e espaço)"
            autoComplete="name"
            maxLength={80}
            placeholder="Ana Maria"
          />

          <Campo
            rotulo="Nome de usuário"
            value={username}
            onChange={(e) => aoMudarUsername(e.target.value)}
            erro={erros.username}
            dica="Use de 3 a 30 letras sem acento, números ou _"
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
              limparErro("password");
            }}
            erro={erros.password}
            dica="De 8 a 32 caracteres"
            autoComplete="new-password"
            maxLength={32}
          />

          <CampoDeSenha
            rotulo="Confirmar senha"
            value={confirmacao}
            onChange={(e) => {
              setConfirmacao(e.target.value);
              limparErro("confirmacao");
            }}
            erro={erros.confirmacao}
            autoComplete="new-password"
            maxLength={32}
          />

          {erroGeral && (
            <p
              role="alert"
              className="rounded-controle bg-superficie-2 px-3 py-2 text-sm text-perigo"
            >
              {erroGeral}
            </p>
          )}

          <Botao type="submit" carregando={carregando} className="w-full">
            Criar conta
          </Botao>
        </form>

        <p className="mt-6 text-center text-sm text-texto-2">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-marca-forte hover:underline">
            Entrar
          </Link>
        </p>
      </Cartao>
    </div>
  );
}
