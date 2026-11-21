"use client";
// ↑ este arquivo usa useState/useEffect → precisa ser client component.
// Esquecer essa linha é o erro nº 1 do primeiro form (ver guia 04).

// Slice de exemplo COMPLETO: listagem (GET) + criação (POST) + atualização da
// lista. Toda feature sua imita este caminho: lib/api.ts → estado → render.

import { useCallback, useEffect, useState } from "react";

import { UserCard } from "@/components/UserCard";
import { apiGet, apiPost, type Page, type User } from "@/lib/api";

export default function UsuariosPage() {
  const [pagina, setPagina] = useState<Page<User> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // form controlado
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setPagina(await apiGet<Page<User>>("/usuarios?offset=0&limit=20"));
      setErro(null);
    } catch {
      setErro(
        "não consegui falar com o backend — ele está rodando? (make dev-back; ver guia 04)"
      );
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await apiPost<User>("/usuarios", { username, name });
      setUsername("");
      setName("");
      await carregar(); // recarrega a lista — o POST precisa aparecer na UI
    } catch (err) {
      setErro(err instanceof Error ? err.message : "erro ao criar usuário");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usuários</h1>

      <form onSubmit={criar} className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3">
        <label className="flex flex-col text-sm">
          username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[a-z0-9_]{3,30}"
            title="3–30 caracteres: letras minúsculas, números e _"
            required
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            className="rounded border px-2 py-1"
          />
        </label>
        <button
          type="submit"
          disabled={salvando}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {salvando ? "criando..." : "criar usuário"}
        </button>
      </form>

      {erro && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

      {pagina && (
        <>
          <ul className="space-y-2">
            {pagina.items.map((u) => (
              <li key={u.id}>
                <UserCard user={u} />
              </li>
            ))}
          </ul>
          <p className="text-sm text-zinc-500">
            mostrando {pagina.items.length} de {pagina.total}
          </p>
        </>
      )}
    </div>
  );
}
