import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  calendarDays,
  DateRange,
  selectRangeDate,
  shiftMonth,
  today,
  tripDuration,
} from "../domain";
import { colors, styles as s } from "../theme";
import { Button, Icon, IconButton, Sheet } from "./UI";
import { AppText as Text } from "./Typography";

export function DateRangeField({
  value,
  onChange,
  minimumDate,
}: {
  value: DateRange;
  minimumDate?: string;
  onChange: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState((value.startDate || today()).slice(0, 7));
  const duration = tripDuration(draft);
  const canApply =
    !!duration && (!minimumDate || draft.startDate >= minimumDate);
  const [year, monthNumber] = month.split("-").map(Number);
  const show = () => {
    setDraft(value);
    setMonth((value.startDate || today()).slice(0, 7));
    setOpen(true);
  };
  return (
    <View style={s.field}>
      <Text style={s.label}>여행 일정</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="여행 일정 선택"
        accessibilityState={{ expanded: open }}
        onPress={show}
        style={[s.input, s.between, { gap: 10 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: value.startDate ? colors.text : colors.muted }}>
            {value.startDate && value.endDate
              ? `${value.startDate.replaceAll("-", ".")} ~ ${value.endDate.replaceAll("-", ".")}`
              : "출발일과 귀국일 선택"}
          </Text>
          {tripDuration(value) && (
            <Text style={[s.muted, { marginTop: 4 }]}>
              {tripDuration(value)}
            </Text>
          )}
        </View>
        <Icon name="calendar-outline" color={colors.green} />
      </Pressable>
      {open && (
        <Sheet
          title="여행 일정 선택"
          onClose={() => setOpen(false)}
          footer={
            <Button
              title="일정 적용"
              disabled={!canApply}
              onPress={() => {
                if (!canApply) return;
                onChange(draft);
                setOpen(false);
              }}
            />
          }
        >
          <ScrollView contentContainerStyle={[s.page, { paddingTop: 24 }]}>
            <View style={[s.row, { gap: 10 }]}>
              {(
                [
                  ["출발일", draft.startDate],
                  ["귀국일", draft.endDate],
                ] as const
              ).map(([label, date]) => (
                <View
                  key={label}
                  style={{
                    flex: 1,
                    minHeight: 84,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: date ? colors.mint : colors.bg,
                  }}
                >
                  <Text style={s.muted}>{label}</Text>
                  <Text
                    style={{
                      marginTop: 8,
                      fontWeight: "500",
                      color: date ? colors.green : colors.muted,
                    }}
                  >
                    {date ? date.replaceAll("-", ".") : "선택해주세요"}
                  </Text>
                </View>
              ))}
            </View>
            <Text
              accessibilityLiveRegion="polite"
              style={[s.muted, { marginTop: 16, marginBottom: 20 }]}
            >
              {!draft.startDate
                ? "출발일을 먼저 선택해주세요."
                : !draft.endDate
                  ? "이제 귀국일을 선택해주세요."
                  : "다른 날짜를 누르면 새 일정 선택을 시작해요."}
            </Text>
            <View style={[s.between, { marginBottom: 20 }]}>
              <IconButton
                name="chevron-back"
                label="여행 일정 이전 달"
                onPress={() => setMonth(shiftMonth(month, -1))}
              />
              <Text style={s.title}>
                {year}년 {monthNumber}월
              </Text>
              <IconButton
                name="chevron-forward"
                label="여행 일정 다음 달"
                onPress={() => setMonth(shiftMonth(month, 1))}
              />
            </View>
            <View style={s.row}>
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <Text
                  key={day}
                  style={[
                    s.muted,
                    {
                      width: "14.2857%",
                      textAlign: "center",
                      marginBottom: 10,
                    },
                  ]}
                >
                  {day}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {calendarDays(month).map((date, i) => {
                const disabled = !!date && !!minimumDate && date < minimumDate;
                const endpoint =
                  !!date &&
                  (date === draft.startDate || date === draft.endDate);
                const inside =
                  !!date &&
                  !!draft.endDate &&
                  date > draft.startDate &&
                  date < draft.endDate;
                const inRange = endpoint || inside;
                return (
                  <View
                    key={date || `blank-${i}`}
                    style={{ width: "14.2857%", paddingVertical: 3 }}
                  >
                    {date ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`여행 일정 ${date}${date === draft.startDate ? ", 출발일" : date === draft.endDate ? ", 귀국일" : inside ? ", 여행 기간" : ""}`}
                        accessibilityState={{ selected: inRange, disabled }}
                        disabled={disabled}
                        onPress={() =>
                          setDraft((current) => selectRangeDate(current, date))
                        }
                        style={{
                          opacity: disabled ? 0.4 : 1,
                          minHeight: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: endpoint
                            ? colors.green
                            : inside
                              ? colors.mint
                              : colors.white,
                          borderRadius: endpoint ? 12 : 0,
                        }}
                      >
                        <Text
                          style={{
                            color: endpoint
                              ? colors.white
                              : inside || date === today()
                                ? colors.green
                                : colors.text,
                            fontWeight: inRange ? "500" : "400",
                          }}
                        >
                          {Number(date.slice(8))}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={{ height: 44 }} />
                    )}
                  </View>
                );
              })}
            </View>
            <View style={[s.notice, { alignItems: "center" }]}>
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  color: duration ? colors.green : colors.muted,
                  fontWeight: "500",
                }}
              >
                {duration || "두 날짜를 선택하면 여행 기간이 표시돼요"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="여행 일정 선택 해제"
              onPress={() => {
                onChange({ startDate: "", endDate: "" });
                setOpen(false);
              }}
              style={{ alignItems: "center", padding: 14 }}
            >
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                일정 선택 해제
              </Text>
            </Pressable>
          </ScrollView>
        </Sheet>
      )}
    </View>
  );
}
