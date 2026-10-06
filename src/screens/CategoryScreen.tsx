import Ionicons from '@expo/vector-icons/Ionicons';
import { CategoryId } from '../types';
import { View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORIES, useSelection } from '../state/Selection';
import { Button, Check, Copy, Page, Touch, palette, ui } from '../components/MobileUI';

const CATEGORY_ICONS: Record<CategoryId, React.ComponentProps<typeof Ionicons>['name']> = { dining: 'restaurant-outline', accommodation: 'bed-outline', performance: 'ticket-outline', activity: 'bicycle-outline', shopping: 'bag-handle-outline' };

export default function CategoryScreen() {
  const { categoryId, setCategoryId } = useSelection();
  return <Page title="경험 선택" step={2} footer={<Button title="예산 선택하기" disabled={!categoryId} onPress={() => router.push('/budget')} />}>
    <View><Copy tone="title">어떤 순간을{ '\n' }더하고 싶나요?</Copy><Copy style={[ui.muted, { marginTop: 8 }]}>우리 네 명이 함께 즐길 경험을 골라 주세요.</Copy></View>
    <View style={{ gap: 4 }}>{CATEGORIES.map(category => <Touch key={category.id} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} label={category.label}><View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#F4F6F5', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={CATEGORY_ICONS[category.id]} size={20} color={categoryId === category.id ? palette.green : palette.ink} /></View><View style={{ flex: 1 }}><Copy tone="label">{category.label}</Copy><Copy tone="small" style={ui.muted}>{category.description}</Copy></View><Check selected={categoryId === category.id} /></Touch>)}</View>
  </Page>;
}
