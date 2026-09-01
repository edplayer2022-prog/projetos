const {test,expect}=require('@playwright/test');
const storageKey='fluencyai.student.v1.continuation-user',sessionKey='fluencyai.auth.session.v1';

async function openWithState(page,progress,hash='dashboard'){
  const initial={profile:{name:'Aluno Continuação',daily:'15 min',goal:'Estudos',reason:'Falar sem medo'},onboarding:true,placement:{level:'A1',scores:{}},completed:['greetings'],currentLesson:'personal',lessonStep:0,lessonAnswers:{},errors:{'greetings:3':2},words:{hello:{meaning:'olá',next:Date.now()+86400000}},minutes:15,...progress};
  await page.addInitScript(({storageKey,sessionKey,initial})=>{localStorage.setItem(sessionKey,JSON.stringify({access_token:'token',refresh_token:'refresh',expires_at:9999999999,user:{id:'continuation-user',email:'aluno@teste.com',user_metadata:{name:'Aluno Continuação'}}}));localStorage.setItem(storageKey,JSON.stringify(initial))},{storageKey,sessionKey,initial});
  let record;
  await page.route('https://bccymgcmmqcpaudjhknv.supabase.co/**',async route=>{const request=route.request();if(request.url().includes('student_progress')){if(request.method()==='POST'){record=request.postDataJSON();return route.fulfill({status:201,json:{}})}return route.fulfill({json:[record||{profile:initial.profile,progress:initial}]})}return route.fulfill({json:{}})});
  await page.goto(`/#${hash}`);
  return initial;
}

test('erros antigos, meta atingida e revisão futura mantêm próxima aula acessível',async({page})=>{
  await openWithState(page,{});
  await expect(page.locator('.hero-card h2')).toHaveText(/Personal Information/);
  await expect(page.getByText('Meta concluída — continue se quiser')).toBeVisible();
  await expect(page.locator('.hero-card')).not.toContainText('Revisão personalizada');
});

test('review vazio oferece três saídas e abre a próxima aula',async({page})=>{
  await openWithState(page,{},'review');
  await expect(page.getByRole('heading',{name:'Revisão em dia!'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Praticar mais vocabulário'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Voltar ao início'})).toBeVisible();
  await page.getByRole('button',{name:'Continuar próxima aula'}).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-id','personal');
});

test('desafio concluído permite continuar ou fazer prática extra',async({page})=>{
  const day=new Date().toISOString().slice(0,10);
  await openWithState(page,{dailyChallenges:{[day]:{date:day,type:'vocabulary',lessonId:'greetings',completed:true,xp:10}}},'daily');
  await expect(page.getByRole('button',{name:'Continuar estudando'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Fazer prática extra'})).toBeVisible();
  await page.getByRole('button',{name:'Continuar estudando'}).click();
  await expect(page.locator('.lesson-page')).toHaveAttribute('data-id','personal');
});

test('refresh migra sem apagar aulas, erros e agendamento futuro',async({page})=>{
  await openWithState(page,{schemaVersion:1,completed:['greetings'],errors:{'greetings:3':4},xp:90});
  await page.reload();
  await expect(page.locator('.hero-card h2')).toHaveText(/Personal Information/);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  expect(saved.completed).toEqual(['greetings']);expect(saved.errors['greetings:3']).toBe(4);expect(saved.xp).toBe(90);expect(saved.words.hello.next).toBeGreaterThan(Date.now());
});
