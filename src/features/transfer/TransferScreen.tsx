import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Check, Copy, Money, palette, Row, ui } from '../../components/MobileUI';
import { EXTRA_EXPERIENCE_BUDGET, MEETING } from './demo';
import { formatWon } from '../../utils/budget';
import { approvalCount, DEMO_ACCOUNT, DEMO_DRAFT, Draft, draftError, MemberId, MEMBERS, RequestStatus } from './model';
import SignaturePad from './SignaturePad';
import ApprovalNotification from './ApprovalNotification';
import { useTransfer } from './TransferProvider';

type Screen = 'home' | 'edit' | 'review' | 'detail' | 'sign' | 'reject' | 'cancel' | 'reset';
const STATUS: Record<RequestStatus, string> = { draft: '요청 확인', awaiting: '참여자 승인 대기', all_approved: '전원 승인 완료', completed: '시연용 이체 처리 완료', rejected: '거절됨', cancelled: '취소됨' };
const APPROVAL = { waiting: '대기', approved: '승인', rejected: '거절' };
const APPROVAL_COLOR = { waiting: '#C87373', approved: palette.green, rejected: palette.red };

export default function TransferScreen() {
  const { state, dispatch } = useTransfer();
  const request = state.request;
  const [role, setRole] = useState<MemberId>('leader');
  const [screen, setScreen] = useState<Screen>('home');
  const [draft, setDraft] = useState<Draft>({ ...DEMO_DRAFT });
  const [verified, setVerified] = useState(false);
  const [signatureLength, setSignatureLength] = useState(0);
  const [intent, setIntent] = useState<'approve' | 'reject'>('approve');
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(() => new Set());
  const [notificationGeneration, setNotificationGeneration] = useState(0);
  const leader = role === 'leader';
  const count = request ? approvalCount(request) : 0;
  const pending = request?.status === 'awaiting' && request.approvals[role] === 'waiting' && !leader;
  const notificationKey = `${request?.id}-${role}`;
  const dismissNotification = useCallback(() => setDismissedNotifications(previous => new Set(previous).add(notificationKey)), [notificationKey]);
  const before = request?.status === 'completed' ? state.balance + request.amount : state.balance;
  const expected = request ? before - request.amount : state.balance;
  const error = draftError(draft, state.balance);
  const openSignature = () => { setSignatureLength(0); setVerified(false); setScreen('sign'); };
  const openDetail = (action: 'approve' | 'reject') => { dismissNotification(); setIntent(action); setScreen('detail'); };
  const home = () => { setScreen('home'); setSignatureLength(0); };
  const restart = () => { dispatch({ type: 'reset' }); setDraft({ ...DEMO_DRAFT }); setRole('leader'); setVerified(false); home(); };
  const approvalSummary = request && <View style={styles.section}>
    <Copy tone="label">승인 현황 {count}/{MEMBERS.length}명 승인</Copy>
    {MEMBERS.map(member => <Row key={member.id} label={member.name} value={APPROVAL[request.approvals[member.id]]} valueColor={APPROVAL_COLOR[request.approvals[member.id]]} />)}
    <Copy tone="small" style={ui.muted}>모임장을 포함한 전원이 동의해야 처리됩니다.</Copy>
  </View>;
  const details = request && <View style={styles.section}>
    <Copy tone="label">{request.purpose}</Copy>
    <Money amount={request.amount} />
    <Copy tone="small" style={ui.muted}>받는 사람</Copy><Copy tone="label">{request.recipient}</Copy>
    <Copy tone="small" style={ui.muted}>{DEMO_ACCOUNT}</Copy>
    <View style={ui.divider} /><Row label="요청자" value="모임장" /><Row label="출금 자금" value="기본 여행비" />
    <Row label="이체 전 잔액" value={formatWon(before)} /><Row label={request.status === 'completed' ? '처리 후 잔액' : '이체 후 예상 잔액'} value={formatWon(expected)} />
    <Copy tone="small" style={ui.muted}>하나픽 추가 경험비 {formatWon(EXTRA_EXPERIENCE_BUDGET)}은 차감하지 않아요.</Copy>
  </View>;

  let content: React.ReactNode;
  let footer: React.ReactNode;
  if (screen === 'edit' && leader) {
    content = <><Copy tone="title">이체 요청 작성</Copy><Copy tone="small" style={ui.muted}>시연 데이터를 수정하거나 그대로 진행해 주세요.</Copy>
      {([{ key: 'purpose', label: '이체 목적' }, { key: 'recipient', label: '받는 사람' }, { key: 'amount', label: '이체 금액 (원)' }] as const).map(field => <View key={field.key} style={{ gap: 8 }}><Copy tone="label">{field.label}</Copy><TextInput accessibilityLabel={field.label} style={styles.input} value={draft[field.key]} maxLength={field.key === 'amount' ? 10 : 60} keyboardType={field.key === 'amount' ? 'number-pad' : 'default'} onChangeText={value => setDraft(previous => ({ ...previous, [field.key]: field.key === 'amount' ? value.replace(/\D/g, '') : value }))} /></View>)}
      <Row label="출금 자금" value="기본 여행비" /><Copy tone="small" style={ui.muted}>{DEMO_ACCOUNT}</Copy>
      {!!error && <Copy tone="small" style={{ color: palette.red }}>{error}</Copy>}
    </>;
    footer = <Button title="요청 내용 확인" disabled={!!error} onPress={() => { dispatch({ type: 'create', draft }); setScreen('review'); }} />;
  } else if (screen === 'review' && request?.status === 'draft' && leader) {
    content = <><Copy tone="title">이 내용을 요청할까요?</Copy>{details}<Copy tone="small" style={ui.muted}>전송 후 받는 사람과 금액을 수정할 수 없어요. 변경하려면 요청을 취소하고 새로 작성해 주세요.</Copy><Button dark title="작성 내용 수정" onPress={() => { dispatch({ type: 'cancel', id: request.id }); setScreen('edit'); }} /></>;
    footer = <Button title="본인 확인과 시연용 서명" onPress={openSignature} />;
  } else if (screen === 'sign' && request && (leader ? request.status === 'draft' : pending)) {
    content = <><Copy tone="title">{leader ? '모임장 확인과 서명' : '내용을 확인하고 서명해요'}</Copy><Copy tone="label">{request.recipient}</Copy><Copy>{formatWon(request.amount)} 이체 요청</Copy>
      {leader && <Pressable accessibilityRole="checkbox" accessibilityLabel="모임장 본인 확인 (시연용)" aria-checked={verified} accessibilityState={{ checked: verified }} onPress={() => setVerified(value => !value)} style={styles.checkbox}><Check selected={verified} /><Copy style={{ flex: 1 }}>모임장 본인 확인 (시연용)</Copy></Pressable>}
      <SignaturePad key={`${request.id}-${role}`} onChange={setSignatureLength} />
    </>;
    footer = <Button title={leader ? '승인 요청 보내기' : '서명하고 승인'} disabled={signatureLength < 12 || (leader && !verified)} onPress={() => {
      if (leader) dispatch({ type: 'send', id: request.id, signatureLength, verified });
      else dispatch({ type: 'approve', id: request.id, member: role, signatureLength });
      home();
    }} />;
  } else if (screen === 'detail' && request) {
    content = <><Copy tone="title">이체 요청 상세</Copy><Copy tone="label">{STATUS[request.status]}</Copy>{details}{approvalSummary}</>;
    footer = pending ? <Button title={intent === 'reject' ? '거절 확인으로 이동' : '내용 확인 후 서명'} onPress={() => intent === 'reject' ? setScreen('reject') : openSignature()} /> : <Button title="현황으로 돌아가기" onPress={home} />;
  } else if (screen === 'reject' && request && pending) {
    content = <><Copy tone="title">이 요청을 거절할까요?</Copy>{details}<Copy style={{ color: palette.red }}>한 명이라도 거절하면 이체 요청이 종료됩니다. 기본 여행비 잔액은 그대로 유지돼요.</Copy><Button dark title="상세로 돌아가기" onPress={() => setScreen('detail')} /></>;
    footer = <Button title="이체 요청 거절 확정" onPress={() => { dispatch({ type: 'reject', id: request.id, member: role }); home(); }} />;
  } else if (screen === 'cancel' && request && leader) {
    content = <><Copy tone="title">기존 요청을 취소할까요?</Copy><Copy>{request.recipient}</Copy><Copy>{formatWon(request.amount)}</Copy><Copy style={ui.muted}>모든 승인을 중단하고 받는 사람과 금액을 새로 지정할 수 있어요. 잔액은 차감되지 않아요.</Copy><Button dark title="요청 유지하기" onPress={home} /></>;
    footer = <Button title="기존 요청 취소" onPress={() => { dispatch({ type: 'cancel', id: request.id }); home(); }} />;
  } else if (screen === 'reset') {
    content = <><Copy tone="title">데모를 초기화할까요?</Copy><Copy>요청과 승인 내역을 지우고 기본 여행비 잔액을 {formatWon(MEETING.basicTravelCost)}으로 되돌립니다.</Copy><Button dark title="데모 유지하기" onPress={home} /></>;
    footer = <Button title="데모 초기화 확인" onPress={restart} />;
  } else {
    content = <><View><Copy tone="small" style={ui.muted}>{MEETING.name}</Copy><Copy tone="title">모임 자금 이체 승인</Copy><Copy tone="small" style={[ui.muted, { marginTop: 8 }]}>기본 여행비 잔액</Copy><Money amount={state.balance} /></View>
      {!request && <Copy style={ui.muted}>{leader ? '모임원 모두의 동의를 받아 안전하게 요청해요.' : '아직 이체 요청이 없어요. 모임장 보기에서 요청을 만들어 주세요.'}</Copy>}
      {request && <View style={styles.section}><Copy tone="title" style={{ fontSize: 23 }}>{STATUS[request.status]}</Copy><Copy tone="label">{request.purpose}</Copy><Copy>{request.recipient}</Copy><Copy>{formatWon(request.amount)}</Copy>
        {request.status === 'awaiting' && <Copy tone="small" style={ui.muted}>받는 사람과 금액이 확정되었어요. 전원 승인 전에는 이체되지 않아요.</Copy>}
        {request.status === 'all_approved' && <Copy style={{ color: palette.green }}>4명 모두 동의했어요. 시연용 이체를 처리하고 있어요.</Copy>}
        {request.status === 'rejected' && <Copy style={{ color: palette.red }}>거절로 이체가 중단되었어요. 잔액은 차감되지 않았어요.</Copy>}
        {request.status === 'cancelled' && <Copy style={ui.muted}>요청이 취소되었어요. 새 요청을 작성할 수 있어요.</Copy>}
        {request.status === 'completed' && <><Copy tone="small" style={ui.muted}>실제 이체가 아닌 발표용 처리 결과입니다.</Copy><Row label="처리 시각" value={request.processedAt ? new Date(request.processedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) : ''} /><Copy tone="small" style={ui.muted}>승인자: {MEMBERS.filter(member => request.approvals[member.id] === 'approved').map(member => member.name).join(', ')}</Copy></>}
      </View>}
      {pending && <Button title="받은 승인 요청" onPress={() => {
        setDismissedNotifications(previous => { const next = new Set(previous); next.delete(notificationKey); return next; });
        setNotificationGeneration(value => value + 1);
      }} />}
      {approvalSummary}
      {request && <Button dark title="요청 상세 보기" onPress={() => openDetail('approve')} />}
      {leader && request?.status === 'awaiting' && <Button dark title="요청 취소하고 변경하기" onPress={() => setScreen('cancel')} />}
      <Copy tone="small" style={ui.muted}>하나픽 추가 경험비 {formatWon(EXTRA_EXPERIENCE_BUDGET)}은 별도 자금입니다.</Copy>
    </>;
    footer = leader && (!request || ['cancelled', 'rejected', 'completed'].includes(request.status)) ? <Button title="이체 요청하기" onPress={() => { setDraft({ ...DEMO_DRAFT }); setScreen('edit'); }} /> : leader && request?.status === 'draft' ? <Button title="작성 중인 요청 계속하기" onPress={() => setScreen('review')} /> : <Button title="데모 초기화" dark onPress={() => setScreen('reset')} />;
  }

  return <View style={ui.outer}><SafeAreaView style={ui.safe} edges={['top', 'bottom']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={ui.header}><Copy tone="label">하나 스팟 팟</Copy><Pressable accessibilityRole="button" accessibilityLabel="데모 초기화" onPress={() => setScreen('reset')} style={{ minHeight: 44, justifyContent: 'center' }}><Copy tone="small" style={ui.muted}>데모 초기화</Copy></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 22, gap: 20 }}>
      <View style={{ gap: 8 }}><Copy tone="small" style={ui.muted}>역할 전환 (시연용)</Copy><View style={styles.roles}>{MEMBERS.map(member => <Pressable key={member.id} accessibilityRole="radio" accessibilityLabel={member.id === 'leader' ? '모임장 보기' : `${member.name} 보기`} aria-checked={role === member.id} accessibilityState={{ checked: role === member.id }} onPress={() => { setRole(member.id); home(); }} style={[styles.role, role === member.id && { backgroundColor: palette.mint }]}><Copy tone="small" style={{ color: role === member.id ? palette.green : palette.ink }}>{member.id === 'leader' ? '모임장 보기' : `${member.name} 보기`}</Copy></Pressable>)}</View></View>
      {screen !== 'home' && <Pressable accessibilityRole="button" accessibilityLabel="승인 현황으로 돌아가기" onPress={home}><Copy tone="small" style={ui.muted}>‹ 승인 현황</Copy></Pressable>}
      {content}
      <Copy tone="small" style={ui.muted}>발표용 프로토타입입니다. 실제 계좌, 은행 이체, 법적 전자서명과 원격 알림은 연결되어 있지 않습니다.</Copy>
    </ScrollView>
    <View style={ui.footer}>{footer}</View>
  </KeyboardAvoidingView>
    {!!pending && screen === 'home' && !dismissedNotifications.has(notificationKey) && <ApprovalNotification
      key={`${notificationKey}-${notificationGeneration}`}
      message={request ? `${request.purpose} ${formatWon(request.amount)} 이체 승인 요청` : ''}
      onClose={dismissNotification}
      onApprove={() => openDetail('approve')}
      onReject={() => openDetail('reject')}
    />}
  </SafeAreaView>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: 8, borderTopWidth: 1, borderColor: palette.line, paddingTop: 20 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  role: { flexBasis: '47%', flexGrow: 1, borderRadius: 10, backgroundColor: palette.warm, padding: 12, minHeight: 44, alignItems: 'center' },
  input: { fontFamily: 'Hana2-Regular', fontSize: 16, color: palette.ink, backgroundColor: palette.warm, borderRadius: 12, padding: 14, minHeight: 52 },
  checkbox: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 },
});
