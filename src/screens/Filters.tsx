import { AppText as Text } from "../components/Typography";
import React, { useState } from "react";
import { ScrollView, View, Switch, Pressable } from "react-native";
import { Button, Chips, Field, Sheet } from "../components/UI";
import {
  Age,
  Filters as FilterType,
  Gender,
  emptyFilters,
  validDate,
} from "../domain";
import { DestinationSearch } from "../components/DestinationSearch";
import { findDestination } from "../destinations";
import { DateRangeField } from "../components/DateRangeField";
import { InvestmentCard } from "../components/InvestmentCard";
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
  const [destinationPending, setDestinationPending] = useState(false);
  const [destinationReset, setDestinationReset] = useState(0);
  const set = <K extends keyof FilterType>(key: K, value: FilterType[K]) => {
    setF({ ...f, [key]: value });
    setError("");
  };
  const apply = () => {
    if (destinationPending) {
      setError("검색 결과에서 여행 목적지를 선택하거나 검색어를 지워주세요.");
      return;
    }
    if (f.budget && (!/^\d+$/.test(f.budget) || Number(f.budget) <= 0)) {
      setError("최대 예산을 양의 정수로 입력해주세요.");
      return;
    }
    if (
      (f.startDate && !validDate(f.startDate)) ||
      (f.endDate && !validDate(f.endDate)) ||
      (f.startDate && f.endDate && f.startDate > f.endDate)
    ) {
      setError("날짜 형식과 시작 / 종료 순서를 확인해주세요.");
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
                  setDestinationReset((current) => current + 1);
                  setDestinationPending(false);
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
        style={s.scroll}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.page, { paddingTop: 24 }]}
      >
        <DestinationSearch
          key={`${destinationReset}:${f.destinationId || "empty"}`}
          value={findDestination(f.destinationId)}
          onPendingChange={setDestinationPending}
          onChange={(destination) =>
            set("destinationId", destination?.id || "")
          }
        />
        <Field
          label="1인 최대 기본 경비 (원)"
          placeholder="예: 1000000"
          keyboardType="number-pad"
          value={f.budget}
          onChangeText={(v) => set("budget", v)}
        />
        <DateRangeField
          value={{ startDate: f.startDate, endDate: f.endDate }}
          onChange={(range) => {
            setF((current) => ({ ...current, ...range }));
            setError("");
          }}
        />
        <View style={s.field}>
          <Text style={s.label}>투자 여부 / 스타일</Text>
          <View style={[s.row, { gap: 6 }]}>
            {(["전체", "안정", "균형", "공격", "없음"] as const).map(
              (investment) => (
                <Pressable
                  key={investment}
                  accessibilityRole="button"
                  accessibilityState={{ selected: f.investment === investment }}
                  onPress={() => set("investment", investment)}
                  style={[
                    s.chip,
                    { flex: 1, paddingHorizontal: 0, alignItems: "center" },
                    f.investment === investment && s.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      f.investment === investment && s.chipTextActive,
                    ]}
                  >
                    {investment}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
          {f.investment !== "전체" && f.investment !== "없음" && (
            <InvestmentCard investment={f.investment} />
          )}
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
            성별 / 연령 제한이 없는 팟도 함께 표시해요.
          </Text>
        </View>
        <View style={s.between}>
          <Text style={s.label}>본인인증 필수 팟만</Text>
          <Switch
            accessibilityLabel="본인인증 필수 팟만"
            value={f.verifiedOnly}
            onValueChange={(v) => set("verifiedOnly", v)}
            trackColor={{ false: colors.line, true: colors.green }}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
