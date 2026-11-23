import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Navegacao } from "@/components/ui/Navegacao";
import { AvisoAvaliacao } from "@/components/avaliacoes/AvisoAvaliacao";
import { ToastNotificacoes } from "@/components/notificacoes/ToastNotificacoes";
import { NOME_REDE } from "@/lib/marca";
import { SCRIPT_TEMA } from "@/lib/tema";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--fonte-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--fonte-geist-mono" });

export const metadata: Metadata = {
  title: NOME_REDE,
  description: "Troque o que você sabe pelo que você quer aprender.",
  appleWebApp: { capable: true, title: NOME_REDE, statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1a1a" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <script dangerouslySetInnerHTML={{ __html: 'try{document.documentElement.dataset.logado=localStorage.getItem("token")?"sim":"nao"}catch(e){}' }} />
      </head>
      <body className="min-h-screen font-sans">
        <Navegacao nomeRede={NOME_REDE} />
        <main className="area-principal">{children}</main>
        <AvisoAvaliacao />
        <ToastNotificacoes />
      </body>
    </html>
  );
}
