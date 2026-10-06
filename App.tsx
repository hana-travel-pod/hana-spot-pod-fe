import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Badge,
  Button,
  Chips,
  Icon,
  IconName,
  PodCard,
} from "./src/components/UI";
import {
  Application,
  defaultProfile,
  emptyFilters,
  Filters as FilterType,
  matches,
  Pod,
  Profile as ProfileType,
  confirmJoin,
  approvePendingApplications,
  validDate,
} from "./src/domain";
import { categories, makeSeeds } from "./src/data";
import { colors, styles as s } from "./src/theme";
import { CreatePod } from "./src/screens/CreatePod";
import { Filters } from "./src/screens/Filters";
import { PodDetail } from "./src/screens/PodDetail";
import { Profile } from "./src/screens/Profile";

type Store = {
  version: 1;
  pods: Pod[];
  applications: Application[];
  saved: string[];
  profile: ProfileType;
};
const STORAGE_KEY = "hana-spot-pod:v1";
const initialStore = (): Store => ({
  version: 1,
  pods: makeSeeds(),
  applications: [],
  saved: [],
  profile: defaultProfile,
});
function isStore(value: unknown): value is Store {
  if (!value || typeof value !== "object") return false;
  const v = value as Store;
  return (
    v.version === 1 &&
    Array.isArray(v.pods) &&
    v.pods.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.title === "string" &&
        typeof p.country === "string" &&
        typeof p.destination === "string" &&
        typeof p.category === "string" &&
        typeof p.host === "string" &&
        typeof p.image === "string" &&
        typeof p.description === "string" &&
        (p.startDate === "" || validDate(p.startDate)) &&
        (p.endDate === "" || validDate(p.endDate)) &&
        Number.isInteger(p.members) &&
        p.members >= 1 &&
        Number.isInteger(p.capacity) &&
        p.members <= p.capacity &&
        Number.isInteger(p.budget) &&
        Number.isInteger(p.deposit) &&
        Number.isInteger(p.approval) &&
        ["없음", "안정", "균형", "공격"].includes(p.investment) &&
        ["제한 없음", "여성", "남성"].includes(p.gender) &&
        ["제한 없음", "20대", "30대", "40대", "50대 이상"].includes(p.age) &&
        typeof p.verified === "boolean",
    ) &&
    Array.isArray(v.applications) &&
    v.applications.every(
      (a) =>
        a &&
        typeof a.podId === "string" &&
        typeof a.message === "string" &&
        typeof a.createdAt === "string" &&
        ["pending", "approved"].includes(a.status),
    ) &&
    Array.isArray(v.saved) &&
    v.saved.every((id) => typeof id === "string") &&
    !!v.profile &&
    typeof v.profile.name === "string" &&
    ["여성", "남성"].includes(v.profile.gender) &&
    ["20대", "30대", "40대", "50대 이상"].includes(v.profile.age) &&
    typeof v.profile.verified === "boolean"
  );
}

