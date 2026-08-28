const { test, expect } = require('@playwright/test');

const storageKey = 'fluencyai.student.v1.user-test';
const sessionKey = 'fluencyai.auth.session.v1';

async function openExercise(page) {
  await page.addInitScript(({ storageKey, sessionKey }) => {
    localStorage.setItem(sessionKey, JSON.stringify({access_token:'token',refresh_token:'refresh',expires_at:9999999999,user:{id:'user-test',email:'aluno@teste.com',user_metadata:{name:'Aluno Teste'}}}));
    localStorage.setItem(storageKey, JSON.stringify({
      profile: { name: 'Aluno Teste', daily: '10 min', goal: 'Estudos', reason: 'Falar sem medo' },
      onboarding: true,
      placement: { level: 'A1', scores: { Vocabulário: 100, Gramática: 100, Leitura: 100, Listening: 100 } },
      lessonStep: 3,
      currentLesson: 'greetings',
      lessonAnswers: {},
      xp: 0,
      errors: {},
      completed: [],
      words: {}
    }));
  }, { storageKey, sessionKey });
  let record;
  await page.route('https://bccymgcmmqcpaudjhknv.supabase.co/**', async route => {
    const request=route.request();
    if (request.url().includes('student_progress')) {
      if(request.method()==='POST'){record=request.postDataJSON();return route.fulfill({status:201,json:{}})}
      const initial=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),storageKey));
      return route.fulfill({json:[record||{profile:initial.profile,progress:initial}]});
    }
    return route.fulfill({json:{}});
  });
  await page.goto('/#lesson');
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '3');
}

async function savedState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
}

test('resposta correta permite continuar', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'am', exact: true }).click();
  await expect(page.locator('#feedback-greetings-3')).toContainText('Muito bem');
  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '4');
});

test('resposta errada registra erro, não dá XP e oferece repetição e explicação', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'is', exact: true }).click();
  await expect(page.locator('#feedback-greetings-3')).toContainText('salvo para revisão');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver explicação' })).toBeVisible();
  let saved=await savedState(page);
  expect(saved.lessonAnswers['greetings:3'].firstCorrect).toBe(false);
  expect(saved.errors['greetings:3']).toBe(1);
  expect(saved.xp).toBe(0);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByRole('button', { name: 'am', exact: true }).click();
  saved=await savedState(page);
  expect(saved.lessonAnswers['greetings:3'].correct).toBe(true);
  expect(saved.lessonAnswers['greetings:3'].firstCorrect).toBe(false);
});

test('retoma exatamente etapa, seleção e feedback após recarregar e sincronizar', async ({ page }) => {
  await openExercise(page);
  await page.getByRole('button', { name: 'are', exact: true }).click();
  await expect.poll(async()=> (await savedState(page)).pendingSync).toBe(false);
  await page.reload();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '3');
  await expect(page.getByRole('button', { name: 'are', exact: true })).toHaveClass(/wrong/);
  await expect(page.locator('#feedback-greetings-3')).toContainText('salvo para revisão');
});

test('não revela resposta e impede avanço antes da tentativa', async ({ page }) => {
  await openExercise(page);
  await expect(page.getByText('Usamos “am”')).toBeHidden();
  await page.getByRole('button', { name: 'Continuar →' }).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-step', '3');
  await expect(page.locator('#toast')).toContainText('Faça uma tentativa');
});
