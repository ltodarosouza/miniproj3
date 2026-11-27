import { apiDelete } from "@/lib/api";

const LADO_MAXIMO_POST = 1600;
export const LADO_MAXIMO_AVATAR = 512;
const LIMITE_BYTES = 2 * 1024 * 1024;

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

function criarCanvas(largura: number, altura: number): OffscreenCanvas | HTMLCanvasElement {
  return typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(largura, altura)
    : Object.assign(document.createElement("canvas"), { width: largura, height: altura });
}

function desenhar(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  origem: CanvasImageSource,
  x: number,
  y: number,
  largura: number,
  altura: number,
): void {
  const contexto = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!contexto) throw new Error("Não foi possível preparar a imagem.");
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(origem, x, y, largura, altura, 0, 0, canvas.width, canvas.height);
}

// Exporta em webp (ou jpeg, se o navegador não fizer webp) baixando a qualidade até caber em 2 MB.
async function exportarDentroDoLimite(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  nomeOriginal: string,
  qualidadeInicial: number,
): Promise<File> {
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

  const nomeSemExtensao = nomeOriginal.replace(/\.[^.]*$/, "");
  const extensao = blob.type === "image/webp" ? ".webp" : ".jpg";
  return new File([blob], `${nomeSemExtensao}${extensao}`, { type: blob.type });
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
    const canvas = criarCanvas(largura, altura);
    desenhar(canvas, bitmap, 0, 0, bitmap.width, bitmap.height);
    return await exportarDentroDoLimite(canvas, arquivo.name, opcoes.qualidade ?? 0.82);
  } finally {
    bitmap.close();
  }
}

/** Área da foto original, em pixels, que vira a foto do post. */
export type AreaRecorte = { x: number; y: number; largura: number; altura: number };

// Recorta a foto já preparada (orientada e com no máximo 1600 px de lado) e exporta
// com o mesmo limite de tamanho e formato das outras fotos de post.
export async function recortarImagem(arquivo: File, area: AreaRecorte): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Não consegui ler essa foto. Tente outra em jpg ou png.");
  }
  try {
    const x = Math.max(0, Math.min(bitmap.width - 1, Math.round(area.x)));
    const y = Math.max(0, Math.min(bitmap.height - 1, Math.round(area.y)));
    const largura = Math.max(1, Math.min(bitmap.width - x, Math.round(area.largura)));
    const altura = Math.max(1, Math.min(bitmap.height - y, Math.round(area.altura)));
    const escala = Math.min(1, LADO_MAXIMO_POST / Math.max(largura, altura));
    const canvas = criarCanvas(
      Math.max(1, Math.round(largura * escala)),
      Math.max(1, Math.round(altura * escala)),
    );
    desenhar(canvas, bitmap, x, y, largura, altura);
    return await exportarDentroDoLimite(canvas, arquivo.name, 0.85);
  } finally {
    bitmap.close();
  }
}

export function removerImagemDoPost(id: number): Promise<void> {
  return apiDelete(`/posts/${id}/imagem`);
}