export default function App() {
  const [data, setData] = useState<Store>(initialStore);
  const dataRef = useRef(data);
  const writeQueue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("explore");
  const [mineView, setMineView] = useState("전체");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [filters, setFilters] = useState<FilterType>(emptyFilters);
  const [modal, setModal] = useState<"create" | "filters" | "profile" | null>(
    null,
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (!active || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (!isStore(parsed)) throw new Error("Invalid data");
        const normalized = {
          ...parsed,
          ...approvePendingApplications(
            parsed.pods,
            parsed.applications,
            parsed.profile,
          ),
        };
        if (
          normalized.applications.some(
            (a, i) => a.status !== parsed.applications[i].status,
          )
        ) {
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          } catch {
            if (active)
              setToast("이전 신청의 자동 승인 결과를 저장하지 못했어요.");
          }
        }
        if (!active) return;
        dataRef.current = normalized;
        setData(normalized);
      })
      .catch(() => {
        if (active) setToast("저장 데이터를 읽지 못해 샘플 팟을 표시해요.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const update = (producer: (current: Store) => Store) => {
    const operation = writeQueue.current.then(async () => {
      const produced = producer(dataRef.current);
      const next = {
        ...produced,
        ...approvePendingApplications(
          produced.pods,
          produced.applications,
          produced.profile,
        ),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      dataRef.current = next;
      setData(next);
    });
    writeQueue.current = operation.catch(() => {});
    return operation;
  };
  const toggleSave = (id: string) => {
    update((d) => ({
      ...d,
      saved: d.saved.includes(id)
        ? d.saved.filter((v) => v !== id)
        : [...d.saved, id],
    })).catch(() => setToast("저장하지 못했어요. 다시 시도해주세요."));
  };
  const create = async (pod: Pod) => {
    await update((d) => ({ ...d, pods: [{ ...pod, host: "나" }, ...d.pods] }));
    setModal(null);
    setDetailId(pod.id);
    setToast("새로운 팟이 만들어졌어요. 함께할 여행자를 기다려요!");
  };
  const apply = async (message: string) => {
    await update((d) => ({
      ...d,
      ...confirmJoin(
        d.pods,
        d.applications,
        detailId || "",
        d.profile,
        message,
      ),
    }));
    setDetailId(null);
    setTab("mine");
    setMineView("가입한 팟");
    setToast("자동 승인 완료! 참가가 확정됐어요.");
  };
  const withdraw = async (id: string) => {
    try {
      await update((d) => {
        const approved =
          d.applications.find((a) => a.podId === id)?.status === "approved";
        return {
          ...d,
          applications: d.applications.filter((a) => a.podId !== id),
          pods: approved
            ? d.pods.map((p) =>
                p.id === id ? { ...p, members: Math.max(1, p.members - 1) } : p,
              )
            : d.pods,
        };
      });
      setToast("신청을 취소했어요.");
    } catch {
      setToast("취소하지 못했어요. 다시 시도해주세요.");
    }
  };
  const activeFilters = Object.entries(filters).filter(
    ([k, v]) => v !== emptyFilters[k as keyof FilterType],
  ).length;
  const visiblePods = data.pods.filter((p) =>
    matches(p, search, category, filters),
  );
  const selectedPod = data.pods.find((p) => p.id === detailId);
  const myPods = data.pods.filter(
    (p) => p.host === "나" || data.applications.some((a) => a.podId === p.id),
  );
  const joinedPods = data.applications
    .filter((a) => a.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((a) => {
      const pod = data.pods.find((p) => p.id === a.podId);
      return pod ? [pod] : [];
    });
  const displayedMyPods =
    mineView === "가입한 팟"
      ? joinedPods
      : mineView === "만든 팟"
        ? myPods.filter((p) => p.host === "나")
        : myPods;
  const savedPods = data.pods.filter((p) => data.saved.includes(p.id));
  const cards = (pods: Pod[]) =>
    pods.map((p) => (
      <PodCard
        key={p.id}
        pod={p}
        onPress={() => setDetailId(p.id)}
        saved={data.saved.includes(p.id)}
        onSave={() => toggleSave(p.id)}
      />
    ));
  const empty = (
    title: string,
    description: string,
    action?: () => void,
    actionLabel = "팟 둘러보기",
  ) => (
    <View style={{ alignItems: "center", paddingVertical: 50, gap: 12 }}>
      <View
        style={{ backgroundColor: colors.mint, padding: 20, borderRadius: 40 }}
      >
        <Icon name="compass-outline" color={colors.green} size={32} />
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={[s.muted, { textAlign: "center" }]}>{description}</Text>
      {action && <Button title={actionLabel} secondary onPress={action} />}
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <View style={s.shell}>
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 18,
              paddingBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="팟 탐색 홈"
              onPress={() => setTab("explore")}
              style={[s.row, { gap: 8 }]}
            >
              <View
                style={{
                  width: 27,
                  height: 27,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 3,
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: i === 3 ? 3 : 6,
                      backgroundColor: i === 3 ? "#9AE0CC" : colors.green,
                    }}
                  />
                ))}
              </View>
              <Text
                style={{
                  color: colors.dark,
                  fontSize: 21,
                  letterSpacing: -0.8,
                  fontWeight: "800",
                }}
              >
                hana <Text style={{ fontWeight: "400" }}>spot pod</Text>
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="내 프로필 설정"
              onPress={() => setModal("profile")}
              style={{
                padding: 9,
                borderRadius: 20,
                backgroundColor: colors.bg,
              }}
            >
              <Icon name="person-outline" size={19} />
            </Pressable>
          </View>
          {!ready ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator color={colors.green} />
              <Text style={[s.muted, { marginTop: 12 }]}>
                여행 팟을 불러오고 있어요
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.page}
            >
              {tab === "explore" && (
                <>
                  <View style={{ marginTop: 8, marginBottom: 24 }}>
                    <Text
                      style={[
                        s.muted,
                        { color: colors.green, marginBottom: 8 },
                      ]}
                    >
                      함께 떠나면, 더 넓어지는 여행
                    </Text>
                    <Text
                      style={{
                        color: colors.dark,
                        fontSize: 30,
                        fontWeight: "800",
                        letterSpacing: -1.3,
                        lineHeight: 40,
                      }}
                    >
                      좋은 여행은,{"\n"}좋은 동행에서.
                    </Text>
                  </View>
                  <LinearGradient
                    colors={["#E4F6EE", "#EDF7DF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 24,
                      padding: 21,
                      minHeight: 164,
                      overflow: "hidden",
                    }}
                  >
                    <View style={{ zIndex: 2, width: "68%" }}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          letterSpacing: 1.7,
                          color: colors.green,
                        }}
                      >
                        LET’S TRAVEL TOGETHER
                      </Text>
                      <Text
                        style={{
                          fontSize: 20,
                          lineHeight: 29,
                          fontWeight: "700",
                          letterSpacing: -0.7,
                          color: colors.dark,
                          marginTop: 11,
                        }}
                      >
                        취향도, 예산도{"\n"}우리답게 맞춰요
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setModal("create")}
                        style={[s.row, { marginTop: 14, gap: 5 }]}
                      >
                        <Text
                          style={{
                            color: colors.green,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          나만의 팟 만들기
                        </Text>
                        <Icon
                          name="arrow-forward"
                          size={15}
                          color={colors.green}
                        />
                      </Pressable>
                    </View>
                    <View
                      style={{
                        position: "absolute",
                        right: -13,
                        bottom: -30,
                        width: 150,
                        height: 150,
                        backgroundColor: "#D1EBC2",
                        borderRadius: 80,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        right: 23,
                        top: 22,
                        width: 44,
                        height: 44,
                        backgroundColor: "#FFD680",
                        borderRadius: 25,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        right: 12,
                        bottom: 20,
                        transform: [{ rotate: "-18deg" }],
                      }}
                    >
                      <Icon name="airplane" size={96} color={colors.green} />
                    </View>
                    <View
                      style={{ position: "absolute", right: 105, bottom: 30 }}
                    >
                      <Icon name="sparkles" size={20} color="#70B694" />
                    </View>
                  </LinearGradient>
                  <View
                    style={[
                      s.row,
                      {
                        backgroundColor: colors.bg,
                        borderRadius: 15,
                        marginTop: 22,
                        marginBottom: 18,
                        paddingHorizontal: 14,
                        gap: 9,
                      },
                    ]}
                  >
                    <Icon
                      name="search-outline"
                      size={20}
                      color={colors.muted}
                    />
                    <TextInput
                      accessibilityLabel="목적지 또는 팟 이름 검색"
                      placeholder="어디로 떠나고 싶으세요?"
                      placeholderTextColor="#9BA5A7"
                      value={search}
                      onChangeText={setSearch}
                      returnKeyType="search"
                      style={{
                        flex: 1,
                        minHeight: 50,
                        fontSize: 14,
                        color: colors.text,
                        ...Platform.select({
                          web: { outlineStyle: "none" as never },
                        }),
                      }}
                    />
                    {!!search && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="검색어 지우기"
                        onPress={() => setSearch("")}
                        hitSlop={10}
                      >
                        <Icon
                          name="close-circle"
                          size={18}
                          color={colors.muted}
                        />
                      </Pressable>
                    )}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -24 }}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
                  >
                    {categories.map((c) => (
                      <Pressable
                        key={c}
                        accessibilityRole="button"
                        accessibilityState={{ selected: category === c }}
                        onPress={() => setCategory(c)}
                        style={[
                          s.chip,
                          { paddingHorizontal: 19 },
                          category === c && s.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            s.chipText,
                            category === c && s.chipTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <View
                    style={[s.between, { marginTop: 27, marginBottom: 16 }]}
                  >
                    <View style={[s.row, { gap: 7 }]}>
                      <Text style={[s.title, { fontSize: 19 }]}>
                        지금, 함께 떠날 팟
                      </Text>
                      <Text style={{ color: colors.green, fontWeight: "700" }}>
                        {visiblePods.length}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="탐색 조건 필터"
                      onPress={() => setModal("filters")}
                      style={[s.row, { gap: 5, padding: 6 }]}
                    >
                      <Icon
                        name="options-outline"
                        size={18}
                        color={activeFilters ? colors.green : colors.muted}
                      />
                      <Text
                        style={{
                          color: activeFilters ? colors.green : colors.muted,
                          fontSize: 12,
                        }}
                      >
                        필터{activeFilters ? ` ${activeFilters}` : ""}
                      </Text>
                    </Pressable>
                  </View>
                  {activeFilters > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setFilters(emptyFilters)}
                      style={{ alignSelf: "flex-start", marginBottom: 13 }}
                    >
                      <Text style={{ color: colors.green, fontSize: 12 }}>
                        적용한 조건 초기화 ×
                      </Text>
                    </Pressable>
                  )}
                  {visiblePods.length
                    ? cards(visiblePods)
                    : empty(
                        "조건에 맞는 팟이 아직 없어요",
                        "다른 여행 지역이나 예산으로 찾아보세요.",
                        () => {
                          setSearch("");
                          setCategory("전체");
                          setFilters(emptyFilters);
                        },
                        "탐색 조건 초기화",
                      )}
                  <View style={[s.row, { gap: 8, paddingTop: 4 }]}>
                    <Icon
                      name="information-circle-outline"
                      color={colors.muted}
                      size={16}
                    />
                    <Text style={[s.muted, { flex: 1, fontSize: 11 }]}>
                      기본 경비는 1인 기준이며 투자금과 예치금은 제외돼요.
                    </Text>
                  </View>
                </>
              )}
              {tab === "mine" && (
                <>
                  <Text style={[s.heading, { marginTop: 12 }]}>
                    나의 여행 팟
                  </Text>
                  <Text style={[s.muted, { marginTop: 8, marginBottom: 25 }]}>
                    작은 신청에서 시작된, 우리의 다음 여행
                  </Text>
                  <Button
                    title="새로운 팟 만들기"
                    icon="add"
                    onPress={() => setModal("create")}
                  />
                  <View style={{ marginVertical: 24 }}>
                    <Chips
                      values={["전체", "가입한 팟", "만든 팟"]}
                      selected={mineView}
                      onChange={setMineView}
                    />
                  </View>
                  {displayedMyPods.length
                    ? displayedMyPods.map((p) => {
                        const app = data.applications.find(
                          (a) => a.podId === p.id,
                        );
                        return (
                          <View key={p.id} style={{ marginBottom: 20 }}>
                            <PodCard
                              pod={p}
                              status={
                                p.host === "나"
                                  ? "내가 만든 팟"
                                  : app?.status === "approved"
                                    ? "가입 완료"
                                    : "이전 신청"
                              }
                              onPress={() => setDetailId(p.id)}
                            />
                            {app?.status === "pending" && (
                              <View
                                style={{
                                  backgroundColor: colors.bg,
                                  padding: 16,
                                  borderRadius: 16,
                                  marginTop: -8,
                                }}
                              >
                                <Text style={s.label}>
                                  이전 신청의 참가 조건을 확인해주세요
                                </Text>
                                <Text style={s.muted}>
                                  신청 메시지: {app.message || "없음"}
                                </Text>
                                <Text
                                  style={[
                                    s.muted,
                                    { fontSize: 11, marginVertical: 10 },
                                  ]}
                                >
                                  참가 조건 불일치, 정원 초과 또는 모집 종료로
                                  자동 가입되지 않았어요. 프로필 조건이 맞으면
                                  자동 처리돼요.
                                </Text>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => withdraw(p.id)}
                                  style={{ padding: 12, alignItems: "center" }}
                                >
                                  <Text style={s.muted}>신청 취소</Text>
                                </Pressable>
                              </View>
                            )}
                            {app?.status === "approved" && (
                              <View style={[s.row, { gap: 7 }]}>
                                <Icon
                                  name="checkmark-circle"
                                  color={colors.green}
                                  size={17}
                                />
                                <Text
                                  style={{ color: colors.green, fontSize: 13 }}
                                >
                                  함께할 멤버가 되었어요
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })
                    : empty(
                        mineView === "가입한 팟"
                          ? "가입한 팟이 아직 없어요"
                          : mineView === "만든 팟"
                            ? "만든 팟이 아직 없어요"
                            : "첫 여행 팟을 만나보세요",
                        "팟에 참가하거나 직접 팟을 만들어보세요.",
                        () => setTab("explore"),
                      )}
                </>
              )}
              {tab === "saved" && (
                <>
                  <Text style={[s.heading, { marginTop: 12 }]}>
                    마음에 담은 팟
                  </Text>
                  <Text style={[s.muted, { marginTop: 8, marginBottom: 25 }]}>
                    언젠가 함께 떠나고 싶은 여행 {savedPods.length}개
                  </Text>
                  {savedPods.length
                    ? cards(savedPods)
                    : empty(
                        "마음에 드는 팟을 저장해요",
                        "팟 카드의 북마크를 누르면 여기에 모여요.",
                        () => setTab("explore"),
                      )}
                </>
              )}
              {tab === "profile" && (
                <>
                  <View style={{ paddingVertical: 28, alignItems: "center" }}>
                    <View
                      style={{
                        padding: 23,
                        borderRadius: 45,
                        backgroundColor: colors.mint,
                      }}
                    >
                      <Icon
                        name="person-outline"
                        size={35}
                        color={colors.green}
                      />
                    </View>
                    <Text style={[s.heading, { marginTop: 16 }]}>
                      {data.profile.name}님
                    </Text>
                    <Text style={[s.muted, { marginTop: 8 }]}>
                      {data.profile.gender} · {data.profile.age} ·{" "}
                      {data.profile.verified ? "데모 인증 완료" : "미인증"}
                    </Text>
                  </View>
                  <Button
                    title="여행 프로필 수정"
                    secondary
                    onPress={() => setModal("profile")}
                  />
                  <View
                    style={[
                      s.between,
                      {
                        backgroundColor: colors.bg,
                        borderRadius: 20,
                        padding: 25,
                        marginTop: 25,
                      },
                    ]}
                  >
                    {[
                      {
                        title: "만든 팟",
                        count: data.pods.filter((p) => p.host === "나").length,
                      },
                      {
                        title: "가입한 팟",
                        count: joinedPods.length,
                      },
                      { title: "저장한 팟", count: data.saved.length },
                    ].map((item) => (
                      <Pressable
                        key={item.title}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.title} 목록 보기`}
                        onPress={() => {
                          if (item.title === "저장한 팟") setTab("saved");
                          else {
                            setTab("mine");
                            setMineView(
                              item.title === "만든 팟"
                                ? "만든 팟"
                                : "가입한 팟",
                            );
                          }
                        }}
                        style={{ alignItems: "center", gap: 8 }}
                      >
                        <Text
                          style={{
                            color: colors.green,
                            fontSize: 25,
                            fontWeight: "800",
                          }}
                        >
                          {item.count}
                        </Text>
                        <Text style={s.muted}>{item.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text
                    style={[s.muted, { textAlign: "center", marginTop: 10 }]}
                  >
                    숫자를 누르면 해당 팟 목록을 볼 수 있어요.
                  </Text>
                  <View style={s.notice}>
                    <Text style={s.label}>hana spot pod · 프로토타입</Text>
                    <Text style={s.muted}>
                      여행 조건을 맞추고, 함께할 사람을 찾는 새로운 시작.
                      데이터는 현재 기기에 저장되며 다른 사용자와 공유되지
                      않아요.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          )}
          {ready && tab === "explore" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="새로운 팟 만들기"
              onPress={() => setModal("create")}
              style={{
                position: "absolute",
                right: 22,
                bottom: 87,
                width: 54,
                height: 54,
                backgroundColor: colors.green,
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.dark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.22,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Icon name="add" size={28} color="#fff" />
            </Pressable>
          )}
          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: colors.line,
              paddingTop: 12,
              paddingBottom: 10,
              backgroundColor: "#fff",
            }}
          >
            {(
              [
                {
                  id: "explore",
                  title: "팟 탐색",
                  icon: "compass-outline",
                  active: "compass",
                },
                {
                  id: "mine",
                  title: "내 팟",
                  icon: "people-outline",
                  active: "people",
                },
                {
                  id: "saved",
                  title: "저장",
                  icon: "bookmark-outline",
                  active: "bookmark",
                },
                {
                  id: "profile",
                  title: "내 정보",
                  icon: "person-outline",
                  active: "person",
                },
              ] as {
                id: string;
                title: string;
                icon: IconName;
                active: IconName;
              }[]
            ).map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === item.id }}
                onPress={() => setTab(item.id)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 5,
                  paddingVertical: 2,
                }}
              >
                <Icon
                  name={tab === item.id ? item.active : item.icon}
                  color={tab === item.id ? colors.green : "#A1AAAC"}
                  size={23}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: tab === item.id ? "700" : "400",
                    color: tab === item.id ? colors.green : colors.muted,
                  }}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
          {!!toast && (
            <Pressable
              accessibilityRole="alert"
              accessibilityLabel={toast}
              onPress={() => setToast("")}
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 86,
                backgroundColor: colors.dark,
                borderRadius: 14,
                padding: 16,
                zIndex: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 13, lineHeight: 21 }}>
                {toast}
              </Text>
            </Pressable>
          )}
          {modal === "create" && (
            <CreatePod onClose={() => setModal(null)} onCreate={create} />
          )}
          {modal === "filters" && (
            <Filters
              initial={filters}
              onClose={() => setModal(null)}
              onApply={(v) => {
                setFilters(v);
                setModal(null);
              }}
            />
          )}
          {modal === "profile" && (
            <Profile
              initial={data.profile}
              onClose={() => setModal(null)}
              onSave={async (p) => {
                await update((d) => ({ ...d, profile: p }));
                setModal(null);
                setToast("여행 프로필을 저장했어요.");
              }}
            />
          )}
          {selectedPod && (
            <PodDetail
              pod={selectedPod}
              profile={data.profile}
              application={data.applications.find(
                (a) => a.podId === selectedPod.id,
              )}
              onClose={() => setDetailId(null)}
              onViewMine={() => {
                setDetailId(null);
                setTab("mine");
                setMineView(
                  data.applications.find((a) => a.podId === selectedPod.id)
                    ?.status === "approved"
                    ? "가입한 팟"
                    : "전체",
                );
              }}
              onApply={apply}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
