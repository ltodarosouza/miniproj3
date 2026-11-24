import { apiDelete } from "@/lib/api";

export const LADO_MAXIMO_POST = 1600;
export const LADO_MAXIMO_AVATAR = 512;
export const LIMITE_BYTES = 2 * 1024 * 1024;

type OpcoesPrepararImagem = {
  ladoMaximo?: number;
  qualidade?: number;
};

function exportarCanvas(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  tipo: string,
  qualidade: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: tipo, quality: qualidade });
  }

  const canvasHtml = canvas as HTMLCanvasElement;
  return new Promise((resolver, rejeitar) => {
    canvasHtml.toBlob(
      (blob) => {
        if (blob) resolver(blob);
        else rejeitar(new Error("Não foi possível exportar a imagem."));
      },
      tipo,
      qualidade,
    );
  });
}

export async function prepararImagem(
  arquivo: File,
  opcoes: OpcoesPrepararImagem = {},
): Promise<File> {
  if (arquivo.type && !arquivo.type.startsWith("image/")) {
    throw new Error("Escolha uma foto jpg, png ou webp.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Não consegui ler essa foto. Tente outra em jpg ou png.");
  }

  try {
    const ladoMaximo = opcoes.ladoMaximo ?? LADO_MAXIMO_POST;
    const tiposAceitos = ["image/jpeg", "image/png", "image/webp"];
    if (
      arquivo.type && tiposAceitos.includes(arquivo.type.toLowerCase()) &&
      Math.max(bitmap.width, bitmap.height) <= ladoMaximo &&
      arquivo.size <= LIMITE_BYTES
    ) {
      return arquivo;
    }

    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    const largura = Math.max(1, Math.round(bitmap.width * escala));
    const altura = Math.max(1, Math.round(bitmap.height * escala));
    const canvas: OffscreenCanvas | HTMLCanvasElement =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(largura, altura)
        : Object.assign(document.createElement("canvas"), {
            width: largura,
            height: altura,
          });
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Não foi possível preparar a imagem.");
    contexto.drawImage(bitmap, 0, 0, largura, altura);

    const qualidadeInicial = opcoes.qualidade ?? 0.82;
    const qualidades = [qualidadeInicial, 0.7, 0.6];
    let tipo = "image/webp";
    let blob: Blob | undefined;

    for (let indice = 0; indice < qualidades.length; indice += 1) {
      blob = await exportarCanvas(canvas, tipo, qualidades[indice]);
      if (tipo === "image/webp" && blob.type !== "image/webp") {
        tipo = "image/jpeg";
        blob = await exportarCanvas(canvas, tipo, qualidades[indice]);
      }
      if (blob.size <= LIMITE_BYTES) break;
    }

    if (!blob || blob.size > LIMITE_BYTES) {
      throw new Error("A foto passa de 2 MB mesmo comprimida. Escolha uma menor.");
    }

    const nomeSemExtensao = arquivo.name.replace(/\.[^.]*$/, "");
    const extensao = blob.type === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], `${nomeSemExtensao}${extensao}`, { type: blob.type });
  } finally {
    bitmap.close();
  }
}

export function urlDaApi(caminho: string): string {
  if (/^(http|blob:|data:)/i.test(caminho)) return caminho;
  return `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${caminho}`;
}

export function removerImagemDoPost(id: number): Promise<void> {
  return apiDelete(`/posts/${id}/imagem`);
}
