# 46. Demo em vídeo na página inicial e no README

Pedido direto do dono, sem issue.

- **Contexto.** A demo de 46 s ([docs/demo/](../demo/README.md)) existia só como MP4 de 12 MB
  (1080p, 60 fps) fora do repositório. Quem chega pelo deploy ou pelo GitHub não a via.
- **Opções.** Versionar o MP4 original; publicar num serviço de vídeo externo; versionar uma
  versão web leve servida pela própria Vercel; um GIF no README.
- **Escolha.** Versão web em `frontend/public/demo/colmatch-demo.mp4` (H.264 1280×720, 30 fps,
  CRF 26, sem áudio, `faststart`, 2,3 MB) e um poster WebP de 41 KB. A página inicial (`/`, só para
  quem não está logado) mostra a demo num `<video>` com `controls`, `muted`, `playsInline`,
  `preload="metadata"` e o poster, além de um parágrafo que descreve o que aparece e um link para
  abrir o arquivo. O README mostra uma capa estática com botão de play
  (`docs/demo/capa-readme.webp`, 33 KB) que abre o MP4 do repositório no GitHub (o link funciona
  em qualquer branch, sem esperar o deploy), porque o README não toca `<video>` com arquivo do
  repositório.
- **Comando.** A partir do MP4 gerado pelo `render.py`, com o ffmpeg do `imageio-ffmpeg`:
  `ffmpeg -i colmatch-demo.mp4 -vf "scale=1280:720:flags=lanczos,fps=30" -c:v libx264 -preset veryslow -crf 26 -profile:v high -pix_fmt yuv420p -movflags +faststart -an colmatch-demo-web.mp4`;
  o poster é o quadro de 3,5 s (`-ss 3.5 -frames:v 1`, WebP qualidade 82).
- **O que cortamos e por quê.** O MP4 de 12 MB no git (pesaria em todo clone e carregaria devagar
  no celular), um serviço externo (mais uma conta e um link que pode sair do ar) e um GIF animado
  no README (a prévia de 21 s em WebP animado deu 2,6 MB; a capa estática carrega na hora).
