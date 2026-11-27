// Demo do Colmatch (46 s). desenhar(t) é função pura do tempo: o player chama em tempo real
// e o render.py chama quadro a quadro com window.demo.seek(t).
(() => {
  "use strict";

  const DURACAO = 46;
  const FPS = 60;
  const ESCALA = 1.2; // viewport das capturas (1600×900) → palco (1920×1080)
  const W = 1920;
  const H = 1080;

  // ---------- utilitários ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, de, dur) => (dur <= 0 ? (t >= de ? 1 : 0) : clamp((t - de) / dur));

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const x = (s) => ((ax * s + bx) * s + cx) * s;
    const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
    const y = (s) => ((ay * s + by) * s + cy) * s;
    return (p) => {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      let s = p;
      for (let i = 0; i < 8; i++) {
        const d = dx(s);
        if (Math.abs(d) < 1e-6) break;
        s -= (x(s) - p) / d;
      }
      let a = 0, b = 1;
      for (let i = 0; i < 30 && Math.abs(x(s) - p) > 1e-6; i++) {
        if (x(s) < p) a = s; else b = s;
        s = (a + b) / 2;
      }
      return y(s);
    };
  }
  const saida = bezier(0.16, 1, 0.3, 1);       // ease-saída do design
  const mola = bezier(0.34, 1.4, 0.64, 1);     // só em coisas pequenas
  const suave = bezier(0.65, 0, 0.35, 1);      // câmera
  const mao = bezier(0.42, 0, 0.18, 1);        // trajeto do cursor

  // ---------- dados das capturas ----------
  const DADOS = window.TELAS;
  const TELAS = {};
  if (DADOS) for (const tela of DADOS.telas) TELAS[tela.id] = tela;

  function ret(tela, nome) {
    const r = TELAS[tela] && TELAS[tela].alvos[nome];
    if (!r) throw new Error(`Alvo inexistente: ${tela}.${nome}`);
    return { x: r.x * ESCALA, y: r.y * ESCALA, w: r.w * ESCALA, h: r.h * ESCALA };
  }
  function uniao(...rs) {
    const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y));
    const x2 = Math.max(...rs.map((r) => r.x + r.w)), y2 = Math.max(...rs.map((r) => r.y + r.h));
    return { x, y, w: x2 - x, h: y2 - y };
  }
  const centro = (r) => [r.x + r.w / 2, r.y + r.h / 2];
  const A = (tela, nome, dx = 0, dy = 0) => {
    const [x, y] = centro(ret(tela, nome));
    return [x + dx, y + dy];
  };

  // ---------- roteiro (dados) ----------
  // Telas: quando cada captura entra e como (fade ou revela dentro de um retângulo).
  let TELA_EVENTOS, CAMERA, CURSOR, CLIQUES, DESTAQUES, LEGENDAS;

  // Painel do Google Agenda da pessoa: o evento que o link real do botão "Agendar no Google Agenda" abre.
  // Os textos saem do próprio link capturado (telas.json → 09b-confirmada.link_google_agenda).
  // Ao salvar, o Google adiciona a videoconferência do Meet (não há link de sala inventado).
  const AGENDA = { entra: 33.47, sai: 36.65, campos: 33.75, salvo: 35.07, meet: [35.35, 36.6], alvoSalvar: [0, 0] };

  function montarRoteiro() {
    const form = ret("03-registrar-preenchido", "form");
    const colunaDoFeed = { x: 340 * ESCALA, y: form.y, w: 700 * ESCALA, h: H - form.y };
    TELA_EVENTOS = [
      { t: 2.25, id: "01-feed", dur: 0.6 },
      { t: 8.12, id: "02-registrar", dur: 0.3 },
      // O formulário cresce e empurra o feed: revela a coluna inteira, do topo do formulário até a borda.
      { t: 9.3, id: "03-registrar-preenchido", tipo: "revela", direcao: "baixo", area: colunaDoFeed, dur: 1.3 },
      { t: 11.92, id: "04-feed-publicado", dur: 0.3 },
      { t: 18.92, id: "05-matches", dur: 0.3 },
      { t: 23.02, id: "06-conversa", dur: 0.3 },
      { t: 25.02, id: "07-perfil", dur: 0.3 },
      { t: 26.95, id: "06-conversa", dur: 0.35 },
      { t: 28.12, id: "08-agendar", dur: 0.45 },
      { t: 29.25, id: "08b-agendar-horario", dur: 0.2 },
      { t: 30.62, id: "09-proposta", dur: 0.45 },
      // A Ana confirma: o cartão ganha o botão "Agendar no Google Agenda" (o evento abre no painel AGENDA).
      { t: 31.85, id: "09b-confirmada", dur: 0.4 },
      { t: 37.04, id: "10-avaliar", dur: 0.3 },
      { t: 38.21, id: "11-avaliar-preenchido", tipo: "revela", area: ret("11-avaliar-preenchido", "cartao"), dur: 0.76 },
      { t: 39.86, id: "12-avaliado", dur: 0.27 },
      { t: 41.6, id: "13-notificacoes", dur: 0.25 },
    ];

    // Câmera: a partir de t, vai em dur segundos para o zoom s centrado no ponto foco.
    const meio = [W / 2, H / 2];
    CAMERA = [
      { t: 0, dur: 0, s: 1.04, foco: meio },
      { t: 2.3, dur: 1.4, s: 1, foco: meio },
      { t: 4.2, dur: 1.6, s: 1.12, foco: centro(ret("01-feed", "post_foto")) },
      { t: 6.8, dur: 1.0, s: 1, foco: meio },
      { t: 9.2, dur: 1.0, s: 1.16, foco: centro(ret("03-registrar-preenchido", "form")) },
      { t: 11.95, dur: 1.0, s: 1.06, foco: centro(ret("04-feed-publicado", "post_novo")) },
      { t: 14.0, dur: 1.1, s: 1.55, foco: centro(uniao(ret("04-feed-publicado", "sua_semana"), ret("04-feed-publicado", "mais_estudadas"))) },
      { t: 17.65, dur: 0.9, s: 1, foco: meio },
      { t: 19.6, dur: 1.0, s: 1.3, foco: centro(uniao(ret("05-matches", "secao_troca"), ret("05-matches", "secao_ensinar"))) },
      { t: 22.85, dur: 0.85, s: 1, foco: meio },
      { t: 31.9, dur: 0.8, s: 1.25, foco: centro(ret("09b-confirmada", "cartao")) },
      { t: 33.5, dur: 0.5, s: 1, foco: meio },
      { t: 37.04, dur: 0.76, s: 1.3, foco: centro(ret("10-avaliar", "cartao")) },
      { t: 40.56, dur: 0.68, s: 1, foco: meio },
    ];

    // Cursor: trajetos (de → ate) até um ponto do palco, em coordenadas da tela (antes da câmera).
    CURSOR = {
      inicio: [1780, 1000],
      aparece: 2.9,
      some: 43.95,
      trechos: [
        { de: 3.1, ate: 4.2, para: A("01-feed", "foto", 40, 10) },
        { de: 4.7, ate: 5.9, para: A("01-feed", "foto", 150, -40) },
        { de: 6.95, ate: 7.75, para: A("01-feed", "registrar") },
        { de: 8.4, ate: 9.0, para: A("02-registrar", "texto", -120, -10) },
        { de: 10.8, ate: 11.55, para: A("03-registrar-preenchido", "publicar") },
        { de: 12.4, ate: 13.2, para: A("04-feed-publicado", "post_novo", 200, -140) },
        { de: 14.3, ate: 15.0, para: A("04-feed-publicado", "sua_semana_horas", 70, 2) },
        { de: 16.55, ate: 17.2, para: [ret("04-feed-publicado", "mais_estudadas").x + 150, ret("04-feed-publicado", "mais_estudadas").y + 110] },
        { de: 17.8, ate: 18.55, para: A("04-feed-publicado", "nav_matches", -40, 0) },
        { de: 19.3, ate: 20.1, para: A("05-matches", "par_troca", -150, 4) },
        { de: 21.85, ate: 22.65, para: A("05-matches", "conversar_par") },
        { de: 23.9, ate: 24.65, para: A("06-conversa", "cabecalho_perfil", -20, 0) },
        { de: 25.35, ate: 26.1, para: A("07-perfil", "habilidades", 60, 10) },
        { de: 27.1, ate: 27.8, para: A("06-conversa", "agendar") },
        { de: 28.4, ate: 28.95, para: A("08-agendar", "horario") },
        { de: 29.65, ate: 30.3, para: A("08b-agendar-horario", "propor") },
        { de: 31.0, ate: 31.7, para: A("09-proposta", "cartao", 120, 60) },
        { de: 32.35, ate: 33.05, para: A("09b-confirmada", "agenda") },
        // No painel o palco está sem zoom: coordenadas da tela = coordenadas do painel.
        { de: 34.25, ate: 34.85, para: AGENDA.alvoSalvar },
        { de: 37.42, ate: 37.95, para: A("10-avaliar", "estrela5") },
        { de: 39.05, ate: 39.58, para: A("11-avaliar-preenchido", "enviar") },
        { de: 40.71, ate: 41.36, para: A("13-notificacoes", "nav_notificacoes", -40, 0) },
        { de: 41.92, ate: 42.51, para: A("13-notificacoes", "item1", 250, 8) },
        { de: 42.63, ate: 43.81, para: A("13-notificacoes", "item3", 250, 8) },
      ],
    };
    // Cliques: o anel sai no ponto em que o cursor está; a tela troca ~0,12 s depois.
    CLIQUES = [7.95, 9.15, 11.8, 18.8, 22.9, 24.9, 28.0, 29.15, 30.5, 33.35, 34.95, 38.1, 39.77, 41.51];

    // Destaques: um por vez, retângulo do alvo (+ folga).
    DESTAQUES = [
      { de: 4.4, ate: 6.8, r: ret("01-feed", "post_foto") },
      { de: 12.3, ate: 13.95, r: ret("04-feed-publicado", "post_novo") },
      { de: 15.1, ate: 16.5, r: ret("04-feed-publicado", "sua_semana") },
      { de: 16.6, ate: 17.58, r: ret("04-feed-publicado", "mais_estudadas") },
      { de: 19.35, ate: 21.7, r: ret("05-matches", "par_troca") },
      { de: 23.4, ate: 24.75, r: ret("06-conversa", "mensagem") },
      { de: 25.4, ate: 26.85, r: ret("07-perfil", "habilidades") },
      { de: 29.4, ate: 30.35, r: ret("08b-agendar-horario", "resumo") },
      { de: 30.95, ate: 31.85, r: ret("09-proposta", "cartao") },
      { de: 32.15, ate: 32.75, r: ret("09b-confirmada", "cartao") },
      { de: 32.8, ate: 33.45, r: ret("09b-confirmada", "agenda") },
      { de: 40.14, ate: 40.75, r: ret("12-avaliado", "cartao") },
      { de: 41.96, ate: 42.63, r: ret("13-notificacoes", "item1") },
      { de: 42.67, ate: 43.26, r: ret("13-notificacoes", "item2") },
      { de: 43.3, ate: 43.93, r: ret("13-notificacoes", "item3") },
    ];

    LEGENDAS = [
      { de: 3.0, ate: 7.1, texto: "Feed: a rotina de estudo da sua rede" },
      { de: 7.6, ate: 13.95, texto: "Registre o que estudou hoje, com foto" },
      { de: 14.35, ate: 17.6, texto: "Sua semana e as habilidades mais estudadas" },
      { de: 19.0, ate: 23.25, texto: "Matches: troca recíproca e quem pode te ensinar" },
      { de: 23.45, ate: 25.0, texto: "Converse com quem combina com você" },
      { de: 25.25, ate: 26.9, texto: "Perfis mostram o que cada um sabe" },
      { de: 27.2, ate: 31.75, texto: "Agende a troca direto na conversa" },
      { de: 32.0, ate: 34.85, texto: "Um clique abre o seu Google Agenda com a troca preenchida" },
      { de: 35.0, ate: 36.7, texto: "Salve e o Google Meet já vem no evento" },
      { de: 37.23, ate: 40.71, texto: "Depois da troca, avalie como foi" },
      { de: 41.67, ate: 43.97, texto: "Notificações de curtidas, seguidores e trocas" },
    ];
  }

  // ---------- estado derivado do tempo ----------
  function estadoCamera(alvo) {
    const s = alvo.s;
    const tx = clamp(W / 2 - alvo.foco[0] * s, W - W * s, 0);
    const ty = clamp(H / 2 - alvo.foco[1] * s, H - H * s, 0);
    return { s, tx, ty };
  }

  function camera(t) {
    let atual = estadoCamera(CAMERA[0]);
    for (const mov of CAMERA) {
      if (t < mov.t) break;
      const destino = estadoCamera(mov);
      const p = suave(prog(t, mov.t, mov.dur));
      // Interpolar (s, tx, ty) em linha reta mantém a tela cobrindo o palco o tempo todo.
      atual = { s: lerp(atual.s, destino.s, p), tx: lerp(atual.tx, destino.tx, p), ty: lerp(atual.ty, destino.ty, p) };
    }
    return atual;
  }
  const aplicar = (cam, [x, y]) => [x * cam.s + cam.tx, y * cam.s + cam.ty];

  function posCursor(t) {
    let pos = CURSOR.inicio;
    for (const tr of CURSOR.trechos) {
      if (t < tr.de) break;
      const p = mao(prog(t, tr.de, tr.ate - tr.de));
      const [x0, y0] = pos, [x1, y1] = tr.para;
      // Leve curva: ponto de controle deslocado 8 % do trecho para o lado.
      const dx = x1 - x0, dy = y1 - y0;
      const cx = (x0 + x1) / 2 - dy * 0.08, cy = (y0 + y1) / 2 + dx * 0.08;
      const u = 1 - p;
      pos = [u * u * x0 + 2 * u * p * cx + p * p * x1, u * u * y0 + 2 * u * p * cy + p * p * y1];
    }
    return pos;
  }

  function escalaClique(t) {
    let k = 1;
    for (const tc of CLIQUES) {
      const dt = t - tc;
      if (dt < 0 || dt > 0.4) continue;
      k = dt < 0.08 ? 1 - 0.14 * (dt / 0.08) : 0.86 + 0.14 * mola(prog(dt, 0.08, 0.3));
    }
    return k;
  }

  function opacidadeJanela(t, de, ate, entra = 0.3, sai = 0.3) {
    if (t < de || t > ate) return 0;
    return Math.min(prog(t, de, entra), 1 - prog(t, ate - sai, sai));
  }

  // ---------- desenho ----------
  const $ = (id) => document.getElementById(id);
  let imagens = {};
  const el = {};

  function inset(r) {
    return `inset(${r.y}px ${W - r.x - r.w}px ${H - r.y - r.h}px ${r.x}px)`;
  }

  function estiloDaTela(ev, p) {
    const estilo = { opacity: 1, clip: "none", transform: "none" };
    if (ev.tipo === "revela") {
      // Revela a tela preenchida só dentro da área: para baixo (o formulário cresce) ou para a direita.
      const a = ev.area, e = saida(p);
      estilo.clip = ev.direcao === "baixo"
        ? inset({ x: a.x, y: a.y, w: a.w, h: a.h * e })
        : inset({ x: a.x, y: a.y, w: a.w * e, h: a.h });
    } else {
      estilo.opacity = suave(p); // simétrico: sem "estalo" nos primeiros quadros
    }
    return estilo;
  }

  // Pilha de camadas da tela k no tempo t, de baixo para cima. Uma tela revelada é só um recorte:
  // a de baixo continua sempre por trás dela, inclusive enquanto a próxima tela entra.
  function camadas(k, t) {
    if (k < 0) return [];
    const ev = TELA_EVENTOS[k];
    const p = prog(t, ev.t, ev.dur);
    const base = ev.tipo === "revela" || p < 1 ? camadas(k - 1, t) : [];
    return [...base, { id: ev.id, estilo: estiloDaTela(ev, p) }];
  }

  function desenharTelas(t) {
    let i = -1;
    for (let k = 0; k < TELA_EVENTOS.length; k++) if (t >= TELA_EVENTOS[k].t) i = k;
    const visiveis = new Map(); // id → estilo (com z pela posição na pilha)
    camadas(i, t).forEach(({ id, estilo }, z) => visiveis.set(id, { ...estilo, z: z + 1 }));
    for (const [id, img] of Object.entries(imagens)) {
      const v = visiveis.get(id);
      if (!v) {
        img.style.visibility = "hidden";
        img.style.opacity = "0";
        continue;
      }
      img.style.visibility = "visible";
      img.style.opacity = String(v.opacity);
      img.style.zIndex = String(v.z);
      img.style.clipPath = v.clip;
      img.style.transform = v.transform;
    }
  }

  function desenharMarca(raiz, t, entra, sai) {
    // Abertura/fechamento: as 7 células surgem em sequência (mola), depois a palavra e o texto.
    const celulas = raiz.querySelectorAll(".logo path");
    celulas.forEach((c, i) => {
      const p = prog(t, entra + 0.12 + i * 0.06, 0.45);
      c.style.transform = `scale(${mola(p)})`;
      c.style.opacity = String(clamp(p * 3));
    });
    const palavra = raiz.querySelector(".palavra");
    const pp = saida(prog(t, entra + 0.55, 0.6));
    palavra.style.opacity = String(pp);
    palavra.style.transform = `translateX(${(1 - pp) * -18}px)`;
    raiz.querySelectorAll("p, strong, small").forEach((n, i) => {
      const q = saida(prog(t, entra + 0.85 + i * 0.18, 0.6));
      n.style.opacity = String(q);
      n.style.transform = `translateY(${(1 - q) * 14}px)`;
    });
    const fora = sai == null ? 0 : saida(prog(t, sai, 0.45));
    raiz.style.opacity = String(1 - fora);
    raiz.style.transform = `scale(${1 + fora * 0.04})`;
  }

  function desenharAgenda(t) {
    if (t < AGENDA.entra || t > AGENDA.sai + 0.4) {
      el.agenda.style.display = "none";
      return;
    }
    el.agenda.style.display = "block";
    const entra = saida(prog(t, AGENDA.entra, 0.45));
    const fora = suave(prog(t, AGENDA.sai, 0.35));
    el.agenda.style.opacity = String(Math.min(suave(prog(t, AGENDA.entra, 0.3)), 1 - fora));
    el.janela.style.transform = `translateY(${(1 - entra) * 40}px) scale(${0.97 + 0.03 * entra})`;
    el.camposAgenda.forEach((c, i) => {
      const q = saida(prog(t, AGENDA.campos + i * 0.15, 0.45));
      c.style.opacity = String(q);
      c.style.transform = `translateY(${(1 - q) * 12}px)`;
    });
    const salvo = saida(prog(t, AGENDA.salvo, 0.45));
    el.meet.style.opacity = String(salvo);
    el.meet.style.transform = `translateY(${(1 - salvo) * 14}px)`;
    // Um texto sai antes de o outro entrar: nunca os dois sobrepostos.
    el.seloAntes.style.opacity = String(1 - suave(prog(t, AGENDA.salvo, 0.18)));
    el.seloDepois.style.opacity = String(suave(prog(t, AGENDA.salvo + 0.18, 0.22)));
    const [m0, m1] = AGENDA.meet;
    el.meet.style.setProperty("--brilho-meet", String(opacidadeJanela(t, m0, m1)));
  }

  function lerLinkAgenda() {
    const tela = TELAS["09b-confirmada"];
    if (!tela || !tela.link_google_agenda) throw new Error("telas.json sem 09b-confirmada.link_google_agenda");
    const url = new URL(tela.link_google_agenda);
    const q = url.searchParams;
    const [ini, fim] = q.get("dates").split("/").map((d) => new Date(d.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z")));
    const fuso = { timeZone: "America/Sao_Paulo" };
    const dia = new Intl.DateTimeFormat("pt-BR", { ...fuso, weekday: "long", day: "numeric", month: "long" }).format(ini);
    const hora = (d) => new Intl.DateTimeFormat("pt-BR", { ...fuso, hour: "2-digit", minute: "2-digit" }).format(d);
    $("agenda-url").textContent = url.host + url.pathname + url.search;
    $("agenda-titulo").textContent = q.get("text");
    $("agenda-quando").textContent = `${dia.charAt(0).toLocaleUpperCase("pt-BR") + dia.slice(1)} · ${hora(ini)} – ${hora(fim)}`;
    $("agenda-descricao").replaceChildren(...q.get("details").split("\n").map((linha) => {
      const p = document.createElement("span");
      p.textContent = linha;
      return p;
    }));
  }

  // Posição no palco (sem transform) do centro de um elemento do painel.
  function centroNoPalco(no) {
    let x = no.offsetWidth / 2, y = no.offsetHeight / 2;
    for (let n = no; n && n !== el.palco; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return [x, y];
  }

  function desenhar(t) {
    t = clamp(t, 0, DURACAO);
    const cam = camera(t);
    el.camera.style.transform = `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`;
    desenharTelas(t);
    desenharAgenda(t);

    // Abertura (0–2,6 s): fundo mel suave clareando até o fundo do app.
    if (t < 2.75) {
      el.abertura.style.display = "flex";
      const c = saida(prog(t, 0, 1.8));
      el.abertura.style.background = `rgb(${lerp(251, 247, c)} ${lerp(240, 246, c)} ${lerp(210, 242, c)})`;
      desenharMarca(el.abertura, t, 0, 2.2);
    } else {
      el.abertura.style.display = "none";
    }

    // Fechamento (44,2–46 s).
    if (t >= 44.1) {
      el.fecho.style.display = "flex";
      desenharMarca(el.fecho, t, 44.3, null);
      el.fecho.style.opacity = String(suave(prog(t, 44.1, 0.6)));
    } else {
      el.fecho.style.display = "none";
    }

    // Destaque.
    let destaque = null;
    for (const d of DESTAQUES) if (t >= d.de && t <= d.ate) destaque = d;
    if (destaque) {
      const folga = 8;
      const [x, y] = aplicar(cam, [destaque.r.x, destaque.r.y]);
      el.destaque.style.opacity = String(opacidadeJanela(t, destaque.de, destaque.ate));
      el.destaque.style.width = `${destaque.r.w * cam.s + folga * 2}px`;
      el.destaque.style.height = `${destaque.r.h * cam.s + folga * 2}px`;
      el.destaque.style.transform = `translate(${x - folga}px, ${y - folga}px)`;
    } else {
      el.destaque.style.opacity = "0";
    }

    // Cursor (acompanha a câmera) e anel do clique.
    const [cx, cy] = aplicar(cam, posCursor(t));
    const vis = Math.min(prog(t, CURSOR.aparece, 0.3), 1 - prog(t, CURSOR.some, 0.3));
    el.cursor.style.opacity = String(vis);
    el.cursor.style.transform = `translate(${cx - 2.4}px, ${cy - 2.4}px) scale(${escalaClique(t)})`;
    let anel = 0, raio = 0;
    for (const tc of CLIQUES) {
      const p = prog(t, tc, 0.55);
      if (t >= tc && p < 1) {
        anel = 0.9 * (1 - p);
        raio = 6 + 50 * saida(p);
      }
    }
    el.anel.style.opacity = String(anel);
    el.anel.style.width = el.anel.style.height = `${raio * 2}px`;
    el.anel.style.transform = `translate(${cx - raio}px, ${cy - raio}px)`;

    // Legenda.
    let legenda = null;
    for (const l of LEGENDAS) if (t >= l.de && t <= l.ate) legenda = l;
    if (legenda) {
      const entra = saida(prog(t, legenda.de, 0.4));
      el.legendaTexto.textContent = legenda.texto;
      el.legenda.style.opacity = String(Math.min(entra, 1 - prog(t, legenda.ate - 0.3, 0.3)));
      el.legenda.style.transform = `translateY(${(1 - entra) * 16}px)`;
    } else {
      el.legenda.style.opacity = "0";
    }
  }

  // ---------- montagem ----------
  const CELULAS = [
    "M20.00 15.00L24.33 17.50L24.33 22.50L20.00 25.00L15.67 22.50L15.67 17.50Z",
    "M30.06 15.00L34.39 17.50L34.39 22.50L30.06 25.00L25.73 22.50L25.73 17.50Z",
    "M25.03 23.71L29.36 26.21L29.36 31.21L25.03 33.71L20.70 31.21L20.70 26.21Z",
    "M14.97 23.71L19.30 26.21L19.30 31.21L14.97 33.71L10.64 31.21L10.64 26.21Z",
    "M9.94 15.00L14.27 17.50L14.27 22.50L9.94 25.00L5.61 22.50L5.61 17.50Z",
    "M14.97 6.29L19.30 8.79L19.30 13.79L14.97 16.29L10.64 13.79L10.64 8.79Z",
    "M25.03 6.29L29.36 8.79L29.36 13.79L25.03 16.29L20.70 13.79L20.70 8.79Z",
  ];

  function montar() {
    for (const id of ["palco", "camera", "destaque", "anel", "cursor", "legenda", "abertura", "fecho", "agenda"]) el[id] = $(id);
    el.janela = el.agenda.querySelector(".janela");
    el.camposAgenda = el.agenda.querySelectorAll(".campo");
    el.meet = $("agenda-meet");
    el.seloAntes = $("selo-antes");
    el.seloDepois = $("selo-depois");
    el.legendaTexto = el.legenda.querySelector("span");
    for (const svg of document.querySelectorAll(".logo svg")) {
      svg.innerHTML = CELULAS.map((d, i) => `<path d="${d}" fill="${i === 0 ? "#1B1A17" : "#F2A900"}"/>`).join("");
    }
    imagens = {};
    for (const tela of DADOS.telas) {
      const img = new Image();
      img.src = `telas/${tela.arquivo}`;
      img.alt = "";
      img.decoding = "sync";
      el.camera.appendChild(img);
      imagens[tela.id] = img;
    }
    lerLinkAgenda();
    // O cursor clica no "Salvar", à direita do texto para não cobri-lo.
    el.agenda.style.display = "block"; // medir exige o painel no layout; desenhar() decide se aparece
    const [sx, sy] = centroNoPalco($("agenda-salvar"));
    AGENDA.alvoSalvar = [sx + 44, sy + 2];
    montarRoteiro();
  }

  const render = new URLSearchParams(location.search).has("render");
  if (render) document.documentElement.classList.add("render");

  let pronto;
  if (!DADOS) {
    $("aviso").style.display = "grid";
    pronto = Promise.reject(new Error("telas/telas.js não carregou"));
  } else {
    montar();
    const fontes = ['700 40px "Literata"', '500 20px "Fira Sans"', '600 20px "Fira Sans"', '400 20px "IBM Plex Mono"'];
    pronto = Promise.all([
      ...Object.values(imagens).map((img) => img.decode()),
      ...fontes.map((f) => document.fonts.load(f)),
    ]).then(() => document.fonts.ready).then(() => desenhar(0));
  }

  window.demo = { duracao: DURACAO, fps: FPS, pronto, seek: desenhar };

  if (render || !DADOS) return;

  // ---------- player ----------
  const palco = $("palco");
  const barra = $("barra"), relogio = $("relogio"), tocar = $("tocar");
  barra.max = String(DURACAO);
  let tocando = true, t0 = 0, base = 0, atual = 0;

  function encaixar() {
    const k = Math.min(innerWidth / W, (innerHeight - 56) / H);
    palco.style.transform = `translate(${(innerWidth - W * k) / 2}px, ${(innerHeight - 56 - H * k) / 2}px) scale(${k})`;
  }
  function mostrar(t) {
    atual = t;
    desenhar(t);
    barra.value = String(t);
    const m = Math.floor(t / 60), s = t - m * 60;
    relogio.textContent = `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
  }
  function alternar() {
    tocando = !tocando;
    tocar.textContent = tocando ? "❚❚" : "▶";
    tocar.setAttribute("aria-label", tocando ? "Pausar" : "Tocar");
    if (tocando) { base = atual; t0 = performance.now(); }
  }
  function quadro(agora) {
    if (tocando) mostrar((base + (agora - t0) / 1000) % DURACAO);
    requestAnimationFrame(quadro);
  }
  tocar.addEventListener("click", alternar);
  barra.addEventListener("input", () => { base = Number(barra.value); t0 = performance.now(); mostrar(base); });
  addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); alternar(); } });
  addEventListener("resize", encaixar);
  encaixar();
  pronto.then(() => { t0 = performance.now(); requestAnimationFrame(quadro); });
})();
