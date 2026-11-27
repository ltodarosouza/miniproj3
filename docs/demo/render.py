#!/usr/bin/env python3
"""Renderiza a demo HTML em vídeo ou quadros PNG.

Uso:
  uv run --with playwright==1.64.0 --with imageio-ffmpeg==0.6.0 python docs/demo/render.py
  uv run --with playwright==1.64.0 --with imageio-ffmpeg==0.6.0 --with pillow==11.3.0 python docs/demo/render.py --quadros 0,1.5,3.9

Use --pagina para apontar a uma pasta servida, --de/--ate para limitar o
trecho, --fps para substituir a taxa da página e --sem-previa para não criar
as versões leves. Pillow (11.3.0) é necessário somente com --quadros.
"""

import argparse
import asyncio
import http.server
import os
import re
import subprocess
import sys
import threading
import time
from pathlib import Path


PADRAO_SAIDA = "/Users/ltodaro/dev/atividades-trilha/demo-colmatch/colmatch-demo.mp4"


class Servidor(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def iniciar_servidor(pasta):
    class Silencioso(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass  # um GET por arquivo só polui o progresso

    handler = lambda *args, **kwargs: Silencioso(*args, directory=str(pasta), **kwargs)
    servidor = Servidor(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=servidor.serve_forever, daemon=True)
    thread.start()
    return servidor, thread


def argumentos():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saida", default=PADRAO_SAIDA, help="arquivo MP4 de saída")
    parser.add_argument("--fps", type=int, help="substitui o fps definido na página")
    parser.add_argument("--de", type=float, default=0, help="segundo inicial")
    parser.add_argument("--ate", type=float, help="segundo final (exclusivo)")
    parser.add_argument("--quadros", help="tempos separados por vírgula; exige Pillow 11.3.0")
    parser.add_argument("--pagina", type=Path, default=Path(__file__).resolve().parent,
                        help="pasta contendo index.html")
    previa = parser.add_mutually_exclusive_group()
    previa.add_argument("--previa", dest="previa", action="store_true", default=True)
    previa.add_argument("--sem-previa", dest="previa", action="store_false")
    return parser.parse_args()


def ffmpeg_exe():
    escolhido = os.environ.get("FFMPEG")
    if escolhido:
        return escolhido
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def rodar(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def drenar(pipe, acumulado):
    acumulado.append(pipe.read())


def metadados(ffmpeg, caminho):
    p = rodar([ffmpeg, "-i", str(caminho)])
    info = p.stderr
    dur = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", info)
    linha_video = next((linha for linha in info.splitlines() if "Video:" in linha), "")
    codec = re.search(r"Video:\s*([^,(]+)", linha_video)
    pix_fmt = re.search(r",\s*([a-zA-Z0-9_]+)(?:\([^)]*\))?,\s*(\d+x\d+)", linha_video)
    taxa = re.search(r"([\d.]+)\s*fps", linha_video)
    duracao = (int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3])) if dur else None
    tamanho = caminho.stat().st_size / 1_000_000
    print(f"{caminho}: duração={duracao:.3f}s" if duracao is not None else f"{caminho}: duração indisponível")
    if codec and pix_fmt:
        print(f"  resolução={pix_fmt[2]} fps={taxa[1] if taxa else 'indisponível'} codec={codec[1].strip()} pix_fmt={pix_fmt[1]}")
    print(f"  tamanho={tamanho:.2f} MB")


async def principal(args):
    if not (args.pagina / "index.html").is_file():
        raise FileNotFoundError(f"Não encontrei {args.pagina / 'index.html'}")
    if args.de < 0 or (args.ate is not None and args.ate <= args.de):
        raise ValueError("Use --de >= 0 e --ate maior que --de")
    saida = Path(args.saida).expanduser().resolve()
    previas = {}
    if args.previa:
        # Os nomes das prévias derivam da saída; se coincidirem com ela, o ffmpeg
        # receberia o mesmo arquivo como entrada e saída.
        previas = {"mp4": saida.with_name(f"{saida.stem}-previa.mp4"),
                   "gif": saida.with_name(f"{saida.stem}-previa.gif")}
        for destino in previas.values():
            if destino == saida:
                raise ValueError(f"A prévia {destino.name} coincide com a saída {saida.name}; escolha outro --saida")
    ffmpeg = ffmpeg_exe()
    servidor, thread = iniciar_servidor(args.pagina.resolve())
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(viewport={"width": 1920, "height": 1080},
                                          device_scale_factor=1, color_scheme="light")
            await page.goto(f"http://127.0.0.1:{servidor.server_port}/index.html?render=1",
                            wait_until="load")
            await page.evaluate("() => window.demo.pronto")
            dados = await page.evaluate("() => ({duracao: window.demo.duracao, fps: window.demo.fps})")
            fps = args.fps or int(dados["fps"])
            if fps <= 0:
                raise ValueError("O fps deve ser positivo")

            if args.quadros is not None:
                from PIL import Image, ImageDraw
                from io import BytesIO
                tempos = [float(x.strip()) for x in args.quadros.split(",") if x.strip()]
                pasta = Path(args.saida).resolve().parent / "quadros"
                pasta.mkdir(parents=True, exist_ok=True)
                imagens = []
                for t in tempos:
                    await page.evaluate("t => window.demo.seek(t)", t)
                    await page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
                    bruto = await page.screenshot(type="png", clip={"x": 0, "y": 0, "width": 1920, "height": 1080})
                    nome = f"quadro-{t:g}s.png"
                    destino = pasta / nome
                    destino.write_bytes(bruto)
                    imagem = Image.open(BytesIO(bruto)).convert("RGB").resize((480, 270))
                    imagens.append((t, imagem))
                    print(f"Quadro {t:g}s: {destino}")
                colunas = 3
                linhas = (len(imagens) + colunas - 1) // colunas
                folha = Image.new("RGB", (colunas * 480, linhas * 300), "white")
                draw = ImageDraw.Draw(folha)
                for i, (t, imagem) in enumerate(imagens):
                    x, y = (i % colunas) * 480, (i // colunas) * 300
                    folha.paste(imagem, (x, y))
                    draw.text((x + 8, y + 275), f"{t:g} s", fill="black")
                folha.save(pasta / "folha.png")
                await browser.close()
                return

            inicio = args.de
            fim = min(args.ate if args.ate is not None else float(dados["duracao"]),
                      float(dados["duracao"]))
            n = round((fim - inicio) * fps)
            if n <= 0:
                raise ValueError("O trecho não contém quadros")
            saida.parent.mkdir(parents=True, exist_ok=True)
            # Sem estatísticas; o stderr é drenado em thread para o pipe nunca encher.
            cmd = [ffmpeg, "-y", "-hide_banner", "-nostats", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "png", "-i", "-",
                   "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264",
                   "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
                   "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                   "-movflags", "+faststart", str(saida)]
            proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL,
                                    stderr=subprocess.PIPE)
            erro_ffmpeg = []
            leitor_stderr = threading.Thread(target=drenar, args=(proc.stderr, erro_ffmpeg), daemon=True)
            leitor_stderr.start()
            comeco = time.monotonic()
            try:
                for i in range(n):
                    t = inicio + i / fps
                    await page.evaluate("t => window.demo.seek(t)", t)
                    await page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
                    png = await page.screenshot(type="png", clip={"x": 0, "y": 0, "width": 1920, "height": 1080})
                    proc.stdin.write(png)
                    percentual = int((i + 1) * 100 / n)
                    if (i + 1) % max(1, n // 20) == 0 or i + 1 == n:
                        print(f"Progresso: {percentual}% ({i + 1}/{n})", flush=True)
                proc.stdin.close()
                leitor_stderr.join()
                stderr = b"".join(erro_ffmpeg).decode("utf-8", "replace")
                rc = proc.wait()
                if rc:
                    print(stderr, file=sys.stderr)
                    raise RuntimeError(f"ffmpeg terminou com código {rc}")
            except BaseException:
                if proc.poll() is None:
                    proc.kill()
                    proc.wait()
                leitor_stderr.join()
                raise
            print(f"Tempo total: {time.monotonic() - comeco:.1f}s")
            await browser.close()
    finally:
        servidor.shutdown()
        servidor.server_close()
        thread.join()

    arquivos = [saida]
    if args.previa:
        mp4 = previas["mp4"]
        gif = previas["gif"]
        r = rodar([ffmpeg, "-y", "-i", str(saida), "-vf", "scale=960:540", "-c:v", "libx264",
                   "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)])
        if r.returncode:
            raise RuntimeError(r.stderr)
        r = rodar([ffmpeg, "-y", "-i", str(saida), "-vf",
                   "fps=12,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a",
                   str(gif)])
        if r.returncode:
            raise RuntimeError(r.stderr)
        arquivos += [mp4, gif]
    for arquivo in arquivos:
        metadados(ffmpeg, arquivo)


if __name__ == "__main__":
    try:
        asyncio.run(principal(argumentos()))
    except Exception as erro:
        print(f"Erro: {erro}", file=sys.stderr)
        sys.exit(1)
