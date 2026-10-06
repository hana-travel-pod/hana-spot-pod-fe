import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { formatWon } from '../utils/budget';

export const palette = { ink: '#202C30', muted: '#778286', green: '#009B87', mint: '#EAF8F3', line: '#E6E8E4', warm: '#F6F5F1', red: '#B94737' };
export function Copy({ tone = 'body', style, ...props }: TextProps & { tone?: 'body' | 'title' | 'label' | 'small' | 'amount' }) {
  return <Text {...props} style={[{ color: palette.ink, fontFamily: tone === 'title' || tone === 'amount' ? 'Hana2-Bold' : tone === 'label' ? 'Hana2-Medium' : 'Hana2-Regular', fontSize: tone === 'title' ? 28 : tone === 'amount' ? 38 : tone === 'small' ? 13 : 16, lineHeight: tone === 'title' ? 37 : tone === 'amount' ? 48 : tone === 'small' ? 20 : 24 }, style]} />;
}
export function Fade({ children, delay = 0 }: PropsWithChildren<{ delay?: number }>) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let disposed = false;
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (disposed) return;
      if (reduce) value.setValue(1);
      else { animation = Animated.timing(value, { toValue: 1, duration: 220, delay, useNativeDriver: true }); animation.start(); }
    }).catch(() => value.setValue(1));
    return () => { disposed = true; animation?.stop(); };
  }, [value, delay]);
  return <Animated.View style={{ opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>{children}</Animated.View>;
}
export function Touch({ children, onPress, selected = false, disabled = false, button = false, dark = false, label }: PropsWithChildren<{ onPress: () => void; selected?: boolean; disabled?: boolean; button?: boolean; dark?: boolean; label?: string }>) {
  const [scale] = useState(() => new Animated.Value(1));
  const [selection] = useState(() => new Animated.Value(selected ? 1 : 0));
  useEffect(() => {
    const transition = Animated.timing(selection, { toValue: selected ? 1 : 0, duration: 140, useNativeDriver: false });
    transition.start();
    return () => transition.stop();
  }, [selected, selection]);
  const animate = (toValue: number) => Animated.timing(scale, { toValue, duration: 90, useNativeDriver: true }).start();
  return <Animated.View style={{ transform: [{ scale }], borderRadius: 14, backgroundColor: button ? (dark ? palette.ink : palette.green) : selection.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', palette.mint] }), opacity: disabled ? .4 : 1 }}><Pressable accessibilityRole={button ? 'button' : 'radio'} accessibilityLabel={label} aria-checked={button ? undefined : selected} aria-selected={button ? undefined : selected} aria-disabled={disabled} accessibilityState={{ selected, checked: button ? undefined : selected, disabled }} disabled={disabled} onPressIn={() => animate(.985)} onPressOut={() => animate(1)} onPress={() => { if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {}); onPress(); }} style={[button ? ui.button : ui.choice, { backgroundColor: 'transparent' }]}>{children}</Pressable></Animated.View>;
}
export function Button({ title, onPress, disabled, dark = false }: { title: string; onPress: () => void; disabled?: boolean; dark?: boolean }) {
  return <Touch onPress={onPress} disabled={disabled} button dark={dark} label={title}><Copy tone="label" style={{ color: '#fff', textAlign: 'center' }}>{title}</Copy></Touch>;
}
export function Check({ selected }: { selected: boolean }) {
  return <View style={[ui.check, selected && { backgroundColor: palette.green, borderColor: palette.green }]}><Copy style={{ color: '#fff', fontSize: 14 }}>{selected ? '✓' : ''}</Copy></View>;
}
export function Row({ label, value }: { label: string; value: string }) {
  return <View style={ui.row}><Copy tone="small" style={{ color: palette.muted, flex: 1 }}>{label}</Copy><Copy tone="label" style={{ fontSize: 14 }}>{value}</Copy></View>;
}
export function Money({ amount }: { amount: number }) {
  return <Fade key={amount}><Copy tone="amount" adjustsFontSizeToFit numberOfLines={1}>{formatWon(amount)}</Copy></Fade>;
}
export function Page({ children, title, step, footer, back = true }: PropsWithChildren<{ title: string; step: number; footer: React.ReactNode; back?: boolean }>) {
  const [height, setHeight] = useState(0);
  const [entrance] = useState(() => new Animated.Value(Platform.OS === 'web' && step <= 3 ? 0 : 1));
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'web' || step > 3) return;
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    entrance.setValue(0);
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) return;
      if (reduce) { entrance.setValue(1); return; }
      animation = Animated.timing(entrance, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true });
      animation.start();
    }).catch(() => { if (active) entrance.setValue(1); });
    return () => { active = false; animation?.stop(); entrance.setValue(1); };
  }, [entrance, step]));
  return <View style={ui.outer}><SafeAreaView style={[ui.safe, { overflow: 'hidden' }]} edges={['top', 'bottom']}><Animated.View testID="page-transition" style={{ flex: 1, opacity: entrance, transform: [{ translateX: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={ui.header}>{back ? <Pressable accessibilityRole="button" accessibilityLabel="이전 단계" onPress={() => router.back()} hitSlop={10} style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}><Ionicons name="chevron-back" size={22} color={palette.ink} /></Pressable> : <Copy tone="label">하나픽</Copy>}<View style={{ flexDirection: 'row', gap: 16 }}><Copy tone="small" style={{ color: palette.muted }}>{title}</Copy><Copy tone="small" style={{ color: palette.muted }}>{step} / 4</Copy></View></View>
    <View style={ui.progress}>{[1, 2, 3, 4].map(n => <View key={n} style={{ flex: 1, height: 2, borderRadius: 2, backgroundColor: n <= step ? palette.green : palette.line }} />)}</View>
    <ScrollView onLayout={event => setHeight(event.nativeEvent.layout.height)} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[ui.content, { minHeight: height }]}>{children}</ScrollView>
    <View style={ui.footer}>{footer}</View>
  </KeyboardAvoidingView></Animated.View></SafeAreaView></View>;
}
export const ui = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#E9EFEC', alignItems: 'center' }, safe: { flex: 1, width: '100%', maxWidth: 430, backgroundColor: '#fff' },
  header: { paddingHorizontal: 24, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 24 },
  content: { padding: 22, paddingTop: 26, paddingBottom: 32, gap: 24 }, footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, gap: 8, backgroundColor: '#fff' },
  button: { backgroundColor: palette.green, padding: 16, borderRadius: 12, minHeight: 56 },
  choice: { paddingVertical: 18, paddingHorizontal: 14, borderRadius: 14, backgroundColor: palette.warm, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 86 }, selected: { backgroundColor: palette.mint },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#AFB7B2', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', paddingVertical: 5 },
  divider: { height: 1, backgroundColor: palette.line, marginVertical: 12 }, muted: { color: palette.muted },
});
