(function(root){
  const normalize=value=>String(value||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim();
  const score=answers=>Math.round(answers.filter(Boolean).length/Math.max(1,answers.length)*100);
  const canComplete=answers=>score(answers)>=70;
  const isUnlocked=(lessonIndex,completedIds,lessons)=>lessonIndex===0||completedIds.includes(lessons[lessonIndex-1].id);
  const freshest=(local,remote)=>local?.profile&&(local.pendingSync||(local.modifiedAt||0)>=(remote?.progress?.modifiedAt||0))?local:{...(remote?.progress||{}),profile:remote?.profile};
  const api={normalize,score,canComplete,isUnlocked,freshest};
  root.LearningCore=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
