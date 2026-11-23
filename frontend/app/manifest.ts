import type { MetadataRoute } from "next";

import { NOME_REDE } from "@/lib/marca";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOME_REDE,
    short_name: NOME_REDE,
    description: "Troque o que você sabe pelo que você quer aprender.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#f7fbfa",
    theme_color: "#008879",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
