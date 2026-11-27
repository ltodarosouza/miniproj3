# 23. Streak conta o dia no fuso do Brasil

- **Contexto:** issue #58. O streak agrupava os posts pelo dia em UTC. Post
  depois das 21h (horário de Brasília) contava para o dia seguinte, e a chama
  da navegação apagava à noite mesmo com post feito. Ela também demorava até
  1 minuto para acender depois de publicar.
- **Opções:** fuso fixo UTC−3, `America/Sao_Paulo` nomeado, ou o fuso do
  navegador de cada pessoa.
- **Escolha:**
  - Um único fuso para o produto: `America/Sao_Paulo`. Backend com
    `ZoneInfo` (`FUSO_BRASIL` e `dia_no_brasil()` em `core/streak.py`, com o
    pacote `tzdata` para não depender da base de fusos do servidor). Frontend
    com `Intl.DateTimeFormat(..., { timeZone: "America/Sao_Paulo" })` em
    `useStreak`, para a chama e o contador virarem o dia no mesmo instante,
    inclusive para quem está em outro fuso (ex.: Manaus).
  - `criarPost` e `apagarPost` disparam `troca:posts-mudaram`; `useStreak`
    escuta esse evento e a volta para a aba, além do intervalo de 60 s. Uma
    consulta por vez: o intervalo pula se já houver uma em andamento, e um
    evento no meio dela agenda uma nova leitura no final.
- **O que cortamos e por quê:** fuso por pessoa (o público é brasileiro e o
  dia do streak precisa ser o mesmo no servidor e na tela).
