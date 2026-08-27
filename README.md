# FluencyAI

Aplicação estática, responsiva e acessível para aprendizagem de inglês A1. Funciona em GitHub Pages sem etapa de build e mantém autenticação e sincronização de progresso no Supabase.

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
2. Abra a trilha e confirme 15 aulas, com apenas a primeira desbloqueada.
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
