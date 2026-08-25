# FluencyAI

Aplicação estática e responsiva para testar a experiência real de um novo aluno de inglês. O projeto usa somente HTML, CSS e JavaScript, pode ser publicado diretamente no GitHub Pages e salva toda a evolução no `localStorage`.

## Executar localmente

Não há dependências nem etapa de build:

```bash
python3 -m http.server 4173
```

Acesse `http://localhost:4173`. Para simular outro dispositivo, use o modo responsivo das ferramentas do navegador.

## Funcionalidades

- Boas-vindas, perfil, objetivo, disponibilidade e motivação;
- Nivelamento A1–B2 com vocabulário, gramática, leitura e listening por voz do navegador;
- Resultado por habilidade e plano personalizado;
- Trilha A1 de cinco aulas, com progressão bloqueada;
- Primeira aula completa: palavras, contexto, áudio, quiz, frase e conversação escrita;
- Quatro aulas práticas adicionais para concluir a trilha iniciante;
- Revisão espaçada com intervalos ajustados conforme acerto ou erro;
- XP, sequência diária, tempo, precisão, progresso e erros recorrentes;
- Retomada do teste e da aula após fechar a página;
- Exclusão completa dos dados pelo perfil.

## Roteiro de teste do aluno novo

> Antes de começar, abra **Perfil → Apagar progresso** caso já exista um aluno salvo, ou limpe a chave `fluencyai.student.v1` do localStorage.

1. Abra a página e confirme a tela de boas-vindas. Preencha nome e, opcionalmente, e-mail; clique em **Criar meu perfil**.
2. Selecione uma opção em cada grupo de objetivo, tempo diário e motivação. Clique em **Começar teste de nível**.
3. Responda às oito questões. Nas questões de listening, clique em **Ouvir frase**. Confirme que **Continuar** fica desabilitado até escolher uma resposta.
4. No meio do teste, clique em **Sair e continuar depois**, recarregue a página e valide que a questão atual foi preservada. Continue o teste.
5. Confira nível, percentuais das quatro habilidades e foco do plano. Clique em **Conhecer meu plano**.
6. No dashboard, confira nome, nível, meta e a primeira aula. Abra **Minha trilha** e valide que aulas futuras começam bloqueadas.
7. Inicie a aula 1. Ouça cada palavra, avance pelos exemplos, responda listening e gramática, monte `My name is Leo` e escreva uma resposta como `Hello! My name is Ana.` na conversação.
8. Conclua a aula. Confira o XP, a liberação da aula 2 e as quatro palavras adicionadas à revisão.
9. Abra **Revisar palavras**, revele uma resposta e marque **Acertei** ou **Errei**. Confira que o cartão sai da fila do dia.
10. Complete as aulas seguintes marcando a confirmação de leitura, áudio e repetição. Confira a trilha em 100%.
11. Abra **Meu progresso** e valide XP, sequência, precisão e erros recorrentes (provoque um erro em exercício para testá-los).
12. Recarregue ou feche e reabra a página. Confirme que perfil, teste, aula, revisão e métricas continuam salvos.
13. Em **Perfil**, clique em **Apagar progresso e reiniciar teste**, confirme o alerta e valide o retorno às boas-vindas.

## Persistência e áudio

Os dados permanecem apenas no navegador, na chave `fluencyai.student.v1`. O listening usa a API nativa `speechSynthesis`; a voz disponível varia conforme o sistema e o navegador.
