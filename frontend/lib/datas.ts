const HORA = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const DIA_LONGO = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatarHora(iso: string): string {
  return HORA.format(new Date(iso));
}

export function formatarQuando(iso: string): string {
  const data = new Date(iso);
  const hoje = new Date();
  if (mesmoDia(data, hoje)) return HORA.format(data);
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (mesmoDia(data, ontem)) return "ontem";
  return DIA_CURTO.format(data).replace(".", "");
}

export function formatarDia(iso: string): string {
  const data = new Date(iso);
  const hoje = new Date();
  if (mesmoDia(data, hoje)) return "Hoje";
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (mesmoDia(data, ontem)) return "Ontem";
  const texto = DIA_LONGO.format(data);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  const texto = `${DIA_LONGO.format(data)}, ${HORA.format(data)}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function chaveDoDia(iso: string): string {
  const data = new Date(iso);
  return `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
}

export function localParaIsoUtc(data: string, hora: string): string {
  return new Date(`${data}T${hora}`).toISOString();
}

export function jaPassou(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

export function formatarPreviaTroca(iso: string): string {
  const data = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(data).replace(".", "");
  const hora = HORA.format(data);
  return `📅 Proposta de troca · ${dia} às ${hora}`;
}
