// Trava a rolagem da página enquanto um visualizador está aberto (decisão 43).
// `overflow: hidden` sozinho não segura o iOS: o body vira `position: fixed`
// deslocado pela rolagem atual, e ao destravar a posição volta exatamente onde estava.
// Contador para aguentar travas sobrepostas; só a última destrava.
let travas = 0;
let posicao = 0;

export function travarRolagem(): () => void {
  if (travas === 0) {
    posicao = window.scrollY;
    const corpo = document.body.style;
    // Sem a barra de rolagem a página alargaria; o padding segura o layout no lugar.
    const barra = window.innerWidth - document.documentElement.clientWidth;
    corpo.position = "fixed";
    corpo.top = `-${posicao}px`;
    corpo.left = "0";
    corpo.right = "0";
    corpo.overflow = "hidden";
    if (barra > 0) corpo.paddingRight = `${barra}px`;
  }
  travas += 1;

  let liberada = false;
  return () => {
    if (liberada) return;
    liberada = true;
    travas -= 1;
    if (travas > 0) return;
    const corpo = document.body.style;
    corpo.position = "";
    corpo.top = "";
    corpo.left = "";
    corpo.right = "";
    corpo.overflow = "";
    corpo.paddingRight = "";
    window.scrollTo({ top: posicao, behavior: "instant" });
  };
}
