import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';

interface Props {
  title: string;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export default function ScreenHeader({ title, onBack, currentStep, totalSteps }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable style={styles.backBtn} onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.stepBar}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepSegment,
              i < currentStep ? styles.stepActive : styles.stepInactive,
              i === 0 && styles.segmentFirst,
              i === totalSteps - 1 && styles.segmentLast,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  stepBar: {
    flexDirection: 'row',
    height: 3,
    marginHorizontal: SPACING.md,
    marginBottom: 1,
    gap: 3,
  },
  stepSegment: {
    flex: 1,
    height: 3,
  },
  segmentFirst: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  segmentLast: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  stepActive: {
    backgroundColor: COLORS.primary,
  },
  stepInactive: {
    backgroundColor: COLORS.border,
  },
});
