import type { MetadataRoute } from "next";

import { NOME_REDE } from "@/lib/marca";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOME_REDE,
    short_name: NOME_REDE,
    description: "Bolsa de troca de conhecimento entre estudantes: ensine o que você sabe, aprenda o que falta.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#F7F6F2",
    theme_color: "#1B1A17",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
