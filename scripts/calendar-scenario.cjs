module.exports = async ({ send, evaluate, waitText, click, pause, assert, fs, errors }) => {
  await send('Page.navigate', { url: 'http://127.0.0.1:8765' }); await waitText('2026년 10월');
  await evaluate('localStorage.clear()'); await send('Page.reload'); await waitText('2026년 10월');
  const body = () => evaluate('document.body.innerText');
  const disabled = label => evaluate(`document.querySelector('[aria-label="${label}"]').getAttribute('aria-disabled')==='true'`);
  const input = async (label, value) => { await evaluate(`(()=>{const e=document.querySelector('[aria-label=${JSON.stringify(label)}]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(150); };
  const cleanScreen = async () => { const text = await body(); for (const removed of ['쓸 날짜에 맞춰 준비해요','모임장 보기','참여자 보기','시연 기준일','시연 날짜 하루 뒤','시연 영업일 범위','시연 휴장일','트래블로그 환전','환전·충전 완료','따로 보관할 예비비','주문 제출로 설정','매도 체결로 설정','출금 가능으로 설정']) assert(!text.includes(removed),'Removed UI remains: '+removed); };
  await cleanScreen();
  assert(await evaluate("(()=>{const e=document.querySelector('[aria-label=\"리스트로 보기\"]').getBoundingClientRect();return e.width>=44&&e.height>=44})()"));
  assert(await evaluate("document.querySelector('[data-testid=\"calendar-grid\"]').getBoundingClientRect().top<180"),'Calendar pushed below introductory content');
  for (const width of [360,430,1000]) { await send('Emulation.setDeviceMetricsOverride',{width,height:780,deviceScaleFactor:1,mobile:true});await pause(200);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');assert(await evaluate("document.querySelector('[aria-label=\"일정 추가\"]').getBoundingClientRect().bottom<=innerHeight"),'Footer clipped');fs.writeFileSync(`.expo/calendar-${width}.png`,Buffer.from((await send('Page.captureScreenshot')).data,'base64')); }
  await click('이전 달');await waitText('2026년 9월');await click('다음 달');await waitText('2026년 10월');
  await click('파리의 특별한 저녁 상세');await waitText('매도 준비일');assert((await body()).includes('2026-10-08'));assert((await body()).includes('2026-10-13'));await cleanScreen();
  await click('캘린더 / 리스트로 돌아가기');await click('리스트로 보기');
  let text=await body();assert(text.indexOf('파리 숙소 잔금')<text.indexOf('파리의 특별한 저녁'));await cleanScreen();
  await click('파리의 특별한 저녁 상세');await click('일정 수정');await input('지출 예정일','2026-10-15');await input('필요한 금액','500000');await click('일정 저장');await waitText('500,000원');
  await click('파리의 특별한 저녁 상세');await waitText('2026-10-15');await waitText('2026-10-13');await click('캘린더 / 리스트로 돌아가기');await click('캘린더로 보기');await waitText('2026-10-15 일정');await waitText('500,000원');
  await click('일정 추가');await input('지출명','공항 이동 예시');await input('지출 예정일','2026-02-30');await input('필요한 금액','4000000');assert(await disabled('일정 저장'));
  await input('지출 예정일','2026-10-16');await click('기본 여행비');assert(!(await disabled('일정 저장')));await click('일정 저장');await waitText('공항 이동 예시');
  await click('리스트로 보기');await waitText('공항 이동 예시');await click('공항 이동 예시 상세');await waitText('800,000원 부족');assert(!(await body()).includes('매도 준비일'));await click('일정 삭제');await click('삭제 확인');assert(!(await body()).includes('공항 이동 예시'));
  await click('캘린더로 보기');await cleanScreen();await waitText('예시 자금 현황');assert(!(await body()).match(/\s[·•]\s/));assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS: compact calendar first, accessible view icon, removed demo UI, month navigation, calendar/list CRUD sync, recalculated dates, shortage plans, responsive widths');
};
