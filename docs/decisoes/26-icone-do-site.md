# 26. Ícone do site: favicon.ico, PNG 32 e SVG, sem trocar o desenho

- **Contexto:** issue #63. O ícone não aparecia de forma confiável na aba.
  Medindo o HTML do build, a causa era maior que a falta do `.ico`: como o
  `layout.tsx` definia `metadata.icons` só com `apple`, o Next deixava de
  gerar a tag do `app/icon.svg`, e a página não tinha nenhum
  `<link rel="icon">`.
- **Opções:** tirar o `metadata.icons` e depender só dos arquivos de
  convenção (`app/icon.*`, `app/apple-icon.png`), ou declarar tudo
  explicitamente; manter as setas de troca ou desenhar um ícone novo.
- **Escolha:** `app/favicon.ico` com 16/32/48 (o Next gera a tag dele
  sozinho) e, em `metadata.icons`, `icone-32.png`, `icon.svg` (por último,
  para Chrome/Firefox/Edge preferirem o SVG) e o `apple-touch-icon.png` de
  180×180. Os dois arquivos novos foram renderizados do `icon.svg` com
  `resvg-py` + Pillow (`uv run --with resvg-py --with pillow`). O desenho das
  setas continua o mesmo. Os PNGs do manifest (192/512) e o apple-touch já
  eram quadrados de fundo sólido iguais ao `icone-base.svg`, com as setas
  dentro dos 80% centrais, então o mesmo 512 serve para `any` e `maskable`.
- **O que cortamos e por quê:** um ícone novo mais marcante ficaria para uma
  decisão de marca do time, não desta correção. O script de geração não foi
  versionado: são só dois arquivos. Para refazer, renderize o `icon.svg` com
  `resvg_py.svg_to_bytes(svg_path="frontend/app/icon.svg", width=N, height=N)`
  em 16, 32 e 48; salve o de 32 como `frontend/public/icone-32.png` e junte os
  três com Pillow em `frontend/app/favicon.ico`
  (`img48.save(..., format="ICO", sizes=[(16,16),(32,32),(48,48)])`).
