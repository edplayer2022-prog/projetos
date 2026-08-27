(function(root){
  const normalize=value=>String(value||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim();
  const score=answers=>Math.round(answers.filter(Boolean).length/Math.max(1,answers.length)*100);
  const canComplete=answers=>score(answers)>=70;
  const isUnlocked=(lessonIndex,completedIds,lessons)=>lessonIndex===0||completedIds.includes(lessons[lessonIndex-1].id);
  const freshest=(local,remote)=>local?.profile&&(local.pendingSync||(local.modifiedAt||0)>=(remote?.progress?.modifiedAt||0))?local:{...(remote?.progress||{}),profile:remote?.profile};
  const hash=value=>[...String(value)].reduce((n,c)=>((n<<5)-n+c.charCodeAt(0))|0,0)>>>0;
  const seededShuffle=(items,seed)=>{const copy=[...items];let n=hash(seed)||1;for(let i=copy.length-1;i>0;i--){n=(n*1664525+1013904223)>>>0;const j=n%(i+1);[copy[i],copy[j]]=[copy[j],copy[i]]}return copy};
  const dailyDefinition=(date,lessons)=>{const seed=hash(date),types=['vocabulary','listening','builder','dialogue'];return {date,type:types[seed%types.length],lessonId:lessons[seed%lessons.length].id,seed}};
  const awardOnce=(state,key,xp)=>{state.xpAwards||={};if(state.xpAwards[key])return false;state.xpAwards[key]=xp;state.xp=(state.xp||0)+xp;return true};
  const api={normalize,score,canComplete,isUnlocked,freshest,hash,seededShuffle,dailyDefinition,awardOnce};
  root.LearningCore=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
