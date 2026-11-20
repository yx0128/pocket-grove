import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9224;
const URL='http://localhost:4173/?debug=1';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pg-smoke-'));
const chrome=spawn(CHROME,['--headless=new',`--remote-debugging-port=${PORT}`,`--user-data-dir=${profile}`,'--window-size=1440,900','--hide-scrollbars','--no-first-run','--no-default-browser-check','--disable-background-networking','--ignore-gpu-blocklist','--enable-unsafe-swiftshader',URL],{stdio:'ignore'});

async function target(){
  for(let i=0;i<60;i++){
    try{const r=await fetch(`http://127.0.0.1:${PORT}/json/list`);const a=await r.json();const p=a.find(x=>x.type==='page');if(p)return p;}catch{}
    await sleep(250);
  }
  throw new Error('no target');
}
class Cdp{
  constructor(s){this.s=s;this.id=1;this.p=new Map();this.events=[];s.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&this.p.has(m.id)){const {res,rej}=this.p.get(m.id);this.p.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result);}else if(m.method)this.events.push(m);});}
  send(method,params={}){const id=this.id++;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.s.send(JSON.stringify({id,method,params}));});}
  async eval(expr){const r=await this.send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result?.value;}
  async click(expr){const ok=await this.eval(expr);if(!ok)throw new Error('click target not found');}
  async key(key,code,keyCode){await this.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:keyCode,nativeVirtualKeyCode:keyCode});await this.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:keyCode,nativeVirtualKeyCode:keyCode});}
  async mouse(x,y,button='left',type='click'){
    await this.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'none'});
    if(type==='click'){
      await this.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button,clickCount:1});
      await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button,clickCount:1});
    }
  }
  errors(){return this.events.filter(e=>e.method==='Runtime.exceptionThrown'||(e.method==='Log.entryAdded'&&e.params.entry.level==='error')||(e.method==='Runtime.consoleAPICalled'&&e.params.type==='error'));}
}
function assert(cond,msg){if(!cond)throw new Error('ASSERT: '+msg);console.log('PASS',msg);}

try{
  const page=await target();
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true});});
  const c=new Cdp(ws);
  await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Log.enable');
  await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await sleep(1200);
  await c.eval(`localStorage.clear()`);
  await c.send('Page.reload',{ignoreCache:true});
  await sleep(3200);
  const save=async()=>{const v=await c.eval(`localStorage.getItem('pocket-grove-v1')`);return v?JSON.parse(v).state:null;};
  assert(await c.eval(`Boolean(document.querySelector('canvas'))`),'canvas renders');
  assert(await c.eval(`document.querySelector('header').textContent.includes('Pocket Grove')`),'top bar renders');
  assert(await c.eval(`document.querySelector('header').textContent.includes('60')`),'starter balance shows 60');
  assert(await c.eval(`Array.from(document.querySelectorAll('button')).some(b=>b.getAttribute('aria-label')?.startsWith('Complete '))`),'starter task checkbox exists');

  await c.click(`(()=>{const b=document.querySelector('button[aria-label^="Complete "]');if(!b)return false;b.click();return true;})()`);
  await sleep(500);
  let s=await save();
  assert(s && s.coins===70,'completing Quick task pays +10');
  assert(s.tasks.filter(t=>t.completed).length===1,'task moves to completed');

  await c.eval(`(()=>{const i=document.querySelector('input[placeholder^="Add a real-world task"]');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'Smoke test task');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await sleep(150);
  await c.click(`(()=>{const b=document.querySelector('button[aria-label="Add task"]');if(!b||b.disabled)return false;b.click();return true;})()`);
  await sleep(400);
  s=await save();
  assert(s.tasks[0].title==='Smoke test task','custom task added at top');

  const project=async(x,z)=>await c.eval(`(()=>{const d=window.__pocketGrove;const v=new d.three.Vector3(${x},0.1,${z}).project(d.camera);return {x:(v.x*0.5+0.5)*innerWidth,y:(-v.y*0.5+0.5)*innerHeight};})()`);
  const p1=await project(0.5,0.5);
  await c.mouse(p1.x,p1.y,'left');
  await sleep(600);
  s=await save();
  assert(s.placed.length===1,'click places a miniature');
  assert(s.inventory.grass===0,'placement consumes stock');

  await c.key('r','KeyR',82);
  await sleep(200);
  const p2=await project(1.5,0.5);
  await c.mouse(p2.x,p2.y,'left');
  await sleep(600);
  s=await save();
  assert(s.placed.length===2,'second miniature placed');
  assert(s.placed[1].rotation===1,'R rotates next placement by 90°');

  await c.mouse(p2.x,p2.y,'right');
  await sleep(500);
  s=await save();
  assert(s.placed.length===1,'right-click returns a placed miniature');
  assert(s.inventory.pine===1,'removed miniature returns to tray');

  await c.click(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Shop');if(!b)return false;b.click();return true;})()`);
  await sleep(500);
  await c.click(`(()=>{const card=[...document.querySelectorAll('article')].find(x=>x.textContent.includes('Water Pond'));if(!card)return false;const b=[...card.querySelectorAll('button')].find(x=>x.textContent.trim()==='Buy');if(!b||b.disabled)return false;b.click();return true;})()`);
  await sleep(500);
  s=await save();
  assert(s.coins===50,'shop purchase deducts 20 coins');
  assert(s.inventory.pond===1,'purchased item enters inventory');
  await c.click(`(()=>{const b=document.querySelector('button[aria-label="Close shop"]');if(!b)return false;b.click();return true;})()`);
  await sleep(300);

  await c.click(`(()=>{const b=document.querySelector('button[aria-label="Hide interface"]');if(!b)return false;b.click();return true;})()`);
  await sleep(400);
  assert(await c.eval(`!document.querySelector('header')`),'hide UI removes the HUD');
  assert(await c.eval(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Show interface')`),'show-interface control remains');
  await c.key('Escape','Escape',27);
  await sleep(400);
  assert(await c.eval(`Boolean(document.querySelector('header'))`),'Escape restores the HUD');

  await c.send('Page.reload',{ignoreCache:true});
  await sleep(3200);
  s=await save();
  assert(s.coins===50,'coins persist across reload');
  assert(s.inventory.pond===1,'inventory persists across reload');
  assert(s.placed.length===1,'placed world persists across reload');
  assert(s.tasks.some(t=>t.title==='Smoke test task'),'tasks persist across reload');
  assert(await c.eval(`document.querySelector('header').textContent.includes('50')`),'reloaded HUD shows persisted balance');

  await c.eval(`window.confirm=()=>true`);
  await c.click(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Reset world'));if(!b)return false;b.click();return true;})()`);
  await sleep(500);
  s=await save();
  assert(s.coins===60 && s.placed.length===0 && s.inventory.grass===1 && s.inventory.pine===1 && s.tasks.length===3,'reset restores starter state');

  const errors=c.errors();
  assert(errors.length===0,'browser console clean');
  console.log('SMOKE TEST PASSED');
  ws.close();
}catch(e){
  console.error(e);
  process.exitCode=1;
}finally{
  chrome.kill('SIGTERM');
  await sleep(400);
  fs.rmSync(profile,{recursive:true,force:true});
}
