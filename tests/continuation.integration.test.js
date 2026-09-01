const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const root=path.join(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const day=()=>new Date().toISOString().slice(0,10);
const completed=['greetings','personal','numbers','family','routine','time'];

function affectedState(extra={}){
  return {schemaVersion:1,profile:{name:'Aluno Real',daily:'15 min',goal:'Estudos',reason:'Falar sem medo'},onboarding:true,placement:{level:'A1',scores:{}},completed,currentLesson:'food',lessonStep:0,lessonAnswers:{'greetings:3':{answered:true,firstCorrect:false}},errors:{'greetings:3':3,'time:4':1},words:{hello:{meaning:'olá',interval:2,next:Date.now()+86400000}},minutes:15,xp:125,...extra};
}

async function appWith(initial,hash='dashboard'){
  const dom=new JSDOM('<!doctype html><div id="app"></div><div class="toast" id="toast"><strong></strong><small></small></div>',{url:`http://localhost/#${hash}`,runScripts:'dangerously'});
  const {window}=dom,key='fluencyai.student.v1.integration-user';
  window.localStorage.setItem(key,JSON.stringify(initial));
  window.authService={getSession:async()=>({session:{access_token:'token',user:{id:'integration-user',email:'real@example.com',user_metadata:{name:'Aluno Real'}}},recovery:false}),loadProgress:async()=>null,saveProgress:async()=>{},signOut:async()=>{}};
  for(const file of ['curriculum.js','lessons.js','learning-core.js','script.js'])window.eval(source(file));
  await waitFor(()=>window.document.querySelector('.app-shell'));
  const navigate=async hash=>{window.location.hash=hash;window.dispatchEvent(new window.HashChangeEvent('hashchange'));await waitFor(()=>window.document.querySelector('.app-shell'));await tick()};
  const click=async text=>{const button=[...window.document.querySelectorAll('button')].find(x=>x.textContent.trim()===text);assert.ok(button,`botão “${text}” deve existir`);button.click();await tick();return button};
  return {window,key,navigate,click,close:()=>dom.window.close()};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function waitFor(predicate){for(let i=0;i<100;i++){if(predicate())return;await tick()}throw Error('interface não renderizou')}

test('estado 6/15 com erros históricos e revisão futura recomenda a próxima aula',async t=>{
  const app=await appWith(affectedState());t.after(app.close);
  assert.match(app.window.document.querySelector('.hero-card h2').textContent,/Food and Drinks/);
  assert.doesNotMatch(app.window.document.querySelector('.hero-card').textContent,/Revisão personalizada/);
  assert.match(app.window.document.body.textContent,/Meta concluída — continue se quiser/);
  assert.equal(app.window.document.querySelector('.progress-card').textContent.includes('6/15 aulas'),true);
});

test('revisão em dia expõe e aciona as três saídas com rotas válidas',async t=>{
  const app=await appWith(affectedState(),'review');t.after(app.close);
  assert.match(app.window.document.body.textContent,/Revisão em dia!/);
  await app.click('Continuar próxima aula');assert.equal(app.window.location.hash,'#lesson');assert.equal(app.window.document.querySelector('.lesson-page').dataset.id,'food');
  await app.navigate('review');await app.click('Praticar mais vocabulário');assert.equal(app.window.location.hash,'#vocabulary');assert.ok(app.window.document.querySelector('.match-board,.result-card'));
  await app.navigate('review');await app.click('Voltar ao início');assert.equal(app.window.location.hash,'#dashboard');assert.ok(app.window.document.querySelector('.hero-card'));
});

test('desafio diário concluído continua o estudo e mantém prática extra acessível',async t=>{
  const today=day(),state=affectedState({dailyChallenges:{[today]:{date:today,type:'vocabulary',lessonId:'greetings',completed:true,xp:10}}});
  const app=await appWith(state,'daily');t.after(app.close);
  assert.ok([...app.window.document.querySelectorAll('button')].some(x=>x.textContent.trim()==='Fazer prática extra'));
  await app.click('Continuar estudando');assert.equal(app.window.location.hash,'#lesson');assert.equal(app.window.document.querySelector('.lesson-page').dataset.id,'food');
});

test('refresh e migração preservam aulas, erros, XP e revisão futura',async t=>{
  const initial=affectedState(),first=await appWith(initial);await tick();const saved=first.window.localStorage.getItem(first.key);first.close();
  const second=await appWith(JSON.parse(saved));t.after(second.close);const restored=JSON.parse(second.window.localStorage.getItem(second.key));
  assert.equal(restored.schemaVersion,2);assert.deepEqual(restored.completed,completed);assert.deepEqual(restored.errors,initial.errors);assert.equal(restored.xp,125);assert.equal(restored.words.hello.next,initial.words.hello.next);
  assert.match(second.window.document.querySelector('.hero-card h2').textContent,/Food and Drinks/);
});
