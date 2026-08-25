const { test, expect } = require('@playwright/test');

const storageKey = 'fluencyai.student.v1';

async function openExercise(page) {
  await page.addInitScript(({ storageKey }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      profile: { name: 'Aluno Teste', daily: '10 min', goal: 'Estudos', reason: 'Falar sem medo' },
      onboarding: true,
      placement: { level: 'A1', scores: { Vocabulário: 100, Gramática: 100, Leitura: 100, Listening: 100 } },
      lessonStep: 3,
      lessonAnswers: {},
      xp: 0,
      errors: {},
      completed: [],
      words: {}
    }));
  }, { storageKey });
  await page.goto('/#lesson');
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '3');
}

async function savedState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
}

test('resposta correta permite continuar', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'am', exact: true }).click();
  await expect(page.locator('#feedback-exercise')).toContainText('Muito bem');
  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '4');
});

test('resposta errada exibe feedback, registra erro sem XP e permite chegar às etapas 5 e 6', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'is', exact: true }).click();
  await expect(page.locator('#feedback-exercise')).toContainText('resposta correta');
  await expect(page.getByRole('button', { name: 'is', exact: true })).toHaveClass(/wrong/);
  await expect(page.getByRole('button', { name: 'am', exact: true })).toHaveClass(/correct/);

  let state = await savedState(page);
  expect(state.lessonAnswers.exercise).toEqual({ selected: 0, correct: false });
  expect(state.errors.exercise).toBe(1);
  expect(state.xp).toBe(0);

  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '4');
  for (const word of ['My', 'name', 'is', 'Leo']) {
    await page.getByRole('button', { name: word, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Verificar frase' }).click();
  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '5');
  await expect(page.getByPlaceholder('Ex.: Hello! My name is Julia.')).toBeVisible();
});

test('atualizar após responder mantém a etapa, a seleção e o feedback', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'is', exact: true }).click();
  await page.reload();

  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '3');
  await expect(page.getByRole('button', { name: 'is', exact: true })).toHaveClass(/wrong/);
  await expect(page.getByRole('button', { name: 'am', exact: true })).toHaveClass(/correct/);
  await expect(page.locator('#feedback-exercise')).toContainText('resposta correta');
  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '4');
});

test('impede avanço somente quando nenhuma alternativa foi escolhida', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'Continuar →' }).click();

  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '3');
  await expect(page.locator('#toast')).toContainText('Escolha uma alternativa antes de continuar');

  await page.getByRole('button', { name: 'are', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '4');
});
