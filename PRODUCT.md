# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Iniciantes em tech: universitários, alunos de bootcamp e pessoas migrando de área que estudam programação e disciplinas da base (Cálculo 1, Estrutura de Dados). Estão travados em algum assunto, não têm a quem perguntar e muitas vezes têm vergonha de perguntar. Ao mesmo tempo, já sabem alguma coisa que outra pessoa quer aprender. Usam a rede no celular e no notebook, entre aulas e à noite, enquanto estudam.

## Product Purpose
Rede social de troca de habilidades. Cada pessoa diz o que sabe e o que quer aprender; a rede mostra quem pode te ensinar e, em destaque, com quem dá para trocar ("te ensino React, você me ensina Cálculo 1"). Depois do match, as duas pessoas conversam no chat, agendam a troca numa chamada e se avaliam. Sucesso: uma troca agendada termina com avaliação dos dois lados e a pessoa volta para marcar outra.

## Positioning
Não é rede de emprego (LinkedIn) nem de aula paga: é troca entre iguais, sem dinheiro. O mecanismo próprio é o match em dois níveis ("pode te ensinar" e "match de troca") calculado a partir do que cada um sabe e quer aprender, com a rotina de estudos postada servindo de prova de que a pessoa estuda aquilo.

## Operating Context
Projeto acadêmico (Mini-projeto 3 da Trilha UFPB), time de 4 pessoas, entrega em 27/11/2026, avaliado por banca que usa a rede, vê um vídeo de 4 minutos e ouve um pitch. Fluxo principal que a banca testa: cadastro, login, post, follow, feed. Fluxo do produto: cadastrar habilidades, ver matches, conversar, agendar, avaliar.

## Capabilities and Constraints
- Stack fixa: FastAPI + SQLAlchemy + SQLite no backend; Next.js 15 + TypeScript + Tailwind 4 no frontend.
- Funcionalidades: auth, perfil com nível 1–5 por habilidade (informativo), catálogo de habilidades com autocomplete e IA que mapeia texto livre para item existente, posts de rotina (texto, habilidade, tempo estudado, foto opcional), curtidas, comentários planos, feed misto (seguidos + quem pode me ensinar), streak, follow, match em dois níveis, chat 1-para-1 com polling, agendamento interno com link para o Google Agenda, avaliação pós-troca (estrelas + feedback).
- Quatro pessoas constroem telas em paralelo: o sistema visual precisa ser simples de reproduzir.
- Fora do escopo: pagamento, OAuth do Google, WebSocket, IA criando habilidades.
- Nome da rede: ainda não decidido.

## Brand Commitments
- Personalidade amigável e acolhedora: o iniciante não pode se sentir burro ao entrar.
- Cor principal verde-azulado (teal), escolhida para fugir do azul do LinkedIn.
- Tema claro e escuro, seguindo o sistema.
- Movimento fluido e orgânico, com qualidade, nunca forçado: responde a ação (tocar, curtir, enviar, arrastar), nunca à posição do mouse, com transições suaves entre estados.
- Código sem comentários; explicações vão nos markdowns.

## Evidence on Hand
Nenhum usuário, depoimento ou métrica real. O seed é fictício e deve ser tratado como tal. Não inventar números de uso, parcerias ou depoimentos.

## Product Principles
1. A troca vem primeiro: toda tela deve aproximar a pessoa de um match ou de uma troca agendada.
2. Ninguém sai de mãos vazias: sempre mostrar quem pode te ensinar, mesmo sem troca recíproca.
3. Iniciante é bem-vindo: linguagem leve, nível informativo, nada que pareça ranking de quem sabe mais.
4. Prova, não promessa: a rotina de estudos e as avaliações mostram quem sabe, não um selo autodeclarado.

## Accessibility & Inclusion
Contraste WCAG AA nos dois temas, foco visível por teclado, e respeito a `prefers-reduced-motion` em todas as animações.
