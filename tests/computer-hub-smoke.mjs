import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('npx',['vite','preview','--host','127.0.0.1','--port','5174'],{stdio:'inherit'});
const browser=await chromium.launch({headless:true});
try{
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5174/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.addInitScript(()=>localStorage.setItem('you-n-ide-os.booted','true'));
 await page.route('**/api/**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({status:'offline',apps:[],events:0})}));
 await page.route('**/mcp/**',route=>route.fulfill({contentType:'application/json',body:'{"ok":false}'}));
 await page.goto('http://127.0.0.1:5174/');
 await page.getByRole('button',{name:'Background',exact:true}).click({timeout:30000});
 await page.getByLabel('Choose a background').selectOption('web-linux');
 assert(await page.evaluate(()=>document.querySelector('[data-testid="synthia-os-shell"] section').style.backgroundImage.includes('web-linux.jpg')));
 await page.getByRole('button',{name:'Close background settings'}).click();
 await page.goto('http://127.0.0.1:5174/computer-desktop');
 const hub=page.frameLocator('iframe[title="Computer app hub"]');
 await hub.getByRole('button',{name:'Log in as Guest'}).click({timeout:30000});
 await hub.locator('[data-desktop-app="synthia"]').click();
 await hub.frameLocator('iframe[title="Synthia phone app"]').getByRole('navigation',{name:'Main navigation'}).waitFor();
 console.log('SynthAI2 background changes and runnable nested Human Design app passed. Backend availability is mocked only for this UI test.');
}finally{await browser.close();server.kill('SIGTERM');}
