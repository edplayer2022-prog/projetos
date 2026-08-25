# FluencyAI

Aplicação estática e responsiva de aprendizagem de inglês, com autenticação e sincronização de progresso pelo Supabase.

## Executar localmente

```bash
python3 -m http.server 4173
```

Acesse `http://localhost:4173`. A configuração pública do projeto Supabase está em `auth.js`; somente a chave publicável é enviada ao navegador.

## Configuração do banco

Crie a tabela e habilite RLS no Supabase antes de publicar:

```sql
create table if not exists public.student_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb
);
alter table public.student_progress enable row level security;
create policy "students read own progress" on public.student_progress
  for select using (auth.uid() = user_id);
create policy "students insert own progress" on public.student_progress
  for insert with check (auth.uid() = user_id);
create policy "students update own progress" on public.student_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Em **Authentication → URL Configuration**, configure a URL publicada (e a URL local durante desenvolvimento) como redirect URL. A confirmação de cadastro e a recuperação de senha usam essa URL.

## Persistência e segurança

- A sessão do Supabase é restaurada automaticamente e renovada com o refresh token.
- `profile` e `progress` são gravados por upsert usando o `user_id` autenticado.
- No primeiro login, o progresso legado em `fluencyai.student.v1` é migrado; depois, cada usuário possui uma cópia local isolada.
- Alterações de nivelamento, respostas, etapas, XP, streak, aulas e revisões disparam sincronização. Se a rede cair, a cópia local continua disponível e volta a sincronizar quando a conexão retorna.
- Senhas nunca são armazenadas no `localStorage`. O frontend usa apenas a chave publicável; RLS impede acesso ao progresso de outra pessoa.

## Testes

```bash
npm test
```
