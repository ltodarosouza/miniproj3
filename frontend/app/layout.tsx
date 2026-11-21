import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Navegacao } from "@/components/ui/Navegacao";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--fonte-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--fonte-geist-mono" });

const NOME_REDE = "Troca";

export const metadata: Metadata = {
  title: NOME_REDE,
  description: "Troque o que você sabe pelo que você quer aprender.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans">
        <Navegacao nomeRede={NOME_REDE} />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
