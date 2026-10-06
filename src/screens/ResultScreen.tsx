import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getRecommendations } from '../services/recommendation';
import { CATEGORIES, useSelection } from '../state/Selection';
import { formatWon } from '../utils/budget';
import { Button, Copy, Fade, Page, Row, palette, ui } from '../components/MobileUI';

export default function ResultScreen() {
  const { category, amount } = useLocalSearchParams<{ category?: string; amount?: string }>();
  const selectedCategory = CATEGORIES.find(c => c.id === category);
  const budgetAmount = Number(amount);
  const [selected, setSelected] = useState<string | null>(null);
  const { recommendation } = useSelection();
  const results = useMemo(() => recommendation && recommendation.categoryId === category && recommendation.amount === budgetAmount ? recommendation.results : selectedCategory && Number.isFinite(budgetAmount) && budgetAmount >= 1 && budgetAmount <= 440000 ? getRecommendations(selectedCategory.id, budgetAmount) : [], [recommendation, category, selectedCategory, budgetAmount]);
  const changeConditions = () => router.dismissTo('/category');
  const hasAffordable = results.some(result => result.isAffordable);
  return <Page title="추천 결과" step={4} footer={<Button title="조건 바꾸기" onPress={changeConditions} />}>
    <View><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Copy tone="small" style={ui.muted}>{selectedCategory?.label ?? '조건 확인 필요'}</Copy><Copy tone="small" style={ui.muted}>4인</Copy></View><Copy tone="small" style={ui.muted}>예산 {Number.isFinite(budgetAmount) ? formatWon(budgetAmount) : '확인 필요'}</Copy><Copy tone="title" style={{ marginTop: 8 }}>우리의 다음 경험</Copy><Copy tone="small" style={[ui.muted, { marginTop: 8 }]}>후보와 가격은 시연용 예시입니다.</Copy></View>
    {!hasAffordable && <View style={{ paddingVertical: 12 }}><Copy tone="label">이 예산으로 선택할 수 있는 후보가 없어요.</Copy><Copy tone="small" style={[ui.muted, { marginTop: 6 }]}>선택한 경험의 예시 가격보다 예산이 적거나 조건이 유효하지 않아요. 카테고리나 금액을 바꿔 주세요.</Copy><View style={{ marginTop: 14 }}><Button title="조건 바꾸기" onPress={changeConditions} /></View></View>}
    {results.map((result, index) => <Fade key={`${category}-${amount}-${result.candidate.id}`} delay={index * 65}><View style={{ paddingVertical: 24, paddingHorizontal: 2, borderTopWidth: 1, borderColor: palette.line, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Copy tone="small" style={ui.muted}>{String(index + 1).padStart(2, '0')}</Copy><Copy tone="small" style={ui.muted}>{result.isAffordable ? '예산 내 추천' : '예산 초과\n선택 불가'}</Copy></View>
      <Copy tone="title" style={{ fontSize: 21, lineHeight: 29 }}>{result.candidate.name}</Copy>
      <Copy tone="small" style={ui.muted}>{result.candidate.description}. {result.candidate.highlight}.</Copy>
      <View style={{ marginTop: 6 }}><Copy tone="small" style={ui.muted}>4인 총액</Copy><Copy tone="amount" style={{ fontSize: 30, lineHeight: 40 }}>{formatWon(result.candidate.totalPrice)}</Copy></View>
      <Row label="1인당" value={formatWon(result.perPersonAmount)} /><View style={[ui.divider, { marginVertical: 0 }]} />
      <Row label="사용 후 잔액" value={result.isAffordable ? formatWon(result.remainingBudget) : '선택 불가'} />
      {!result.isAffordable ? <Copy tone="small" style={{ color: palette.red }}>예산보다 {formatWon(result.overAmount)} 초과하여 선택할 수 없어요.</Copy> : <Button dark title={selected === result.candidate.id ? '선택 완료 (시연용)' : '이 경험 선택하기'} onPress={() => setSelected(result.candidate.id)} />}
      {selected === result.candidate.id && <Copy accessibilityLiveRegion="polite" tone="small" style={{ color: palette.green }}>시연용 선택이 완료되었어요. 실제 결제나 제안 전송은 이루어지지 않아요.</Copy>}
    </View></Fade>)}
  </Page>;
}
