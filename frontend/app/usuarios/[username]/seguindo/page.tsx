"use client";

import { useParams } from "next/navigation";

import { ListaDeConexoes } from "@/components/ListaDeConexoes";

export default function Pagina() {
  const { username } = useParams<{ username: string }>();
  return <ListaDeConexoes username={username} tipo="seguindo" />;
}
