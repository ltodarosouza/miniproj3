"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CabecalhoAuth, TelaAuth } from "@/components/auth/CabecalhoAuth";
import { CampoDeSenha } from "@/components/auth/CampoDeSenha";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
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
  const [usernameValido, setUsernameValido] = useState(false);

  useEffect(() => {
    if (temToken()) router.replace("/feed");
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
      setUsernameValido(false);
    } else {
      limparErro("username");
      setUsernameValido(PADRAO_USERNAME.test(novo));
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
      router.replace("/perfil/editar#habilidades");
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
        setErroGeral("Não consegui falar com o servidor. Tente de novo em alguns segundos.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAuth>
        <CabecalhoAuth
          titulo="Criar conta"
          descricao="Leva um minuto. Depois você conta o que sabe e o que quer aprender."
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
            dica={
              usernameValido && !erros.username
                ? undefined
                : "De 3 a 30 caracteres: letras sem acento, números e _"
            }
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            placeholder="ana_dev"
            acao={
              usernameValido && !erros.username ? (
                <span aria-label="formato válido" className="text-sucesso">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              ) : undefined
            }
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
              className="border-l-2 border-perigo pl-3 text-sm text-perigo"
            >
              {erroGeral}
            </p>
          )}

          <Botao type="submit" carregando={carregando} className="w-full">
            Criar conta
          </Botao>
        </form>

        <p className="mt-6 border-t border-linha pt-5 text-sm text-texto-2">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-texto underline decoration-linha-forte underline-offset-4 hover:decoration-texto">
            Entrar
          </Link>
        </p>
    </TelaAuth>
  );
}