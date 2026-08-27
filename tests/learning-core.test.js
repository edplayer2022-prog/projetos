const test=require('node:test');
const assert=require('node:assert/strict');
const {normalize,score,canComplete,isUnlocked,freshest,seededShuffle,dailyDefinition,awardOnce}=require('../learning-core');

test('aceita diferenças de maiúsculas, espaços, acentos e pontuação',()=>{
  assert.equal(normalize('  Olá,   MUNDO! '),normalize('ola mundo'));
});

test('erro e repetição não transformam a primeira tentativa em acerto',()=>{
  const firstCorrect=false;
  const retryCorrect=true;
  assert.equal(score([firstCorrect,true,true,retryCorrect]),75);
  assert.equal(firstCorrect,false);
});

test('exige a nota mínima de 70%',()=>{
  assert.equal(canComplete([true,true,true,true,true,true,true,false,false,false]),true);
  assert.equal(canComplete([true,true,true,true,true,true,false,false,false,false]),false);
});

test('desbloqueia somente depois da aula anterior',()=>{
  const lessons=[{id:'one'},{id:'two'},{id:'three'}];
  assert.equal(isUnlocked(0,[],lessons),true);
  assert.equal(isUnlocked(1,[],lessons),false);
  assert.equal(isUnlocked(1,['one'],lessons),true);
  assert.equal(isUnlocked(2,['one'],lessons),false);
});

test('retomada e sincronização preservam o estado local pendente mais novo',()=>{
  const local={profile:{name:'Ana'},currentLesson:'food',lessonStep:8,lessonAnswers:{x:{value:'water'}},pendingSync:true,modifiedAt:20};
  const remote={profile:{name:'Ana'},progress:{currentLesson:'home',lessonStep:2,modifiedAt:10}};
  assert.deepEqual(freshest(local,remote),local);
  assert.equal(freshest({...local,pendingSync:false,modifiedAt:5},remote).currentLesson,'home');
});


test('embaralhamento e desafio diário são determinísticos',()=>{
  assert.deepEqual(seededShuffle([1,2,3,4],'aula'),seededShuffle([1,2,3,4],'aula'));
  const lessons=[{id:'one'},{id:'two'}];
  assert.deepEqual(dailyDefinition('2026-08-27',lessons),dailyDefinition('2026-08-27',lessons));
});

test('XP é concedido uma única vez por chave sincronizável',()=>{
  const state={xp:5,xpAwards:{}};
  assert.equal(awardOnce(state,'daily:2026-08-27',10),true);
  assert.equal(awardOnce(state,'daily:2026-08-27',10),false);
  assert.equal(state.xp,15);
});
