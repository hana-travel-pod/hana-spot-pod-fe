import { AppText as Text } from "./Typography";
import React from "react";
import {
  Pressable,
  TextInput,
  View,
  Image,
  TextInputProps,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, styles as s } from "../theme";
import { podImageSource } from "./PodImage";
import {
  Pod,
  today,
  destinationLabel,
  travelDateLabel,
  budgetLabel,
} from "../domain";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 20,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function IconButton({
  name,
  onPress,
  label,
}: {
  name: IconName;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={{ padding: 5 }}
    >
      <Icon name={name} size={24} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  secondary,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: colors.dark },
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      {icon && <Icon name={icon} color={colors.white} />}
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Badge({
  children,
  purple = false,
}: {
  children: React.ReactNode;
  purple?: boolean;
}) {
  return (
    <View style={[s.badge, purple && { backgroundColor: colors.iconBg }]}>
      <Text style={[s.badgeText, purple && { color: colors.text }]}>
        {children}
      </Text>
    </View>
  );
}
export function Chips<T extends string>({
  values,
  selected,
  onChange,
  selectedColors,
}: {
  values: readonly T[];
  selected: T;
  onChange: (v: T) => void;
  selectedColors?: Partial<Record<T, { background: string; accent: string }>>;
}) {
  return (
    <View style={s.chips}>
      {values.map((v) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityState={{ selected: v === selected }}
          onPress={() => onChange(v)}
          style={[
            s.chip,
            selected === v && s.chipActive,
            selected === v &&
              selectedColors?.[v] && {
                backgroundColor: selectedColors[v].background,
                borderColor: selectedColors[v].accent,
              },
          ]}
        >
          <Text
            style={[
              s.chipText,
              selected === v && s.chipTextActive,
              selected === v &&
                selectedColors?.[v] && {
                  color: selectedColors[v].accent,
                },
            ]}
          >
            {v}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 140, textAlignVertical: "top" },
          props.style,
        ]}
      />
      {hint && <Text style={[s.muted, { marginTop: 7 }]}>{hint}</Text>}
    </View>
  );
}
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.modalRoot}>
        <KeyboardAvoidingView
          style={s.modalShell}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.header}>
            <IconButton name="arrow-back" onPress={onClose} label="뒤로 가기" />
            <Text style={[s.title, { fontSize: 17 }]}>{title}</Text>
            <View style={{ width: 34 }} />
          </View>
          {children}
          {footer && <View style={s.footer}>{footer}</View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export function PodCard({
  pod,
  onPress,
  saved,
  onSave,
  status,
}: {
  pod: Pod;
  onPress: () => void;
  saved?: boolean;
  onSave?: () => void;
  status?: string;
}) {
  return (
    <View style={s.card}>
      <View style={{ borderRadius: 20, overflow: "hidden" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${pod.title} 상세 보기`}
          onPress={onPress}
        >
          <Image source={podImageSource(pod.image)} style={s.cardImage} />
          <View
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              backgroundColor: "#fff",
              borderRadius: 7,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{ fontSize: 13, color: colors.dark, fontWeight: "700" }}
            >
              {status ||
                ((pod.startDate || pod.endDate) &&
                (pod.startDate || pod.endDate) < today()
                  ? "모집 종료"
                  : pod.members >= pod.capacity
                    ? "모집 완료"
                    : "모집 중")}
            </Text>
          </View>
          <View style={s.cardBody}>
            <View style={[s.row, { gap: 4, marginBottom: 7 }]}>
              <Icon name="location-outline" size={13} color={colors.green} />
              <Text style={{ fontSize: 13, color: colors.green }}>
                {destinationLabel(pod)}
              </Text>
            </View>
            <Text style={[s.title, { fontSize: 19, marginBottom: 9 }]}>
              {pod.title}
            </Text>
            <View style={[s.row, { gap: 5 }]}>
              <Icon name="calendar-outline" size={14} color={colors.muted} />
              <Text style={s.muted}>{travelDateLabel(pod)}</Text>
            </View>
            <View style={[s.row, { gap: 6, marginTop: 12, flexWrap: "wrap" }]}>
              <Badge>{pod.age === "제한 없음" ? "모든 연령" : pod.age}</Badge>
              {pod.gender !== "제한 없음" && <Badge>{pod.gender}</Badge>}
              <Badge purple={pod.investment !== "없음"}>
                {pod.investment === "없음"
                  ? "여행만 함께"
                  : `${pod.investment} 투자 희망`}
              </Badge>
              {pod.verified && (
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  ✓ 본인인증
                </Text>
              )}
            </View>
            <View
              style={[
                s.between,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.line,
                  marginTop: 15,
                  paddingTop: 14,
                },
              ]}
            >
              <Text style={{ fontSize: 13, color: colors.muted }}>
                1인 기본 경비{" "}
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {budgetLabel(pod.budget)}
                </Text>
              </Text>
              <View style={[s.row, { gap: 4 }]}>
                <Icon name="people-outline" size={15} color={colors.green} />
                <Text
                  style={{
                    color: colors.green,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {pod.members}
                  <Text style={{ color: colors.muted, fontWeight: "400" }}>
                    /{pod.capacity}명
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
        {onSave && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              saved ? `${pod.title} 저장 취소` : `${pod.title} 저장`
            }
            onPress={onSave}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              borderRadius: 20,
              backgroundColor: colors.white,
              padding: 9,
            }}
          >
            <Icon
              name={saved ? "bookmark" : "bookmark-outline"}
              size={19}
              color={saved ? colors.green : colors.dark}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
