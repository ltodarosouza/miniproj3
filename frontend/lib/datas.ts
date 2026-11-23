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

const DATA_POR_EXTENSO = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const DIA_E_MES = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

export function dataLocal(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

export function resumoDoHorario(data: string, hora: string): string {
  const texto = `${DATA_POR_EXTENSO.format(new Date(`${data}T${hora}`))}, às ${hora}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function quantoFalta(iso: string): string {
  const minutos = Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `daqui a ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `daqui a ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `daqui a ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function dataCompleta(iso: string): string {
  const data = new Date(iso);
  return `${DIA_E_MES.format(data).replace(".", "")} às ${HORA.format(data)}`;
}

export function formatarPreviaTroca(iso: string): string {
  const data = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(data).replace(".", "");
  const hora = HORA.format(data);
  return `📅 Proposta de troca · ${dia} às ${hora}`;
}
