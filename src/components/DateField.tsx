import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { calendarDays, shiftMonth, today } from "../domain";
import { Icon, IconButton } from "./UI";
import { colors, styles as s } from "../theme";

export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: string;
  maximumDate?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    (value || minimumDate || today()).slice(0, 7),
  );
  const toggle = () => {
    if (!open) setMonth((value || minimumDate || today()).slice(0, 7));
    setOpen(!open);
  };
  const [year, monthNumber] = month.split("-").map(Number);
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${value || "미정"}, 달력 열기`}
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={[s.input, s.between]}
      >
        <Text
          style={{ color: value ? colors.text : colors.muted, fontSize: 15 }}
        >
          {value ? value.replaceAll("-", ".") : "날짜 선택 (선택 사항)"}
        </Text>
        <Icon name="calendar-outline" color={colors.green} />
      </Pressable>
      {open && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 16,
            marginTop: 8,
            padding: 10,
            backgroundColor: colors.bg,
          }}
        >
          <View style={[s.between, { marginBottom: 10 }]}>
            <IconButton
              name="chevron-back"
              label={`${label} 이전 달`}
              onPress={() => setMonth(shiftMonth(month, -1))}
            />
            <Text style={s.label}>
              {year}년 {monthNumber}월
            </Text>
            <IconButton
              name="chevron-forward"
              label={`${label} 다음 달`}
              onPress={() => setMonth(shiftMonth(month, 1))}
            />
          </View>
          <View style={s.row}>
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <Text
                key={day}
                style={{
                  width: "14.2857%",
                  textAlign: "center",
                  fontSize: 12,
                  color: colors.muted,
                  marginBottom: 6,
                }}
              >
                {day}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {calendarDays(month).map((date, i) => {
              const disabled =
                !date ||
                !!(minimumDate && date < minimumDate) ||
                !!(maximumDate && date > maximumDate);
              return (
                <View
                  key={date || `empty-${i}`}
                  style={{ width: "14.2857%", padding: 2 }}
                >
                  {date ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${label} ${date}`}
                      accessibilityState={{
                        disabled,
                        selected: value === date,
                      }}
                      disabled={disabled}
                      onPress={() => {
                        onChange(date);
                        setOpen(false);
                      }}
                      style={{
                        minHeight: 40,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          value === date ? colors.green : "transparent",
                        opacity: disabled ? 0.25 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color:
                            value === date
                              ? "#fff"
                              : date === today()
                                ? colors.green
                                : colors.text,
                          fontWeight: value === date ? "700" : "400",
                        }}
                      >
                        {Number(date.slice(8))}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={{ height: 40 }} />
                  )}
                </View>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onChange("");
              setOpen(false);
            }}
            style={{ padding: 12, alignItems: "center" }}
          >
            <Text style={{ color: colors.green, fontSize: 13 }}>
              날짜 선택 해제
            </Text>
          </Pressable>
        </View>
      )}
      {hint && <Text style={[s.muted, { marginTop: 7 }]}>{hint}</Text>}
    </View>
  );
}
