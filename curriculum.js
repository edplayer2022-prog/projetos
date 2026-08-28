/* Catálogo curricular independente da interface. Conteúdo publicado referencia as aulas
   legadas pelo mesmo id, mantendo respostas e conclusões existentes. */
(function (root) {
  const blockTypes = ['objective','text','explanation','vocabulary','example','pronunciation','audio','listening','dialogue','reading','multiple_choice','fill_blank','matching','ordering','sentence_builder','translation','writing','speaking','conversation','review','quiz','summary'];
  const unit = (id, title, lessonIds, topics = []) => ({ id, title, lessonIds, topics });
  const level = (id, title, status, modules, syllabus) => ({ id, title, status, modules, syllabus });
  const catalog = [
    level('A1','Iniciante','available',[
      {id:'a1-m1',title:'Getting Started',units:[
        unit('a1-m1-u1','Greetings',['greetings'],['Hello and Hi','Good Morning, Afternoon and Evening','Goodbye','How Are You?','Introducing Yourself',"What’s Your Name?",'Where Are You From?','Alphabet','Numbers','Review + Checkpoint']),
        unit('a1-m1-u2','Personal Information',['personal','numbers','family'])]},
      {id:'a1-m2',title:'Everyday Life',units:[unit('a1-m2-u1','Routine and Time',['routine','time']),unit('a1-m2-u2','Food and Home',['food','restaurant','home'])]},
      {id:'a1-m3',title:'Around Town',units:[unit('a1-m3-u1','City and Shopping',['town','shopping']),unit('a1-m3-u2','Work, Transport and Abilities',['work','transport','health'])]},
      {id:'a1-m4',title:'Review and Exam',units:[unit('a1-m4-u1','A1 Review + Exam',['final'])]}
    ],['primeiro contato','apresentação','informações pessoais','rotina','casa','comida','cidade','compras','habilidades','revisão e exame']),
    level('A2','Básico','locked',[],['rotinas','trabalho','família','compras','restaurantes','transporte','viagem','hotel','médico','clima','hobbies','planos','Simple Present / Continuous / Past','going to / will','comparatives / superlatives','countable / uncountable','some / any / much / many','frequency adverbs','object pronouns','modals básicos']),
    level('B1','Intermediário','locked',[],['experiências','trabalho','viagem','relacionamentos','saúde','tecnologia','educação','dinheiro','problemas e soluções','opiniões','storytelling','situações sociais','Present Perfect','Past Continuous','conditionals 1 / 2','modals','gerunds / infinitives','relatives','passive','reported speech introdutório']),
    level('B2','Intermediário superior','locked',[],['carreira','negócios','comunicação','cultura','sociedade','tecnologia','notícias','relacionamentos','finanças','viagem','resolução de problemas','debates','advanced conditionals','passive','reported speech','modal deduction','Past / Future Perfect','phrasal verbs','collocations','linking words']),
    level('C1','Avançado','locked',[],['comunicação avançada','liderança','negócios','negociação','apresentações','cultura','política e sociedade','ciência','tecnologia','inglês acadêmico','escrita profissional','conversas avançadas']),
    level('C2','Proficiência','locked',[],['conversas complexas','listening em velocidade natural','humor','sarcasmo','referências culturais','idioms avançados','escrita complexa','comunicação profissional, acadêmica e persuasiva','negociação','public speaking'])
  ];
  const lessonLocation = Object.fromEntries(catalog[0].modules.flatMap(module => module.units.flatMap(unit => unit.lessonIds.map(id => [id,{level:'A1',moduleId:module.id,moduleTitle:module.title,unitId:unit.id,unitTitle:unit.title}]))));
  root.FLUENCY_CURRICULUM={version:2,blockTypes,catalog,lessonLocation};
  if(typeof module!=='undefined')module.exports=root.FLUENCY_CURRICULUM;
})(typeof window==='undefined'?globalThis:window);
