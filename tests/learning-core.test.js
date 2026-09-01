const test=require('node:test');
const assert=require('node:assert/strict');
const {normalize,score,canComplete,isUnlocked,freshest,seededShuffle,dailyDefinition,awardOnce,migrateProgress,lessonStatus,checkpointResult,dueReviewKeys,nextRecommendedActivity,SKILLS}=require('../learning-core');

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

test('migra defensivamente o progresso legado sem perder respostas ou conclusões',()=>{
  const migrated=migrateProgress({completed:['greetings'],lessonAnswers:{'greetings:3':{value:'am'}},xp:80});
  assert.equal(migrated.schemaVersion,2);
  assert.deepEqual(migrated.completed,['greetings']);
  assert.equal(migrated.lessonAnswers['greetings:3'].value,'am');
  assert.deepEqual(Object.keys(migrated.skillProgress),SKILLS);
});

test('calcula os cinco estados curriculares e desbloqueio progressivo',()=>{
  const lessons=[{id:'one'},{id:'two'},{id:'three'}];
  assert.equal(lessonStatus('one',0,migrateProgress({currentLesson:'one',lessonStep:2}),lessons),'in_progress');
  assert.equal(lessonStatus('two',1,migrateProgress({}),lessons),'locked');
  assert.equal(lessonStatus('two',1,migrateProgress({completed:['one']}),lessons),'available');
  assert.equal(lessonStatus('one',0,migrateProgress({completed:['one']}),lessons),'completed');
  assert.equal(lessonStatus('one',0,migrateProgress({completed:['one'],reviewRequired:['one']}),lessons),'review_required');
});

test('erros históricos sem revisão vencida não bloqueiam a próxima aula',()=>{
  const lessons=[{id:'one'},{id:'two'}],now=new Date('2026-08-27T10:00:00Z');
  const result=nextRecommendedActivity({completed:['one'],errors:{'one:3':2},words:{hello:{next:now.getTime()+86400000}}},lessons,now);
  assert.equal(result.reason,'next_lesson');
  assert.equal(result.lessonId,'two');
});

test('revisão realmente vencida recomenda a rota review',()=>{
  const lessons=[{id:'one'},{id:'two'}],now=new Date('2026-08-27T10:00:00Z');
  const result=nextRecommendedActivity({completed:['one'],words:{hello:{next:now.getTime()-1}}},lessons,now);
  assert.equal(result.route,'review');
  assert.equal(result.reason,'review_due');
  assert.deepEqual(dueReviewKeys({hello:{next:now.getTime()-1},future:{next:now.getTime()+1}},now),['hello']);
});

test('prioriza aula incompleta, checkpoint, revisão, próxima aula, diário e prática',()=>{
  const lessons=[{id:'one'},{id:'check',test:true},{id:'two'}],now=new Date('2026-08-27T10:00:00Z');
  assert.equal(nextRecommendedActivity({currentLesson:'one',lessonStep:4,words:{x:{next:0}}},lessons,now).reason,'incomplete');
  assert.equal(nextRecommendedActivity({completed:['one'],words:{x:{next:0}}},lessons,now).reason,'checkpoint');
  assert.equal(nextRecommendedActivity({completed:['one','check'],words:{x:{next:0}}},lessons,now).reason,'review_due');
  assert.equal(nextRecommendedActivity({completed:['one','check']},lessons,now).reason,'next_lesson');
  assert.equal(nextRecommendedActivity({completed:['one','check','two']},lessons,now).reason,'daily_goal');
  assert.equal(nextRecommendedActivity({completed:['one','check','two'],dailyChallenges:{'2026-08-27':{completed:true}}},lessons,now).reason,'practice');
});

test('todas as recomendações usam rotas válidas',()=>{
  const lessons=[{id:'one'},{id:'check',test:true}],states=[{currentLesson:'one',lessonStep:2},{completed:['one']},{completed:['one','check'],words:{x:{next:0}}},{completed:['one','check']},{completed:['one','check'],dailyChallenges:{'2026-08-27':{completed:true}}}];
  const valid=new Set(['lesson','review','daily','vocabulary']);
  states.forEach(state=>assert.ok(valid.has(nextRecommendedActivity(state,lessons,new Date('2026-08-27')).route)));
});

test('checkpoint respeita nota mínima configurável e sempre permite nova tentativa',()=>{
  assert.deepEqual(checkpointResult([true,true,true,false],80),{percent:75,minimum:80,passed:false,canRetry:true});
  assert.equal(checkpointResult([true,true,true,false],70).passed,true);
});
