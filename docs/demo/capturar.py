"""Captura telas reais do Colmatch para a demo.

Requer banco recém-semeado, frontend e API rodando. O roteiro publica um post
com foto, adiciona Estrutura de Dados às habilidades de Ada, envia uma mensagem,
propõe uma troca e avalia a troca com Linus (removendo antes a avaliação de Ada).

Uso (da raiz do repo; passo a passo em docs/demo/README.md):
  uv run --with playwright==1.64.0 --with pillow==11.3.0 python docs/demo/capturar.py
Variáveis opcionais: FRONT_URL, API_URL e DEMO_DB (caminho do SQLite semeado).
"""
from __future__ import annotations

import atexit
import json
import os
import shutil
import sqlite3
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/demo/telas"
FRONT = os.getenv("FRONT_URL", "http://localhost:3010").rstrip("/")
API = os.getenv("API_URL", "http://localhost:8010").rstrip("/")
DB = Path(os.getenv("DEMO_DB", str(ROOT / ".demo-srv/demo.db")))
CARTAO_AVALIAR = "[id^='troca-']:has(section[aria-labelledby^='titulo-avaliacao'])"
VIEWPORT = {"largura": 1600, "altura": 900, "escala": 2}


def require(locator, name: str):
    locator.first.wait_for(state="visible", timeout=12000)
    if locator.count() == 0:
        raise RuntimeError(f"Alvo obrigatório ausente: {name}")
    return locator.first


def box(locator, name: str):
    el = require(locator, name)
    r = el.bounding_box()
    if not r or r["width"] <= 0 or r["height"] <= 0:
        raise RuntimeError(f"Alvo sem retângulo visível: {name}")
    return {k: round(r[src]) for k, src in (("x", "x"), ("y", "y"), ("w", "width"), ("h", "height"))}


def rects(page, spec):
    return {name: box(page.locator(selector), name) for name, selector in spec.items()}


def ready(page):
    page.wait_for_load_state("networkidle", timeout=30000)
    page.wait_for_function("Array.from(document.images).filter(i=>{const r=i.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth}).every(i=>i.complete&&i.naturalWidth>0)", timeout=30000)
    page.evaluate("document.fonts.ready")
    page.mouse.move(0, 0)
    # Sem anel de foco perdido na captura (o destaque é da animação).
    page.evaluate("document.activeElement && document.activeElement.blur()")
    page.add_style_tag(content="*{caret-color:transparent!important}")
    page.wait_for_timeout(900)


def capture(page, ident, rota, selectors):
    ready(page)
    alvos = rects(page, selectors)
    png = NOVA / (ident + ".png")
    webp = NOVA / (ident + ".webp")
    page.screenshot(path=str(png), animations="disabled")
    with Image.open(png) as im:
        im.convert("RGB").save(webp, "WEBP", quality=92, method=6)
    png.unlink()
    records.append({"id": ident, "arquivo": webp.name, "rota": rota, "alvos": alvos})


