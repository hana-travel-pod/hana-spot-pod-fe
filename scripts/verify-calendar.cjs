const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
 const root = path.resolve('.expo/verification-export');
 const server = http.createServer((req,res) => {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root)) {res.writeHead(403);res.end();return;}
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root,'index.html');
  const types={'.js':'application/javascript','.html':'text/html','.ttf':'font/ttf','.png':'image/png','.json':'application/json'};
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9223','--user-data-dir='+path.resolve('.expo/verification-browser'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 let socket;
 try {
  let tabs;
  for(let i=0;i<60;i++){try{tabs=await (await fetch('http://127.0.0.1:9223/json')).json();break;}catch{await pause(200);}}
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>socket.addEventListener('open',r,{once:true}));
  let id=0;const pending=new Map();const errors=[];
  socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(msg.error):p.resolve(msg.result);}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const seq=++id;pending.set(seq,{resolve,reject});socket.send(JSON.stringify({id:seq,method,params}));});
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  const waitText=async text=>{for(let i=0;i<100;i++){if(await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`))return;await pause(100);}throw Error('Missing: '+text);};
  const click=async label=>{assert(await evaluate(`(()=>{const e=document.querySelector('[aria-label="${label}"]');if(!e)return false;e.click();return true})()`),'Missing control '+label);await pause(300);};
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await require('./calendar-scenario.cjs')({ send, evaluate, waitText, click, pause, assert, fs, errors });
  await require('./workflow-scenario.cjs')({ send, evaluate, waitText, click, pause, assert, fs, errors });
 } finally {socket?.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
