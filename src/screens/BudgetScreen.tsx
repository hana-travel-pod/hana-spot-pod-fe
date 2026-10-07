import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import RecommendationLoading from '../components/RecommendationLoading';
import { getRecommendations } from '../services/recommendation';
import { BudgetOptionId } from '../types';
import { BUDGET } from '../data/meeting';
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
  const [capped, setCapped] = useState(false);
  const [pending, setPending] = useState<{ category: string; amount: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const inputY = useRef(0);
  const revealInput = useCallback(() => scrollRef.current?.scrollTo({ y: Math.max(0, inputY.current - 24), animated: true }), []);
  useEffect(() => {
    if (option !== 'custom' || pending) return;
    const timer = setTimeout(() => { revealInput(); inputRef.current?.focus(); }, 200);
    const keyboard = Keyboard.addListener('keyboardDidShow', revealInput);
    return () => { clearTimeout(timer); keyboard.remove(); };
  }, [option, pending, revealInput]);
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
  return <Page scrollRef={scrollRef} title="금액 선택" step={3} footer={<Button title="추천 결과 보기" disabled={!categoryId || !option || !!budget.error} onPress={() => {
    if (submitting.current || !categoryId || budget.error) return;
    submitting.current = true;
    Keyboard.dismiss();
    setRecommendation({ categoryId, amount: budget.amount, results: getRecommendations(categoryId, budget.amount) });
    setPending({ category: categoryId, amount: String(budget.amount) });
  }} />}>
    <View><Copy tone="small" style={ui.muted}>{CATEGORIES.find(c => c.id === categoryId)?.label ?? '경험을 먼저 선택해 주세요'}</Copy><Copy tone="title">얼마까지 사용할까요?</Copy></View>
    <View><Copy tone="small" style={ui.muted}>이번 추천 예산</Copy><Money amount={budget.amount} /><Copy tone="small" style={ui.muted}>4인 전체 예산{'\n'}기본 여행비와 예비비는 제외</Copy></View>
    <View style={{ gap: 4 }}>{OPTIONS.map(item => <Touch key={item.id} selected={option === item.id} label={item.label} onPress={() => { setOption(item.id); setTouched(false); setCapped(false); if (item.id !== 'custom') Keyboard.dismiss(); else { revealInput(); inputRef.current?.focus(); } }}><View style={{ flex: 1 }}><Copy tone="label">{item.label}</Copy><Copy tone="small" style={ui.muted}>{item.detail}</Copy></View><Check selected={option === item.id} /></Touch>)}</View>
    {option === 'custom' && <View onLayout={event => { inputY.current = event.nativeEvent.layout.y; }} style={{ gap: 10 }}>
      <Copy tone="label">사용할 금액</Copy>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderColor: touched && budget.error ? palette.red : palette.green }}>
        <TextInput ref={inputRef} accessibilityLabel="직접 입력 예산" editable selectTextOnFocus value={customRaw} onChangeText={value => {
          const digits = value.replace(/[^0-9]/g, '');
          const exceedsMax = Number(digits) > BUDGET.maxAvailable;
          setCustomRaw(exceedsMax ? String(BUDGET.maxAvailable) : digits);
          setCapped(exceedsMax); setTouched(true);
        }} onFocus={revealInput} keyboardType="number-pad" inputMode="numeric" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} maxLength={9} style={{ flex: 1, minWidth: 0, minHeight: 64, fontFamily: 'Hana2-Bold', fontSize: 28, color: palette.ink }} />
        <Copy>원</Copy>
      </View>
      <Copy tone="small" style={ui.muted}>{capped ? '최대 440,000원으로 적용했어요.' : '최대 440,000원까지 입력할 수 있어요.'}</Copy>
      {touched && !!budget.error && <Copy accessibilityLiveRegion="polite" tone="small" style={{ color: palette.red }}>{budget.error}</Copy>}
      <Copy tone="small" style={ui.muted}>입력한 금액이 이번 추천 예산에 바로 반영돼요.</Copy>
      <Button title="입력 완료" disabled={!!budget.error} onPress={() => { setTouched(true); Keyboard.dismiss(); inputRef.current?.blur(); }} />
    </View>}
    <Copy tone="small" style={ui.muted}>현금화 480,000원 − 예비비 40,000원{ '\n' }최대 440,000원 안에서 추천해 드려요.</Copy>
  </Page>;
}
