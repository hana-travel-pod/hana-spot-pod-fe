import React, { useState } from "react";
import { ScrollView, View, Text, Switch } from "react-native";
import { Button, Chips, Field, Sheet } from "../components/UI";
import {
  Age,
  Filters as FilterType,
  Gender,
  Investment,
  emptyFilters,
  validDate,
} from "../domain";
import { DateField } from "../components/DateField";
import { colors, styles as s } from "../theme";
export function Filters({
  initial,
  onClose,
  onApply,
}: {
  initial: FilterType;
  onClose: () => void;
  onApply: (v: FilterType) => void;
}) {
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof FilterType>(key: K, value: FilterType[K]) => {
    setF({ ...f, [key]: value });
    setError("");
  };
  const apply = () => {
    if (f.budget && (!/^\d+$/.test(f.budget) || Number(f.budget) <= 0)) {
      setError("최대 예산을 양의 정수로 입력해주세요.");
      return;
    }
    if (
      (f.startDate && !validDate(f.startDate)) ||
      (f.endDate && !validDate(f.endDate)) ||
      (f.startDate && f.endDate && f.startDate > f.endDate)
    ) {
      setError("날짜 형식과 시작·종료 순서를 확인해주세요.");
      return;
    }
    onApply(f);
  };
  return (
    <Sheet
      title="나에게 맞는 팟 찾기"
      onClose={onClose}
      footer={
        <>
          {error && <Text style={s.error}>{error}</Text>}
          <View style={[s.row, { gap: 10 }]}>
            <View style={{ flex: 1 }}>
              <Button
                title="초기화"
                secondary
                onPress={() => {
                  setF(emptyFilters);
                  setError("");
                }}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Button title="조건 적용하기" onPress={apply} />
            </View>
          </View>
        </>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.page, { paddingTop: 24 }]}
      >
        <Field
          label="1인 최대 기본 경비 (원)"
          placeholder="예: 1000000"
          hint="투자금·예치금 제외 · 경비 미정인 팟은 예산 필터에서 제외돼요."
          keyboardType="number-pad"
          value={f.budget}
          onChangeText={(v) => set("budget", v)}
        />
        <DateField
          label="떠날 수 있는 날짜부터"
          value={f.startDate}
          maximumDate={f.endDate || undefined}
          onChange={(v) => set("startDate", v)}
        />
        <DateField
          label="돌아와야 하는 날짜까지"
          value={f.endDate}
          minimumDate={f.startDate || undefined}
          onChange={(v) => set("endDate", v)}
          hint="입력한 기간 안에 여행이 모두 포함된 팟을 찾아요. 일정 미정인 팟은 기간 필터에서 제외돼요."
        />
        <View style={s.field}>
          <Text style={s.label}>투자 여부 · 스타일</Text>
          <Chips<"전체" | Investment>
            values={["전체", "없음", "안정", "균형", "공격"]}
            selected={f.investment}
            onChange={(v) => set("investment", v)}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>성별 참여 조건</Text>
          <Chips<"전체" | Gender>
            values={["전체", "여성", "남성"]}
            selected={f.gender}
            onChange={(v) => set("gender", v)}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>연령대 참여 조건</Text>
          <Chips<"전체" | Age>
            values={["전체", "20대", "30대", "40대", "50대 이상"]}
            selected={f.age}
            onChange={(v) => set("age", v)}
          />
          <Text style={[s.muted, { marginTop: 8 }]}>
            성별·연령 제한이 없는 팟도 함께 표시해요.
          </Text>
        </View>
        <View style={s.between}>
          <Text style={s.label}>본인인증 필수 팟만</Text>
          <Switch
            accessibilityLabel="본인인증 필수 팟만"
            value={f.verifiedOnly}
            onValueChange={(v) => set("verifiedOnly", v)}
            trackColor={{ false: "#DDE4E2", true: colors.green }}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
