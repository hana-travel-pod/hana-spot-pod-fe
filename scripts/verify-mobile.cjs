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
  await send('Page.navigate',{url:'http://127.0.0.1:8765'});await waitText('우리에게 맞는 경험 찾기');
  await pause(700);
  assert(await evaluate("Array.from(document.images).some(i=>i.src.includes('byeoldori-main')&&i.complete&&i.naturalWidth===480)"));
  assert(await evaluate("Array.from(document.images).find(i=>i.src.includes('byeoldori-main')).getBoundingClientRect().height <= 120"),'PNG took excess vertical space');
  assert(await evaluate("['Hana2-Regular','Hana2-Medium','Hana2-Bold'].every(f=>document.fonts.check('16px '+f))"));
  await pause(400);fs.writeFileSync('.expo/start-390.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
  let runs = 0;
  const recommend = async () => {
    const started = Date.now();
    await evaluate("(()=>{const e=document.querySelector('[aria-label=\"추천 결과 보기\"]');e.click();e.click();})()");
    await waitText('결과를 분석 중이에요');
    assert(!(await evaluate('document.body.innerText')).includes('/ 4'));
    assert(await evaluate("Array.from(document.images).some(i=>i.src.includes('byeoldori-loading'))"));
    if (++runs === 1) {
      await pause(400);
      const bounds = await evaluate("(()=>{const r=Array.from(document.images).find(i=>i.src.includes('byeoldori-loading')).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
      const a=(await send('Page.captureScreenshot',{clip:bounds})).data;
      await pause(600);
      const b=(await send('Page.captureScreenshot',{clip:bounds})).data;
      assert.notEqual(a,b,'GIF did not animate');
      fs.writeFileSync('.expo/loading.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      for (const width of [360, 430]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
        await pause(100);
        assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'Loading horizontal overflow');
        fs.writeFileSync(`.expo/loading-${width}.png`,Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      }
    }
    await waitText('우리의 다음 경험');
    assert(Date.now()-started >= 2800,'Loading ended too early');
    assert(!(await evaluate('document.body.innerText')).match(/[·•]/));
  };
  await click('우리에게 맞는 경험 찾기');await click('액티비티');await click('예산 선택하기');await click('추가 경험비 사용');await waitText('440,000원');await recommend();await waitText('오사카 자전거 시티 투어');
  let body=await evaluate('document.body.innerText');assert(body.includes('60,000원'));assert(body.includes('200,000원'));assert(body.includes('40,000원 초과'));
  await click('조건 바꾸기');assert(await evaluate("document.querySelector('[aria-label=액티비티]').getAttribute('aria-checked')==='true'"));
  await click('식사');await click('예산 선택하기');assert(await evaluate("document.querySelector('[aria-label=\"추가 경험비 사용\"]').getAttribute('aria-checked')==='true'"));
  await recommend();await waitText('오사카 특선 스시 코스');assert(!(await evaluate('document.body.innerText')).includes('자전거'));
  await click('조건 바꾸기');await click('예산 선택하기');await click('수익금만 사용');await waitText('80,000원');await recommend();await waitText('쿠로몬 시장 해산물 런치 세트');
  body=await evaluate('document.body.innerText');assert(body.includes('14,000원'));assert(body.includes('24,000원'));assert(body.includes('160,000원 초과'));assert(!body.includes('스시 코스'));assert(!body.includes('자전거'));
  for(const width of [360,430,1000]){await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});await pause(200);assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),'horizontal overflow');assert(await evaluate("document.querySelector('[aria-label=\"조건 바꾸기\"]').getBoundingClientRect().bottom<=innerHeight"),'footer clipped');fs.writeFileSync(`.expo/result-${width}.png`,Buffer.from((await send('Page.captureScreenshot')).data,'base64'));}
  await click('조건 바꾸기');await click('예산 선택하기');await click('직접 입력');
  await evaluate("(()=>{const e=document.querySelector('input');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(e,'440001');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()");await pause(200);await waitText('최대 440,000원까지');
  await evaluate("(()=>{const e=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'1');e.dispatchEvent(new Event('input',{bubbles:true}));})()");await pause(200);await click('추천 결과 보기');await waitText('이 예산으로 선택할 수 있는 후보가 없어요.');
  await click('이전 단계');await waitText('이번 추천 예산');await pause(3300);
  assert(!(await evaluate('document.body.innerText')).includes('분석 중이에요'),'Back navigation replayed loading');
  await click('추천 결과 보기');await waitText('결과를 분석 중이에요');
  await evaluate('history.back()');await waitText('어떤 순간을');await pause(3300);
  assert(!(await evaluate('document.body.innerText')).includes('우리의 다음 경험'),'Cancelled loading still navigated');
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS: PNG/fonts, animated GIF, 3s loading, double tap guard, repeat loading, back navigation, timer cancellation, category/budget reset, prices, validation, empty state, 360/430/desktop layouts, no runtime errors');
 } finally {socket?.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
