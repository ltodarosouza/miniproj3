import { eu, login, type User } from "@/lib/api";
import { limparSessao, salvarToken, salvarUsuarioId } from "@/lib/sessao";

export async function entrar(username: string, password: string): Promise<User> {
  const { token } = await login({ username, password });
  salvarToken(token);

  try {
    const usuario = await eu();
    salvarUsuarioId(usuario.id);
    return usuario;
  } catch (erro) {
    limparSessao();
    throw erro;
  }
}
