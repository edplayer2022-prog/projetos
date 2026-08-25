const { test, expect } = require('@playwright/test');

const base = 'https://bccymgcmmqcpaudjhknv.supabase.co';
const user = (id='u1', email='ana@example.com') => ({ id, email, user_metadata:{name:'Ana'} });
const session = (id='u1', email) => ({ access_token:`token-${id}`, refresh_token:`refresh-${id}`, expires_at:9999999999, user:user(id,email) });

async function mockSupabase(page, records = new Map()) {
  await page.route(`${base}/**`, async route => {
    const req=route.request(), url=req.url();
    if(url.includes('/token?grant_type=password')) { const body=req.postDataJSON(); return route.fulfill({json:session(body.email.startsWith('bia')?'u2':'u1',body.email)}); }
    if(url.includes('/signup')) return route.fulfill({json:{user:user('u1'),session:null}});
    if(url.includes('/logout')||url.includes('/recover')||url.includes('/user')) return route.fulfill({json:{}});
    if(url.includes('/student_progress')) {
      const id=new URL(url).searchParams.get('user_id')?.replace('eq.','') || req.postDataJSON()?.user_id;
      if(req.method()==='GET') return route.fulfill({json:records.has(id)?[records.get(id)]:[]});
      records.set(id,req.postDataJSON()); return route.fulfill({status:201,json:{}});
    }
    return route.fulfill({json:{}});
  });
}

test('cadastro valida confirmação e solicita confirmação de e-mail', async ({page})=>{
  await mockSupabase(page); await page.goto('/'); await page.getByRole('button',{name:'Criar conta'}).click();
  await page.getByLabel('Nome').fill('Ana'); await page.getByLabel('E-mail').fill('ana@example.com'); await page.getByLabel('Senha',{exact:true}).fill('12345678'); await page.getByLabel('Confirmar senha').fill('87654321'); await page.getByRole('button',{name:'Cadastrar'}).click();
  await expect(page.getByRole('alert')).toContainText('não coincidem');
  await page.getByLabel('Confirmar senha').fill('12345678'); await page.getByRole('button',{name:'Cadastrar'}).click();
  await expect(page.locator('.form-card')).toContainText('Confirme seu e-mail');
});

test('login, restauração de sessão e logout', async ({page})=>{
  await mockSupabase(page); await page.goto('/'); await page.getByLabel('E-mail').fill('ana@example.com'); await page.getByLabel('Senha').fill('12345678'); await page.getByRole('button',{name:'Entrar'}).click();
  await expect(page.getByText('Conte sobre seus objetivos')).toBeVisible(); await page.reload(); await expect(page.getByText('Conte sobre seus objetivos')).toBeVisible();
  // Complete a minimal cached profile so the shell exposes logout.
  await page.evaluate(()=>localStorage.setItem('fluencyai.student.v1.u1',JSON.stringify({profile:{name:'Ana',daily:'10 min',goal:'Estudos',reason:'Falar sem medo'},onboarding:true,placement:{level:'A1',scores:{Vocabulário:100,Gramática:100,Leitura:100,Listening:100}}})));
  await page.reload(); await page.getByRole('button',{name:'Sair',exact:true}).click(); await expect(page.getByRole('button',{name:'Entrar'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('fluencyai.auth.session.v1'))).toBeNull();
});

test('migra e sincroniza progresso local e isola usuários', async ({page})=>{
  const records=new Map(); await mockSupabase(page,records);
  await page.addInitScript(()=>{if(!localStorage.getItem('fluencyai.student.v1.u1'))localStorage.setItem('fluencyai.student.v1',JSON.stringify({profile:{name:'Legado',daily:'10 min'},xp:75,onboarding:false}))});
  await page.goto('/'); await page.getByLabel('E-mail').fill('ana@example.com'); await page.getByLabel('Senha').fill('12345678'); await page.getByRole('button',{name:'Entrar'}).click();
  await expect.poll(()=>records.get('u1')?.progress?.xp).toBe(75); expect(await page.evaluate(()=>localStorage.getItem('fluencyai.student.v1.u1'))).toBeTruthy();
  await page.evaluate(()=>{localStorage.removeItem('fluencyai.auth.session.v1')}); await page.goto('/'); await page.getByLabel('E-mail').fill('bia@example.com'); await page.getByLabel('Senha').fill('12345678'); await page.getByRole('button',{name:'Entrar'}).click();
  await expect(page.getByText('Conte sobre seus objetivos')).toBeVisible(); expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('fluencyai.student.v1.u2')).xp)).toBe(0);
});
