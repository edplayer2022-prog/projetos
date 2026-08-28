# FluencyAI

Aplicação estática, responsiva e acessível para aprendizagem de inglês. Funciona em GitHub Pages sem etapa de build e mantém autenticação e sincronização de progresso no Supabase.

## Arquitetura curricular (fase 1 do Plano Mestre A1–C2)

`curriculum.js` é o catálogo independente da UI: **CEFR Level → Module → Unit → Lesson**. `lessons.js` contém as aulas publicadas e seus blocos reutilizáveis; os ids A1 antigos continuam canônicos. A UI apenas percorre o catálogo. A1 está disponível, organizado em Getting Started, Everyday Life, Around Town e Review and Exam; A2–C2 aparecem somente como roadmap bloqueado, sem ações decorativas.

Os blocos aceitos incluem objetivo, explicação, vocabulário, exemplos, pronúncia, áudio/listening, diálogo, leitura, múltipla escolha, lacunas, matching, ordering/sentence builder, tradução, writing, speaking, conversation, review, quiz e summary. A unidade A1 / Getting Started / Greetings cobre saudações por período, despedida, apresentação, nome, origem, alfabeto, números e revisão/checkpoint reaproveitando `greetings`.

### Estado, recomendação e migração

As aulas usam `locked`, `available`, `in_progress`, `completed` e `review_required`. `nextRecommendedActivity(progress)` prioriza erros/revisão, retomada incompleta, checkpoint, próxima aula, meta diária e prática. Checkpoints têm mínimo configurável (70% por padrão), guardam tentativas e nunca apagam respostas na revisão.

Ao carregar cache legado ou resposta do Supabase, `migrateProgress` preserva ids, respostas, XP, palavras e conclusões e acrescenta defensivamente `schemaVersion: 2`, checkpoints, revisões e sete habilidades: speaking, listening, vocabulary, grammar, reading, writing e pronunciation. O namespace por `user_id`, a escolha da versão mais recente e o reenvio offline continuam inalterados.

## Trilha A1

1. Greetings and Introductions
2. Personal Information
3. Numbers and Age
4. Family and Friends
5. Daily Routine — checkpoint
6. Time and Schedules
7. Food and Drinks
8. At a Restaurant
9. Home and Furniture
10. Places in Town — checkpoint
11. Shopping and Prices
12. Work and Occupations
13. Transportation
14. Health and Emergencies
15. A1 Final Challenge — prova final com resultado por habilidade

Cada aula tem objetivo, oito palavras com tradução/pronúncia/exemplo, frases reais e 14 etapas: vocabulário, áudio via `SpeechSynthesis`, compreensão de listening, Vocabulary Match, lacunas, Sentence Builder, múltipla escolha, tradução contextual, construção guiada, escrita livre, Real Life Dialogue, revisão e resultado. Alternativas são embaralhadas uma vez e persistidas para que a retomada seja exata.

## Pratique agora

Os três cards do painel são atividades completas, acessíveis por clique, `Enter` ou barra de espaço:

* **Vocabulary Match:** reúne dez pares da aula atual, embaralha as colunas independentemente, oferece áudio e feedback e registra tempo, precisão, erros, revisão e XP.
* **Listening Challenge:** traz cinco questões entre múltipla escolha e lacunas, áudio com repetição e velocidades 0.75x/1x/1.25x; transcrição, tradução e explicação só aparecem após responder.
* **Desafio diário:** usa data e conteúdo A1 como semente para alternar vocabulário, listening, Sentence Builder e diálogo. A conclusão, streak e a chave de XP único são sincronizadas pelo Supabase.

Seleções, questão atual, tentativas e rascunho diário ficam no progresso local e remoto, permitindo retomar uma atividade interrompida. O mapa `xpAwards` impede que repetir ou reabrir uma conclusão conceda XP novamente.

A primeira tentativa define a pontuação. Um erro é salvo para revisão e não bloqueia a sequência; **Tentar novamente** e **Ver explicação** aparecem somente depois da tentativa. A conclusão exige 70%. Abaixo disso, as respostas permanecem salvas e a revisão é recomendada. As aulas são desbloqueadas progressivamente.

## Executar localmente

```bash
python3 -m http.server 4173
```

Acesse `http://localhost:4173`. Como todos os caminhos são relativos e a navegação usa hash, a mesma versão pode ser publicada diretamente no GitHub Pages.

## Supabase

Crie a tabela e habilite RLS:

```sql
create table if not exists public.student_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb
);
alter table public.student_progress enable row level security;
create policy "students read own progress" on public.student_progress for select using (auth.uid() = user_id);
create policy "students insert own progress" on public.student_progress for insert with check (auth.uid() = user_id);
create policy "students update own progress" on public.student_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Configure a URL publicada e a URL local em **Authentication → URL Configuration**. O upsert sincroniza perfil, aula/etapa atual, ordem das alternativas, respostas, tentativas, erros, notas, resultados por habilidade, XP, conclusão, desafio diário e agenda de revisão. Uma cópia isolada por usuário no `localStorage` oferece retomada offline e é reenviada quando a conexão volta. Senhas nunca são armazenadas localmente.

## Testes automatizados

```bash
npm test
```

Os testes unitários cobrem normalização das respostas, primeira tentativa/repetição, nota mínima, desbloqueio e escolha da versão mais nova na sincronização. Os testes Playwright cobrem autenticação, resposta certa/errada, avanço, retomada e persistência no Supabase simulado.

## Roteiro de teste manual

1. Crie uma conta, confirme o e-mail, entre e conclua preferências e nivelamento.
2. Abra Meu Caminho; confirme A1 com 15 aulas mapeadas e apenas a primeira desbloqueada, além de A2–C2 identificados como roadmap bloqueado e sem botões.
3. Em uma atividade, tente avançar sem responder; confirme que a resposta não é revelada.
4. Responda errado; confira erro salvo, zero crédito, **Tentar novamente**, **Ver explicação** e possibilidade de continuar.
5. Use novamente com variações de caixa, espaços e pontuação; confirme a aceitação, sem alterar o crédito da primeira tentativa.
6. Recarregue e saia/entre durante uma atividade; confirme aula, etapa, resposta, texto e ordem das alternativas exatamente restaurados.
7. Desligue a rede, responda, religue e confirme “Progresso sincronizado”.
8. Obtenha 60% e confirme recomendação de revisão sem perda; obtenha 70% e confirme conclusão, XP e desbloqueio seguinte.
9. Confira áudio, listening, match, lacuna, ordem, tradução, escrita, diálogo e revisão usando mouse e somente teclado.
10. Conclua aulas 5, 10 e 15; confira checkpoints e resultado final por Vocabulário, Listening, Gramática, Escrita e Conversação.
11. Conclua o desafio diário uma vez e verifique que XP não pode ser recebido duas vezes no mesmo dia.
12. Teste em 375 px, tablet e desktop e publique a raiz no GitHub Pages para validar os assets relativos.

## Próximas fases

Ficam explicitamente fora desta entrega: expansão de Vocabulary/Flashcards/Review; Labs; AI Conversation/Real Life; Admin/CMS; e publicação do conteúdo completo A2–C2.
