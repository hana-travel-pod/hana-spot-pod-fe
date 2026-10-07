import React, { useEffect, useId, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  TextInput,
  View,
  ViewProps,
  ScrollView,
} from "react-native";
import {
  Destination,
  destinationResultLabel,
  destinationTypes,
  lookupDestinations,
} from "../destinations";
import { colors, fonts, styles as s } from "../theme";
import { Icon, IconButton } from "./UI";
import { AppText as Text } from "./Typography";

export function DestinationSearch({
  value,
  onChange,
  onPendingChange,
  search = lookupDestinations,
}: {
  value?: Destination;
  onChange: (destination?: Destination) => void;
  onPendingChange?: (pending: boolean) => void;
  search?: (query: string) => Promise<Destination[]>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Destination[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [active, setActive] = useState(-1);
  const [retry, setRetry] = useState(0);
  const listId = useId();
  const inputRef = useRef<TextInput>(null);
  const webInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<ScrollView>(null);
  const resultOffsets = useRef<Record<number, number>>({});
  useEffect(() => {
    if (open && active >= 0)
      resultsRef.current?.scrollTo({
        y: resultOffsets.current[active] || 0,
        animated: false,
      });
  }, [active, open]);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const timer = setTimeout(() => {
      Promise.resolve()
        .then(() => search(query))
        .then((found) => {
          if (cancelled) return;
          setResults(found);
          setActive(-1);
          setStatus("ready");
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setStatus("error");
          }
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, search, retry]);
  useEffect(() => {
    setQuery("");
    setOpen(false);
    setResults([]);
    setStatus("idle");
    onPendingChange?.(false);
  }, [value?.id]); // A chosen destination or external reset clears the unfinished query.
  const edit = (text: string) => {
    setQuery(text);
    setOpen(true);
    setActive(-1);
    setResults([]);
    setStatus(text.trim() ? "loading" : "idle");
    onPendingChange?.(!!text.trim());
  };
  const choose = (destination: Destination) => {
    onChange(destination);
    setQuery("");
    setOpen(false);
    setResults([]);
    setStatus("idle");
    onPendingChange?.(false);
    inputRef.current?.blur();
    webInputRef.current?.blur();
  };
  const keyDown = (key: string, preventDefault: () => void) => {
    if (key === "Escape") {
      preventDefault();
      setOpen(false);
      setActive(-1);
      return;
    }
    if (key === "ArrowDown" || key === "ArrowUp") {
      preventDefault();
      setOpen(true);
      if (results.length)
        setActive((current) =>
          key === "ArrowDown"
            ? (current + 1) % results.length
            : (current <= 0 ? results.length : current) - 1,
        );
    }
    if (key === "Enter" && open && results.length) {
      preventDefault();
      choose(results[active < 0 ? 0 : active]);
    }
  };
  return (
    <View style={s.field}>
      <Text style={s.label}>여행 목적지</Text>
      {value && (
        <View
          style={[
            s.recommendation,
            { borderRadius: 12, padding: 14, marginBottom: 10 },
          ]}
        >
          <View style={[s.between, { gap: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.muted, { color: colors.green, marginBottom: 4 }]}>
                {destinationTypes[value.type]} / 선택한 목적지
              </Text>
              <Text style={{ fontWeight: "500", lineHeight: 24 }}>
                {destinationResultLabel(value)}
              </Text>
            </View>
            <IconButton
              name="close-circle-outline"
              label="선택한 목적지 지우기"
              onPress={() => {
                onChange(undefined);
                setQuery("");
                setOpen(false);
                onPendingChange?.(false);
              }}
            />
          </View>
        </View>
      )}
      <View
        style={[
          s.row,
          {
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            gap: 8,
          },
        ]}
      >
        <Icon name="search-outline" color={colors.muted} />
        {Platform.OS === "web" ? (
          <input
            ref={webInputRef}
            role="combobox"
            aria-label="여행 목적지"
            aria-autocomplete="list"
            aria-expanded={open && !!query.trim()}
            aria-controls={listId}
            aria-activedescendant={
              open && active >= 0 ? `${listId}-${active}` : undefined
            }
            placeholder="국가, 도시 또는 공항을 검색하세요"
            value={query}
            autoComplete="off"
            onChange={(event) => edit(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(event) =>
              keyDown(event.key, () => {
                event.preventDefault();
                event.stopPropagation();
              })
            }
            onKeyUp={(event) => {
              // React Native Web modals close on document keyup; Esc belongs to the autocomplete here.
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 56,
              border: 0,
              outline: "none",
              background: "transparent",
              color: colors.text,
              fontFamily: fonts.regular,
              fontSize: 16,
            }}
          />
        ) : (
          <TextInput
            ref={inputRef}
            accessibilityLabel="여행 목적지"
            placeholder="국가, 도시 또는 공항을 검색하세요"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={edit}
            onFocus={() => setOpen(true)}
            onKeyPress={(event) =>
              keyDown(event.nativeEvent.key, () => event.preventDefault())
            }
            onSubmitEditing={() => {
              if (open && results.length)
                choose(results[active < 0 ? 0 : active]);
            }}
            returnKeyType="search"
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 56,
              fontFamily: fonts.regular,
              color: colors.text,
              fontSize: 16,
            }}
          />
        )}
        {!!query && (
          <IconButton
            name="close-circle"
            label="목적지 검색어 지우기"
            onPress={() => edit("")}
          />
        )}
      </View>
      {value && (
        <Text style={[s.muted, { marginTop: 7 }]}>
          다른 목적지를 검색해 선택하면 변경돼요.
        </Text>
      )}
      {open && !!query.trim() && (
        <View
          nativeID={listId}
          role={
            Platform.OS === "web" ? ("listbox" as ViewProps["role"]) : undefined
          }
          accessibilityLabel="목적지 검색 결과"
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.white,
          }}
        >
          {status === "loading" && (
            <View style={[s.row, { padding: 16, gap: 8 }]}>
              <ActivityIndicator color={colors.green} />
              <Text style={s.muted}>목적지를 검색하고 있어요.</Text>
            </View>
          )}
          {status === "error" && (
            <View style={{ padding: 16 }}>
              <Text
                accessibilityRole="alert"
                style={[s.muted, { color: colors.error }]}
              >
                검색하지 못했어요. 다시 시도해주세요.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRetry((v) => v + 1)}
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ color: colors.green }}>검색 다시 시도</Text>
              </Pressable>
            </View>
          )}
          {status === "ready" && !results.length && (
            <Text
              accessibilityLiveRegion="polite"
              style={[s.muted, { padding: 16 }]}
            >
              검색 결과가 없어요. 한글명 / 영문명 / 공항 코드를 확인해주세요.
              현재 지원 국가: 대한민국, 일본, 중국, 프랑스, 인도네시아, 미국.
            </Text>
          )}
          <ScrollView
            ref={resultsRef}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 300 }}
          >
            {status === "ready" &&
              results.map((destination, index) => (
                <Pressable
                  key={destination.id}
                  nativeID={`${listId}-${index}`}
                  onLayout={(event) => {
                    resultOffsets.current[index] = event.nativeEvent.layout.y;
                  }}
                  role={Platform.OS === "web" ? "option" : "button"}
                  accessibilityLabel={`${destinationTypes[destination.type]} ${destinationResultLabel(destination)}`}
                  accessibilityState={{ selected: index === active }}
                  // Keep input focus until a pointer selection is committed on the web.
                  {...(Platform.OS === "web"
                    ? {
                        onMouseDown: (event: React.MouseEvent) =>
                          event.preventDefault(),
                      }
                    : {})}
                  onPress={() => choose(destination)}
                  style={{
                    padding: 14,
                    borderBottomWidth: index < results.length - 1 ? 1 : 0,
                    borderColor: colors.line,
                    backgroundColor:
                      index === active ? colors.mint : colors.white,
                  }}
                >
                  <View style={[s.row, { gap: 8, marginBottom: 4 }]}>
                    <Text style={[s.badgeText, s.badge]}>
                      {destinationTypes[destination.type]}
                    </Text>
                    <Text style={[s.muted, { flex: 1 }]}>
                      {destination.nameEn}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, lineHeight: 24 }}>
                    {destinationResultLabel(destination)}
                  </Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      )}
      {!value && !query && (
        <Text style={[s.muted, { marginTop: 7 }]}>
          국가 전체, 도시의 모든 공항 또는 특정 공항을 선택할 수 있어요.
          대한민국 / 일본 / 중국 / 프랑스 / 인도네시아 / 미국의 주요 목적지를
          지원해요.
        </Text>
      )}
    </View>
  );
}
