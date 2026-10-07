module.exports = async ({ send, evaluate, waitText, click, pause, assert, fs, errors }) => {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: 'http://127.0.0.1:8765' });
  await waitText('모임 자금 이체 승인');
  const disabled = async label => await evaluate(`document.querySelector('[aria-label="${label}"]').getAttribute('aria-disabled')==='true'`);
  const draw = async () => {
    await evaluate("document.querySelector('[data-testid=signature-pad]').scrollIntoView({block:'center'})");
    await pause(200);
    const rect = await evaluate("(()=>{const r=document.querySelector('[data-testid=signature-pad]').getBoundingClientRect();return {x:r.x,y:r.y}})()");
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.x + 25, y: rect.y + 50 }] });
    for (const [x,y] of [[45,90],[80,45],[120,115],[170,55],[220,100]]) {
      await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rect.x + x, y: rect.y + y }] });
      await pause(45);
    }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pause(150);
  };
  const newRequest = async () => {
    await click('이체 요청하기');await click('요청 내용 확인');
    await waitText('2,400,000원');await click('본인 확인과 시연용 서명');
    assert(await disabled('승인 요청 보내기'),'Empty signature was enabled');
    await click('모임장 본인 확인 (시연용)');await draw();
    assert(!(await disabled('승인 요청 보내기')),'Drawing did not enable signature');
    await click('서명 지우기');assert(await disabled('승인 요청 보내기'),'Clear did not invalidate signature');
    await draw();await click('승인 요청 보내기');await waitText('1/4명 승인');
    assert((await evaluate('document.body.innerText')).includes('3,200,000원'));
  };
  const reset = async () => { await click('데모 초기화');await click('데모 초기화 확인');await waitText('이체 요청하기'); };
  await newRequest();
  for (const index of [1,2,3]) {
    await click(`참여자 ${index} 보기`);await waitText('800,000원 이체 승인 요청');
    assert(await evaluate("!!document.querySelector('[data-testid=approval-notification]')"), 'Notification banner missing');
    assert(!(await evaluate('document.body.innerText')).includes('승인 진행'), 'Banner should initially be compact');
    if (index === 1) {
      await pause(400);
      fs.writeFileSync('.expo/transfer-notification.png', Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      assert(await evaluate("document.querySelector('[data-testid=approval-notification]').getBoundingClientRect().top < 20"), 'Banner is not at screen top');
      await pause(5600);
      assert(await evaluate("!document.querySelector('[data-testid=approval-notification]')"), 'Banner did not auto dismiss');
      assert((await evaluate('document.body.innerText')).includes('1/4명 승인'), 'Dismiss changed approval');
      await click('모임장 보기');await click('참여자 1 보기');
      assert(await evaluate("!document.querySelector('[data-testid=approval-notification]')"), 'Seen notification repeated');
      await click('받은 승인 요청');await pause(300);
      const bannerRect = await evaluate("(()=>{const r=document.querySelector('[data-testid=approval-notification]').getBoundingClientRect();return {x:r.x+80,y:r.y+65}})()");
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [bannerRect] });
      for (const offset of [12, 28, 46, 60]) {
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{x:bannerRect.x,y:bannerRect.y-offset}] });
        await pause(60);
      }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });await pause(350);
      assert(await evaluate("!document.querySelector('[data-testid=approval-notification]')"), 'Swipe did not dismiss');
      await click('받은 승인 요청');await pause(300);
    }
    await click('이체 승인 알림 펼치기');
    await click('승인 진행');await waitText('이체 요청 상세');
    assert((await evaluate('document.body.innerText')).includes(`${index}/4명 승인`),'Notification approved without signing');
    await click('내용 확인 후 서명');assert(await disabled('서명하고 승인'));
    await draw();await click('서명하고 승인');
    if (index < 3) await waitText(`${index+1}/4명 승인`);
  }
  await waitText('전원 승인 완료');
  assert((await evaluate('document.body.innerText')).includes('3,200,000원'),'Balance deducted before completion');
  await waitText('시연용 이체 처리 완료');await waitText('2,400,000원');
  assert((await evaluate('document.body.innerText')).includes('4/4명 승인'));
  assert(!(await evaluate('document.body.innerText')).match(/[·•]/));
  await click('요청 상세 보기');
  assert(!(await evaluate('document.body.innerText')).includes('내용 확인 후 서명'),'Duplicate approval available');
  await click('현황으로 돌아가기');
  for (const width of [360,430]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await pause(200);
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'Horizontal overflow');
    fs.writeFileSync(`.expo/transfer-complete-${width}.png`, Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
  }
  await reset();await newRequest();
  await click('참여자 1 보기');await click('이체 승인 알림 펼치기');await click('거절');await waitText('이체 요청 상세');
  assert(!(await evaluate('document.body.innerText')).includes('거절됨'),'Notification rejected without detail confirmation');
  await click('거절 확인으로 이동');await click('이체 요청 거절 확정');await waitText('거절됨');
  await pause(1700);assert((await evaluate('document.body.innerText')).includes('3,200,000원'));
  await click('참여자 2 보기');assert(!(await evaluate('document.body.innerText')).includes('승인 진행'));
  fs.writeFileSync('.expo/transfer-rejected.png', Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
  await reset();await newRequest();
  await click('요청 취소하고 변경하기');await click('기존 요청 취소');await waitText('취소됨');
  await click('이체 요청하기');
  await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이체 금액 (원)\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'99999999');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await pause(200);assert(await disabled('요청 내용 확인'));
  await reset();
  await waitText('하나 스팟 팟');await waitText('440,000원');
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS: touch signatures, clear/blank guard, leader confirmation, notification/detail separation, 4 approvals, delayed one-time deduction, rejection/no deduction, cancellation, validation, reset, demo roles, 360/430 layouts, HanaPick funds preserved');
};
