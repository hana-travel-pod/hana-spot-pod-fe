import { AppText as Text } from "./src/components/Typography";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Platform,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
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
import { normalizePodDestination } from "./src/destinations";
import { makeSeeds, DEMO_REVISION, refreshDemoData } from "./src/data";
import { colors, styles as s } from "./src/theme";
import { imageAssets, prefetchAppImages } from "./src/components/PodImage";
import { DemoResetIcon } from "./src/components/DemoResetIcon";
import { CreatePod } from "./src/screens/CreatePod";
import { Filters } from "./src/screens/Filters";
import { PodDetail } from "./src/screens/PodDetail";
import { Profile } from "./src/screens/Profile";

type Store = {
  version: 1;
  demoRevision?: number;
  pods: Pod[];
  applications: Application[];
  saved: string[];
  profile: ProfileType;
};
const STORAGE_KEY = "hana-spot-pod:v1";
const initialStore = (): Store => ({
  version: 1,
  demoRevision: DEMO_REVISION,
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
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 400 || fontScale > 1.15;
  const [fontsLoaded, fontError] = useFonts({
    "Hana2-Regular": require("./assets/fonts/Hana2-Regular.otf"),
    "Hana2-Medium": require("./assets/fonts/Hana2-Medium.otf"),
    "Hana2-Bold": require("./assets/fonts/Hana2-Bold.otf"),
  });
  const [data, setData] = useState<Store>(initialStore);
  const dataRef = useRef(data);
  const writeQueue = useRef(Promise.resolve());
  const resetPending = useRef(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("explore");
  const [mineView, setMineView] = useState("전체");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterType>(emptyFilters);
  const [modal, setModal] = useState<"create" | "filters" | "profile" | null>(
    null,
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    void prefetchAppImages();
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (!active || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (!isStore(parsed)) throw new Error("Invalid data");
        const refreshed = refreshDemoData(parsed);
        const restoredPods = refreshed.pods.map(normalizePodDestination);
        const profile =
          refreshed.profile.name === "여행자"
            ? { ...refreshed.profile, name: defaultProfile.name }
            : refreshed.profile;
        const normalized = {
          ...refreshed,
          profile,
          ...approvePendingApplications(
            restoredPods,
            refreshed.applications,
            profile,
          ),
        };
        if (
          parsed.demoRevision !== DEMO_REVISION ||
          profile.name !== parsed.profile.name ||
          restoredPods.some(
            (p, i) =>
              p.image !== parsed.pods[i].image ||
              JSON.stringify(p.destinationSelection) !==
                JSON.stringify(parsed.pods[i].destinationSelection),
          ) ||
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
  const resetDemo = async () => {
    if (resetPending.current || !ready) return false;
    resetPending.current = true;
    // Run after pending saves, so an older write cannot restore deleted demo data.
    const operation = writeQueue.current.then(async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      const fresh = initialStore();
      dataRef.current = fresh;
      setData(fresh);
      setSearch("");
      setFilters(emptyFilters);
      setMineView("전체");
      setModal(null);
      setDetailId(null);
      setTab("explore");
      setToast("시연 데이터를 초기화했어요.");
    });
    writeQueue.current = operation.catch(() => {});
    try {
      await operation;
      return true;
    } catch {
      setToast("초기화하지 못했어요. 다시 시도해주세요.");
      return false;
    } finally {
      resetPending.current = false;
    }
  };
  const update = (producer: (current: Store) => Store) => {
    if (resetPending.current)
      return Promise.reject(new Error("Demo reset in progress"));
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
    matches(p, search, "전체", filters),
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
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <View style={s.shell}>
          <View style={s.appHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="팟 탐색 홈"
              onPress={() => setTab("explore")}
              style={s.brand}
            >
              <Image
                source={imageAssets.logo}
                fadeDuration={0}
                accessibilityLabel="하나 트래블 팟 로고"
                style={s.brandLogo}
              />
              <Text style={[s.brandTitle, compact && { fontSize: 17 }]}>
                하나 트래블 팟
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${data.profile.name} 여행자님, 내 프로필 설정`}
              onPress={() => setModal("profile")}
              style={s.traveler}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={s.travelerName}
              >
                {data.profile.name}
              </Text>
              <Text style={s.travelerSuffix}>여행자님</Text>
            </Pressable>
          </View>
          {!ready || (!fontsLoaded && !fontError) ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator
                color={!fontsLoaded ? colors.fontSpinner : colors.green}
              />
              <Text style={[s.muted, { marginTop: 12 }]}>
                {!fontsLoaded
                  ? "글꼴을 불러오고 있어요"
                  : "여행 팟을 불러오고 있어요"}
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={s.scroll}
              contentContainerStyle={s.page}
              stickyHeaderIndices={tab === "explore" ? [1] : undefined}
            >
              {tab === "explore" && (
                <View style={{ marginTop: 8, marginBottom: 16 }}>
                  <Text
                    style={[s.muted, { color: colors.green, marginBottom: 8 }]}
                  >
                    함께 떠나면, 더 즐거운 여행
                  </Text>
                  <Text
                    style={{
                      color: colors.dark,
                      fontSize: compact ? 26 : 28,
                      fontWeight: "800",
                      letterSpacing: -1.3,
                      lineHeight: compact ? 37 : 40,
                    }}
                  >
                    좋은 여행은,{"\n"}하나 트래블 팟에서.
                  </Text>
                </View>
              )}
              {tab === "explore" && (
                <View style={s.stickySearch}>
                  <View
                    style={[
                      s.row,
                      {
                        backgroundColor: colors.white,
                        borderWidth: 1,
                        borderColor: colors.line,
                        borderRadius: 12,
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
                      placeholderTextColor={colors.muted}
                      value={search}
                      onChangeText={setSearch}
                      returnKeyType="search"
                      style={{
                        flex: 1,
                        fontFamily: "Hana2-Regular",
                        minWidth: 0,
                        minHeight: 56,
                        fontSize: 16,
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
                </View>
              )}
              {tab === "explore" && (
                <View>
                  <View
                    style={[
                      s.recommendation,
                      { minHeight: 180, overflow: "hidden" },
                    ]}
                  >
                    <View
                      style={{
                        zIndex: 2,
                        width: compact ? "68%" : "72%",
                        minWidth: 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          letterSpacing: compact ? 0.4 : 1.7,
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
                            fontSize: 13,
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
                        backgroundColor: colors.white,
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
                        backgroundColor: colors.bg,
                        borderRadius: 25,
                      }}
                    />
                    <Image
                      source={imageAssets.airplane}
                      fadeDuration={0}
                      style={{
                        position: "absolute",
                        right: -3,
                        bottom: 2,
                        width: compact ? 112 : 140,
                        height: compact ? 112 : 140,
                      }}
                      resizeMode="contain"
                    />
                    <View
                      style={{ position: "absolute", right: 105, bottom: 30 }}
                    >
                      <Icon name="sparkles" size={20} color={colors.green} />
                    </View>
                  </View>
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
                          fontSize: 13,
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
                      <Text style={{ color: colors.green, fontSize: 13 }}>
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
                    <Text style={[s.muted, { flex: 1, fontSize: 13 }]}>
                      기본 경비는 1인 기준이며 투자금과 예치금은 제외돼요.
                    </Text>
                  </View>
                </View>
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
                      selectedColors={{
                        전체: { background: colors.mint, accent: colors.green },
                        "가입한 팟": {
                          background: "#EAF2F8",
                          accent: "#356D91",
                        },
                        "만든 팟": { background: "#F2EDF7", accent: "#795A93" },
                      }}
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
                                    { fontSize: 13, marginVertical: 10 },
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
                    <DemoResetIcon
                      onReset={resetDemo}
                      testID="profile-reset-icon"
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
                    </DemoResetIcon>
                    <Text style={[s.heading, { marginTop: 16 }]}>
                      {data.profile.name}님
                    </Text>
                    <Text style={[s.muted, { marginTop: 8 }]}>
                      {data.profile.gender} / {data.profile.age} /{" "}
                      {data.profile.verified ? "데모 인증 완료" : "미인증"}
                    </Text>
                  </View>
                  <Button
                    title="여행 프로필 수정"
                    secondary
                    onPress={() => setModal("profile")}
                  />
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
                  color={tab === item.id ? colors.green : colors.muted}
                  size={23}
                />
                <Text
                  style={{
                    fontSize: 13,
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
              onReset={resetDemo}
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