records = []
# Grava numa pasta temporária; as capturas antigas só são trocadas se o roteiro terminar.
NOVA = Path(tempfile.mkdtemp(prefix="colmatch-telas-"))
atexit.register(shutil.rmtree, NOVA, ignore_errors=True)  # some com a pasta mesmo se o roteiro falhar

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width":1600,"height":900}, device_scale_factor=2,
        color_scheme="light", reduced_motion="no-preference", locale="pt-BR", timezone_id="America/Sao_Paulo")
    page = context.new_page()
    try:
        page.goto(FRONT + "/login", wait_until="networkidle")
        page.get_by_label("Nome de usuário").fill("ada")
        page.locator('input[type="password"]').fill("senha-forte-123")
        page.locator('form button[type="submit"]').click()
        page.wait_for_url("**/feed", timeout=20000)
        ready(page)

        nav = lambda label: f'nav[aria-label="Principal"] a[href="/{label}"]'
        feed = {"registrar":"main button span[aria-hidden=true]:text-is('Registrar estudo')", "composer":"button:has-text('O que você estudou hoje?')",
          "post_foto":"article:has(img[alt='Foto do post'])", "foto":"article img[alt='Foto do post']", "sua_semana":"aside[aria-label='Sua semana e descobertas'] section:has(h2:has-text('Sua semana'))",
          "mais_estudadas":"aside[aria-label='Sua semana e descobertas'] section:has(h2:has-text('Mais estudadas'))", "pode_te_ensinar":"aside[aria-label='Sua semana e descobertas'] section:has(h2:has-text('Pode te ensinar'))",
          "nav_matches":nav("matches"), "nav_mensagens":nav("mensagens"), "nav_notificacoes":nav("notificacoes")}
        capture(page,"01-feed","/feed",feed)
        page.locator("main button:has-text('O que você estudou hoje?')").click()
        form_specs={"texto":"textarea[placeholder='Conte um pouco sobre seus estudos...']", "habilidade":"select", "tempo":"input[type=number]",
          "foto_botao":"button:has-text('Adicionar foto')", "publicar":"form button[type=submit]", "form":"form:has(textarea[placeholder='Conte um pouco sobre seus estudos...'])"}
        capture(page,"02-registrar","/feed",form_specs)
        foto_path=ROOT/".demo-srv/foto-demo.jpg"; foto_path.parent.mkdir(exist_ok=True)
        urllib.request.urlretrieve("https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop",foto_path)
        page.locator("textarea[placeholder='Conte um pouco sobre seus estudos...']").fill("Revisei flexbox e grid. Agora o layout da página fecha!")
        page.locator("select").select_option(label="CSS")
        page.locator("input[type=number]").fill("45")
        page.locator("input[type=file]").set_input_files(str(foto_path))
        page.locator("img[alt='Prévia da foto']").wait_for(state="visible",timeout=15000)
        filled={**form_specs,"foto_botao":"img[alt='Prévia da foto']"}
        capture(page,"03-registrar-preenchido","/feed",filled)
        page.locator("form button[type=submit]").click()
        page.get_by_text("Revisei flexbox e grid. Agora o layout da página fecha!",exact=True).wait_for(timeout=20000)
        # A foto sobe depois do post: espere ela aparecer antes de recarregar.
        page.locator("article:has-text('Revisei flexbox e grid. Agora o layout da página fecha!') img[alt='Foto do post']").first.wait_for(timeout=30000)
        # "Mais estudadas" só se atualiza ao recarregar o feed; recarrega para mostrar o post já contado.
        page.reload()
        page.get_by_text("Revisei flexbox e grid. Agora o layout da página fecha!",exact=True).wait_for(timeout=20000)
        capture(page,"04-feed-publicado","/feed",{"post_novo":"article:has-text('Revisei flexbox e grid. Agora o layout da página fecha!')","foto_nova":"article:has-text('Revisei flexbox e grid. Agora o layout da página fecha!') img[alt='Foto do post']","sua_semana":"aside[aria-label='Sua semana e descobertas'] section:has(h2:has-text('Sua semana'))","sua_semana_horas":"aside[aria-label='Sua semana e descobertas'] section:has(h2:has-text('Sua semana')) p.font-mono","mais_estudadas":"aside[aria-label='Sua semana e descobertas'] section:has(h2:has-text('Mais estudadas'))","nav_matches":nav("matches")})

        token=page.evaluate("localStorage.getItem('token')")
        if not token: raise RuntimeError("Token não encontrado em localStorage")
        # Mesmo fluxo da tela de editar perfil: manda a lista completa de habilidades + a nova.
        with urllib.request.urlopen(API+"/usuarios/ada") as response: perfil=json.load(response)
        skills=[{"habilidade_id":h["id"],"tipo":h["tipo"],"nivel":h["nivel"]} for h in perfil["habilidades"]]
        with urllib.request.urlopen(API+"/habilidades") as response: catalog=json.load(response)
        if isinstance(catalog,dict): catalog=catalog.get("items",catalog.get("habilidades",[]))
        estr=next((h for h in catalog if h.get("nome")=="Estrutura de Dados"),None)
        if not estr: raise RuntimeError("Habilidade Estrutura de Dados não encontrada")
        skills.append({"habilidade_id":estr["id"],"tipo":"sei","nivel":4})
        data=json.dumps(skills).encode()
        req=urllib.request.Request(API+"/usuarios/eu/habilidades",data=data,headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="PUT")
        with urllib.request.urlopen(req) as response: response.read()
        page.goto(FRONT+"/matches"); page.get_by_text("Ana Borges",exact=False).first.wait_for(timeout=20000)
        capture(page,"05-matches","/matches",{"par_troca":"table[aria-label='01 · Pares de troca'] tbody tr:has-text('Ana Borges')","conversar_par":"a[href='/mensagens/ana_borges']","secao_troca":"section:has-text('Pares de troca')","secao_ensinar":"section:has-text('Pode te ensinar')"})
        page.goto(FRONT+"/mensagens/ana_borges"); ready(page)
        page.get_by_role("button",name="Agendar troca").first.wait_for(timeout=20000)
        composer=page.get_by_placeholder("Escreva uma mensagem")
        composer.fill("Oi, Ana! Te ensino Estrutura de Dados e você me ajuda com CSS?")
        composer.press("Enter")
        page.get_by_text("Oi, Ana! Te ensino Estrutura de Dados e você me ajuda com CSS?",exact=True).wait_for(timeout=15000)
        capture(page,"06-conversa","/mensagens/ana_borges",{"cabecalho_perfil":"a[aria-label^='Ver perfil de']","agendar":"button[aria-label='Agendar troca']","mensagem":"*:text-is('Oi, Ana! Te ensino Estrutura de Dados e você me ajuda com CSS?')","campo":"textarea"})
        page.locator("a[aria-label^='Ver perfil de']").click(); page.wait_for_url("**/perfil/ana_borges")
        capture(page,"07-perfil","/perfil/ana_borges",{"cabecalho":"section[aria-label='Ficha']","habilidades":"section[aria-labelledby='titulo-habilidades']"})
        page.goto(FRONT+"/mensagens/ana_borges"); page.locator("header button:has-text('Agendar troca'), button[aria-label='Agendar troca']").first.click()
        dialog=page.locator("dialog[aria-labelledby='titulo-agendar-troca']")
        # As habilidades da troca já vêm escolhidas (Estrutura de Dados ↔ CSS); falta o dia e o horário.
        # "Amanhã" existe todo dia (o outro atalho muda com o dia da semana) e 19:00 de amanhã está sempre livre.
        dialog.get_by_role("button",name="Amanhã",exact=True).click()
        h=require(dialog.get_by_role("button",name="19:00",exact=True),"horário 19:00")
        h.scroll_into_view_if_needed()
        agendar={"form":"dialog[aria-labelledby='titulo-agendar-troca']","horario":"dialog button:text-is('19:00')","resumo":"section[aria-label='Resumo da ordem']","propor":"dialog button:has-text('Propor troca')"}
        capture(page,"08-agendar","/mensagens/ana_borges",agendar)
        h.click()
        dialog.locator("button[aria-pressed=true]:text-is('19:00')").wait_for(timeout=5000)
        capture(page,"08b-agendar-horario","/mensagens/ana_borges",agendar)
        dialog.get_by_role("button",name="Propor troca").click()
        page.get_by_text("Estrutura de Dados",exact=False).last.wait_for(timeout=20000)
        capture(page,"09-proposta","/mensagens/ana_borges",{"cartao":"[id^='troca-']:has-text('Estrutura de Dados')","status":"[id^='troca-']:has-text('Estrutura de Dados') > div:first-child > span:last-child"})

        # Estado logo após conclusão da troca: remove apenas a avaliação de Ada para a troca com Linus.
        con=sqlite3.connect(DB)
        try:
          ada=con.execute("SELECT id FROM users WHERE username='ada'").fetchone()
          linus=con.execute("SELECT id FROM users WHERE username='linus'").fetchone()
          if not ada or not linus: raise RuntimeError("Ada/Linus não encontrados no banco demo")
          troca=con.execute("SELECT id FROM trocas WHERE (proposta_por_id=? AND com_id=?) OR (proposta_por_id=? AND com_id=?) ORDER BY id DESC LIMIT 1",(ada[0],linus[0],linus[0],ada[0])).fetchone()
          if not troca: raise RuntimeError("Troca Ada↔Linus não encontrada")
          con.execute("DELETE FROM avaliacoes WHERE de_id=? AND troca_id=?",(ada[0],troca[0])); con.commit()
        finally: con.close()
        page.goto(FRONT+"/mensagens/linus"); ready(page)
        card=page.locator(CARTAO_AVALIAR).first
        card.scroll_into_view_if_needed()
        review={"cartao":CARTAO_AVALIAR,"estrelas":"[role=radiogroup][aria-label='Avaliação']","estrela5":"[role=radio][aria-label='5 estrelas']","recado":"textarea[placeholder='O que foi legal, o que pode melhorar…']","enviar":"button:has-text('Enviar avaliação')"}
        capture(page,"10-avaliar","/mensagens/linus",review)
        page.get_by_role("radio",name="5 estrelas").click(); page.get_by_label("Quer deixar um recado?").fill("Explicou hooks com muita paciência. Valeu, Linus!")
        capture(page,"11-avaliar-preenchido","/mensagens/linus",review)
        page.get_by_role("button",name="Enviar avaliação").click()
        page.locator(CARTAO_AVALIAR).wait_for(state="detached",timeout=15000)
        capture(page,"12-avaliado","/mensagens/linus",{"cartao":"[id^='troca-']"})
        page.goto(FRONT+"/notificacoes")
        capture(page,"13-notificacoes","/notificacoes",{"titulo":"h1","lista":"main ul","item1":"main ul li >> nth=0","item2":"main ul li >> nth=1","item3":"main ul li >> nth=2","nav_notificacoes":nav("notificacoes")})
        page.goto(FRONT+"/feed"); photo=page.locator("article:has(img[alt='Foto do post'])").first
        photo.locator("img[alt='Foto do post']").evaluate("el => el.scrollIntoView({block: 'center'})")
        capture(page,"14-feed-foto","/feed",{"foto":"article img[alt='Foto do post']","post":"article:has(img[alt='Foto do post'])"})
        photo.locator("img[alt='Foto do post']").click(); page.wait_for_timeout(1200)
        capture(page,"15-lupa","/feed",{"lupa":"img[alt^='Foto do post de']","fechar":"button[aria-label='Fechar foto']"})
    except Exception:
        # Guarda a tela do momento da falha para depurar o roteiro.
        page.screenshot(path=str(ROOT / ".demo-srv/erro-captura.png"))
        raise
    browser.close()

payload={"viewport":VIEWPORT,"usuario":"ada","telas":records}
texto=json.dumps(payload,ensure_ascii=False,indent=2)
OUT.mkdir(parents=True, exist_ok=True)
for antiga in OUT.glob("*.webp"):
    antiga.unlink()
for nova in NOVA.glob("*.webp"):
    shutil.move(str(nova), OUT / nova.name)
shutil.rmtree(NOVA)
(OUT/"telas.json").write_text(texto+"\n",encoding="utf-8")
# Mesmo conteúdo como script: a demo abre direto do disco (file://), onde fetch não funciona.
(OUT/"telas.js").write_text("window.TELAS = "+texto+";\n",encoding="utf-8")
print(f"Capturadas {len(records)} telas em {OUT}")
