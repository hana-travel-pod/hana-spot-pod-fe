import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { BUDGET, MEETING } from '../data/meeting';
import { formatWon } from '../utils/budget';
import { Button, Copy, Fade, Money, Page, Row, ui } from '../components/MobileUI';

export default function StartScreen() {
  return <Page title="우리의 여행" step={1} back={false} footer={<Button title="우리에게 맞는 경험 찾기" onPress={() => router.push('/category')} />}>
    <Fade><View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 18 }}><Image source={require('../../assets/byeoldori-main.png')} accessibilityLabel="노트북 앞에 앉은 별돌이" style={{ width: 116, height: 116, flexShrink: 0 }} resizeMode="contain" /><View style={{ flex: 1 }}><Copy tone="title" style={{ fontSize: 25, lineHeight: 34 }}>여행에 즐거움을{ '\n' }하나 더.</Copy><Copy tone="small" style={ui.muted}>함께 모은 수익으로 만드는 특별한 경험</Copy></View></View></Fade>
    <View style={{ paddingVertical: 20, borderBottomWidth: 1, borderColor: '#E6E8E4' }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Copy tone="small" style={ui.muted}>{MEETING.name}</Copy><Copy tone="small" style={ui.muted}>{MEETING.memberCount}명</Copy></View><Copy tone="label" style={{ marginTop: 16 }}>사용 가능한 추가 경험비</Copy><Money amount={BUDGET.maxAvailable} /><Copy tone="small" style={ui.muted}>기본 여행비는 그대로, 더 즐길 수 있는 금액이에요.</Copy></View>
    <View><Row label="현금화 완료" value={formatWon(MEETING.realizedAmount)} /><Row label="따로 보관할 예비비" value={'− ' + formatWon(MEETING.reserveFund)} /><View style={ui.divider} /><Row label="추가 경험에 사용할 수 있는 금액" value={formatWon(BUDGET.maxAvailable)} /></View>
    <View style={{ backgroundColor: '#F6F5F1', padding: 16, borderRadius: 12 }}><Copy tone="small" style={ui.muted}>기본 여행비 {formatWon(MEETING.basicTravelCost)}은{ '\n' }이번 추천의 사용 범위에 포함되지 않아요.</Copy></View>
  </Page>;
}
