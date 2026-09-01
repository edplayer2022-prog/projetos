const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const candidates=[process.env.PLAYWRIGHT_CHROME,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/local/bin/chrome','/opt/google/chrome/chrome'].filter(Boolean);
const browser=candidates.find(file=>{try{return fs.statSync(file).isFile()&&(fs.statSync(file).mode&0o111)}catch{return false}});
const command=browser?['npx',['playwright','test'],{...process.env,PLAYWRIGHT_CHROME:browser}]:[process.execPath,['--test','tests/continuation.integration.test.js'],process.env];
if(browser)console.log(`[ui-tests] Navegador encontrado em ${browser}; executando Playwright.`);
else console.log('[ui-tests] Chromium/Chrome indisponível; executando a suíte de integração jsdom substituta (não skipped).');
const result=spawnSync(command[0],command[1],{stdio:'inherit',env:command[2]});process.exit(result.status??1);
