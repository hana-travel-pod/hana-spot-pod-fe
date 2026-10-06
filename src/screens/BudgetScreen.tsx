import { useCallback, useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import RecommendationLoading from '../components/RecommendationLoading';
import { getRecommendations } from '../services/recommendation';
import { BudgetOptionId } from '../types';
import { CATEGORIES, resolveBudget, useSelection } from '../state/Selection';
import { Button, Check, Copy, Money, Page, Touch, palette, ui } from '../components/MobileUI';

const OPTIONS: { id: BudgetOptionId; label: string; detail: string }[] = [
  { id: 'profit_only', label: '수익금만 사용', detail: '최대 80,000원\n투자 수익 안에서 즐겨요' },
  { id: 'max_available', label: '추가 경험비 사용', detail: '최대 440,000원\n예비비를 제외한 금액' },
  { id: 'custom', label: '직접 입력', detail: '1원부터 440,000원까지 자유롭게' },
];
export default function BudgetScreen() {
  const { categoryId, option, setOption, customRaw, setCustomRaw, setRecommendation } = useSelection();
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState<{ category: string; amount: string } | null>(null);
  const submitting = useRef(false);
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
      submitting.current = false;
      setPending(null);
    };
  }, []));
  const completeLoading = useCallback(() => {
    if (!focused.current || !pending) return;
    router.push({ pathname: '/result', params: pending });
  }, [pending]);
  const budget = resolveBudget(option, customRaw);
  if (pending) return <RecommendationLoading onComplete={completeLoading} />;
  return <Page title="금액 선택" step={3} footer={<Button title="추천 결과 보기" disabled={!categoryId || !option || !!budget.error} onPress={() => {
    if (submitting.current || !categoryId || budget.error) return;
    submitting.current = true;
    Keyboard.dismiss();
    setRecommendation({ categoryId, amount: budget.amount, results: getRecommendations(categoryId, budget.amount) });
    setPending({ category: categoryId, amount: String(budget.amount) });
  }} />}>
    <View><Copy tone="small" style={ui.muted}>{CATEGORIES.find(c => c.id === categoryId)?.label ?? '경험을 먼저 선택해 주세요'}</Copy><Copy tone="title">얼마까지 사용할까요?</Copy></View>
    <View><Copy tone="small" style={ui.muted}>이번 추천 예산</Copy><Money amount={budget.amount} /><Copy tone="small" style={ui.muted}>4인 전체 예산{'\n'}기본 여행비와 예비비는 제외</Copy></View>
    <View style={{ gap: 4 }}>{OPTIONS.map(item => <Touch key={item.id} selected={option === item.id} label={item.label} onPress={() => { setOption(item.id); setTouched(false); if (item.id !== 'custom') Keyboard.dismiss(); }}><View style={{ flex: 1 }}><Copy tone="label">{item.label}</Copy><Copy tone="small" style={ui.muted}>{item.detail}</Copy></View><Check selected={option === item.id} /></Touch>)}</View>
    {option === 'custom' && <View><Copy tone="small">사용할 금액</Copy><View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: touched && budget.error ? palette.red : palette.green }}><TextInput accessibilityLabel="직접 입력 예산" value={customRaw} onChangeText={value => { setCustomRaw(value.replace(/[^0-9,]/g, '')); setTouched(true); }} onBlur={() => setTouched(true)} autoFocus keyboardType="number-pad" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} placeholder="금액 입력" maxLength={9} style={{ flex: 1, minHeight: 58, fontFamily: 'Hana2-Bold', fontSize: 28, color: palette.ink }} /><Copy>원</Copy></View>{touched && !!budget.error && <Copy accessibilityLiveRegion="polite" tone="small" style={{ color: palette.red, marginTop: 8 }}>{budget.error}</Copy>}</View>}
    <Copy tone="small" style={ui.muted}>현금화 480,000원 − 예비비 40,000원{ '\n' }최대 440,000원 안에서 추천해 드려요.</Copy>
  </Page>;
}
