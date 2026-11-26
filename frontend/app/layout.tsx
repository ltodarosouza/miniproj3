import type { Metadata, Viewport } from "next";
import { Fira_Sans, IBM_Plex_Mono, Literata } from "next/font/google";

import { Navegacao } from "@/components/ui/Navegacao";
import { AvisoAvaliacao } from "@/components/avaliacoes/AvisoAvaliacao";
import { ToastNotificacoes } from "@/components/notificacoes/ToastNotificacoes";
import { NOME_REDE } from "@/lib/marca";
import { SCRIPT_TEMA } from "@/lib/tema";

import "./globals.css";

// Literata (com eixo óptico) nos títulos e no texto dos posts; Fira Sans na interface; Plex Mono só nos números.
const literata = Literata({ subsets: ["latin"], axes: ["opsz"], variable: "--fonte-literata" });
const fira = Fira_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--fonte-fira" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--fonte-plex-mono" });

export const metadata: Metadata = {
  title: NOME_REDE,
  description: "Bolsa de troca de conhecimento entre estudantes: ensine o que você sabe, aprenda o que falta.",
  appleWebApp: { capable: true, title: NOME_REDE, statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icone-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F2" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${literata.variable} ${fira.variable} ${plexMono.variable}`} suppressHydrationWarning>
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
