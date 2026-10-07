import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultProfile,
  eligibility,
  emptyFilters,
  matches,
  validDate,
  validatePod,
  buildPod,
  emptyPodDraft,
  confirmJoin,
  approvePendingApplications,
  calendarDays,
  shiftMonth,
  selectRangeDate,
  tripDuration,
  clampApproval,
  type Pod,
} from "../src/domain.ts";

import {
  destinations,
  destinationFields,
  destinationScopesOverlap,
  findDestination,
  normalizePodDestination,
  searchDestinations,
} from "../src/destinations.ts";
import { makeSeeds, refreshDemoData, DEMO_REVISION } from "../src/data.ts";

const pod: Pod = {
  id: "test",
  title: "교토 함께 걷기",
  country: "일본",
  destination: "교토 / KIX",
  category: "일본",
  startDate: "2099-04-12",
  endDate: "2099-04-16",
  budget: 850000,
  capacity: 4,
  members: 1,
  gender: "제한 없음",
  age: "제한 없음",
  verified: true,
  investment: "안정",
  description: "골목을 함께 걷고 맛있는 식사를 즐겨요.",
  approval: 3,
  deposit: 50000,
  host: "나",
  image: "demo",
};

test("실제 날짜와 윤년을 검증한다", () => {
  assert.equal(validDate("2028-02-29"), true);
  for (const invalid of [
    "2027-02-29",
    "2027-04-31",
    "2027-13-01",
    "2027-1-01",
    "invalid",
  ])
    assert.equal(validDate(invalid), false);
});
test("정원, 기간, 경비, 예치금, 의사결정 정족수를 검증한다", () => {
  assert.equal(validatePod(pod), null);
  for (const patch of [
    { capacity: 1 },
    { capacity: 21 },
    { capacity: 2.5 },
    { budget: -1 },
    { budget: NaN },
    { deposit: -1 },
    { deposit: 900000 },
    { approval: 5 },
    { approval: 0 },
    { endDate: "2099-04-01" },
    { startDate: "2020-01-01" },
  ])
    assert.notEqual(validatePod({ ...pod, ...patch }), null);
  assert.equal(validatePod({ ...pod, deposit: 0 }), null);
  assert.equal(validatePod({ ...pod, description: "짧음" }), null);
});
test("참가 조건 불일치와 모집 종료를 차단한다", () => {
  assert.equal(eligibility(pod, defaultProfile), null);
  assert.notEqual(eligibility({ ...pod, members: 4 }, defaultProfile), null);
  assert.notEqual(
    eligibility({ ...pod, gender: "남성" }, defaultProfile),
    null,
  );
  assert.notEqual(eligibility({ ...pod, age: "30대" }, defaultProfile), null);
  assert.notEqual(
    eligibility(pod, { ...defaultProfile, verified: false }),
    null,
  );
  assert.notEqual(
    eligibility({ ...pod, startDate: "2020-01-01" }, defaultProfile),
    null,
  );
  assert.notEqual(
    eligibility(
      { ...pod, startDate: "", endDate: "2020-01-01" },
      defaultProfile,
    ),
    null,
  );
  assert.equal(
    matches(
      { ...pod, startDate: "", endDate: "2020-01-01" },
      "",
      "전체",
      emptyFilters,
    ),
    false,
  );
});
test("목적지·지역·기본 경비·투자·날짜·참여 조건 필터를 조합한다", () => {
  assert.equal(matches(pod, " KIX ", "일본", emptyFilters), true);
  assert.equal(matches(pod, "발리", "전체", emptyFilters), false);
  assert.equal(matches(pod, "", "유럽", emptyFilters), false);
  assert.equal(
    matches(pod, "", "전체", { ...emptyFilters, budget: "850000" }),
    true,
  );
  assert.equal(
    matches(pod, "", "전체", { ...emptyFilters, budget: "849999" }),
    false,
  );
  assert.equal(
    matches(pod, "", "전체", { ...emptyFilters, investment: "없음" }),
    false,
  );
  assert.equal(
    matches(pod, "", "전체", {
      ...emptyFilters,
      investment: "안정",
      gender: "여성",
      age: "20대",
      startDate: "2099-04-10",
      endDate: "2099-04-20",
    }),
    true,
  );
  assert.equal(
    matches(pod, "", "전체", { ...emptyFilters, endDate: "2099-04-15" }),
    false,
  );
  assert.equal(
    matches({ ...pod, members: 4 }, "", "전체", emptyFilters),
    false,
  );
});

test("아무 항목도 입력하지 않아도 미정 정보와 운영 기본값으로 팟을 만든다", () => {
  const created = buildPod(emptyPodDraft, "blank", "demo");
  assert.equal(validatePod(created), null);
  assert.equal(created.title, "함께 떠나는 여행");
  assert.equal(created.capacity, 4);
  assert.equal(created.approval, 3);
  assert.equal(created.budget, 0);
  assert.equal(created.deposit, 0);
  assert.equal(created.startDate, "");
  assert.equal(created.endDate, "");
  assert.equal(created.verified, false);
  assert.equal(created.gender, "제한 없음");
  assert.equal(created.age, "제한 없음");
  assert.equal(created.investment, "없음");
  assert.equal(
    eligibility(created, { ...defaultProfile, verified: false }),
    null,
  );
  assert.equal(matches(created, "", "전체", emptyFilters), true);
  assert.equal(
    matches(created, "", "전체", { ...emptyFilters, budget: "1000000" }),
    false,
  );
  assert.equal(
    matches(created, "", "전체", { ...emptyFilters, startDate: "2099-01-01" }),
    false,
  );
  assert.equal(
    matches(created, "", "전체", { ...emptyFilters, endDate: "2099-12-31" }),
    false,
  );
});

test("일부 항목만 입력할 수 있고 입력한 잘못된 값은 검증한다", () => {
  assert.equal(
    validatePod(
      buildPod(
        { ...emptyPodDraft, capacity: "2", description: "휴식" },
        "two",
        "demo",
      ),
    ),
    null,
  );
  assert.equal(
    buildPod({ ...emptyPodDraft, capacity: "2" }, "two", "demo").approval,
    2,
  );
  assert.equal(
    validatePod(
      buildPod({ ...emptyPodDraft, startDate: "2099-01-01" }, "start", "demo"),
    ),
    null,
  );
  assert.equal(
    validatePod(
      buildPod({ ...emptyPodDraft, endDate: "2099-01-01" }, "end", "demo"),
    ),
    null,
  );
  for (const invalid of [
    { budget: "abc" },
    { capacity: "0" },
    { deposit: "-1" },
    { approval: "9" },
    { startDate: "2099-02-30" },
  ]) {
    assert.notEqual(
      validatePod(
        buildPod({ ...emptyPodDraft, ...invalid }, "invalid", "demo"),
      ),
      null,
    );
  }
});

test("빈 메시지로 자동 가입하고 마지막 자리와 중복 가입을 보호한다", () => {
  const openPod = { ...pod, host: "팟장", members: 3 };
  const result = confirmJoin([openPod], [], pod.id, defaultProfile);
  assert.equal(result.pods[0].members, 4);
  assert.equal(result.applications[0].status, "approved");
  assert.equal(result.applications[0].message, "");
  assert.throws(
    () => confirmJoin(result.pods, result.applications, pod.id, defaultProfile),
    /이미 참가/,
  );
  assert.throws(
    () => confirmJoin(result.pods, [], pod.id, defaultProfile),
    /모집 인원/,
  );
  assert.throws(
    () => confirmJoin([pod], [], pod.id, defaultProfile),
    /내가 만든/,
  );
  assert.throws(
    () =>
      confirmJoin([{ ...openPod, gender: "남성" }], [], pod.id, defaultProfile),
    /성별/,
  );
});

test("저장된 이전 대기 신청을 자동 승인하되 재실행 시 인원을 중복 증가하지 않는다", () => {
  const pending = [
    {
      podId: pod.id,
      message: "",
      createdAt: "2026-01-01",
      status: "pending" as const,
    },
  ];
  const migrated = approvePendingApplications(
    [{ ...pod, host: "팟장" }],
    pending,
    defaultProfile,
  );
  assert.equal(migrated.applications[0].status, "approved");
  assert.equal(migrated.pods[0].members, 2);
  const again = approvePendingApplications(
    migrated.pods,
    migrated.applications,
    defaultProfile,
  );
  assert.equal(again.pods[0].members, 2);
  const full = approvePendingApplications(
    [{ ...pod, host: "팟장", members: 4 }],
    pending,
    defaultProfile,
  );
  assert.equal(full.applications[0].status, "pending");
  assert.equal(full.pods[0].members, 4);
});

test("달력에서 윤년 일수, 요일 정렬, 연도 경계의 월 이동을 계산한다", () => {
  const leap = calendarDays("2028-02");
  assert.equal(leap.filter(Boolean).length, 29);
  assert.equal(leap[2], "2028-02-01");
  assert.equal(leap.filter(Boolean).at(-1), "2028-02-29");
  assert.equal(calendarDays("2027-02").filter(Boolean).length, 28);
  assert.equal(calendarDays("2026-08").length, 42);
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2027-01", -1), "2026-12");
});

test("여행 범위는 출발일부터 선택하고 앞선 날짜 및 완료 후 클릭으로 다시 시작한다", () => {
  const start = selectRangeDate({ startDate: "", endDate: "" }, "2026-10-12");
  assert.deepEqual(start, { startDate: "2026-10-12", endDate: "" });
  assert.equal(tripDuration(start), null);
  const earlier = selectRangeDate(start, "2026-10-10");
  assert.deepEqual(earlier, { startDate: "2026-10-10", endDate: "" });
  const complete = selectRangeDate(start, "2026-10-18");
  assert.equal(tripDuration(complete), "6박 7일");
  assert.deepEqual(selectRangeDate(complete, "2026-11-03"), {
    startDate: "2026-11-03",
    endDate: "",
  });
  assert.equal(tripDuration(selectRangeDate(start, "2026-10-12")), "0박 1일");
  assert.deepEqual(selectRangeDate(start, "2026-02-30"), start);
});

test("여행 기간은 월·연도·윤년·일광절약시간 경계를 넘어 계산한다", () => {
  for (const [startDate, endDate, expected] of [
    ["2026-10-29", "2026-11-04", "6박 7일"],
    ["2026-12-29", "2027-01-04", "6박 7일"],
    ["2028-02-28", "2028-03-01", "2박 3일"],
    ["2026-03-07", "2026-03-09", "2박 3일"],
  ]) {
    const range = selectRangeDate({ startDate, endDate: "" }, endDate);
    assert.equal(tripDuration(range), expected);
  }
  assert.equal(
    tripDuration({ startDate: "2026-10-18", endDate: "2026-10-12" }),
    null,
  );
  assert.equal(tripDuration({ startDate: "", endDate: "2026-10-12" }), null);
});

test("목적지 고유 ID와 국가·도시·공항 연결이 일관된다", () => {
  assert.equal(
    new Set(destinations.map((d) => d.id)).size,
    destinations.length,
  );
  for (const d of destinations) {
    assert.equal(findDestination(d.countryId)?.type, "country");
    if (d.type === "airport") {
      assert.match(d.airportCode!, /^[A-Z]{3}$/);
      assert.equal(findDestination(d.cityId)?.type, "city");
      assert.ok(
        d.servedCityIds?.every((id) => findDestination(id)?.type === "city"),
      );
    }
  }
});
test("프랑스·파리·공항은 한글·영문·코드·혼합 검색으로 찾아진다", () => {
  for (const query of ["파리", "Paris", "프랑스 파리", "France Paris"]) {
    assert.ok(searchDestinations(query).some((d) => d.id === "city:FR-paris"));
    assert.ok(searchDestinations(query).some((d) => d.id === "airport:CDG"));
    assert.ok(searchDestinations(query).some((d) => d.id === "airport:ORY"));
  }
  assert.equal(searchDestinations("프랑스")[0].id, "country:FR");
  assert.equal(searchDestinations("nrt")[0].id, "airport:NRT");
  assert.equal(searchDestinations("하네다")[0].id, "airport:HND");
  assert.equal(searchDestinations("샤를드골")[0].id, "airport:CDG");
  assert.equal(searchDestinations("Cox Field")[0].id, "airport:PRX");
  assert.deepEqual(searchDestinations("존재하지않는목적지"), []);
  assert.deepEqual(searchDestinations("   "), []);
  const parisCities = searchDestinations("Paris").filter(
    (d) => d.type === "city",
  );
  assert.ok(parisCities.some((d) => d.countryId === "country:FR"));
  assert.ok(
    parisCities.some(
      (d) => d.countryId === "country:US" && d.region === "텍사스",
    ),
  );
});
test("목적지 선택 하나로 지역·국가·도시·공항 범위를 저장하고 복원한다", () => {
  for (const id of ["country:FR", "city:FR-paris", "airport:CDG"]) {
    const selected = findDestination(id)!;
    const created = buildPod(
      { ...emptyPodDraft, destinationSelection: selected },
      "selected",
      "demo",
    );
    assert.equal(created.country, "프랑스");
    assert.equal(created.category, "유럽");
    assert.equal(created.destinationSelection?.id, id);
    assert.equal(created.destinationSelection?.type, selected.type);
    assert.equal(created.destinationSelection?.countryId, selected.countryId);
    assert.equal(created.destinationSelection?.cityId, selected.cityId);
    assert.equal(
      created.destinationSelection?.airportCode,
      selected.airportCode,
    );
    const restored = normalizePodDestination(
      JSON.parse(JSON.stringify(created)),
    );
    assert.deepEqual(
      restored.destinationSelection,
      created.destinationSelection,
    );
    assert.equal(validatePod(restored), null);
  }
  assert.equal(
    destinationFields(findDestination("country:FR")).destination,
    "전체",
  );
  assert.equal(
    destinationFields(findDestination("city:FR-paris")).destination,
    "파리 / 모든 공항",
  );
  assert.match(
    destinationFields(findDestination("airport:CDG")).destination,
    /CDG/,
  );
  assert.deepEqual(destinationFields(undefined), {
    destinationSelection: undefined,
    country: "",
    destination: "",
    category: "미정",
  });
});
test("국가·모든 공항·특정 공항 필터는 범위가 겹치는 목적지만 표시한다", () => {
  const country = findDestination("country:FR")!;
  const city = findDestination("city:FR-paris")!;
  const cdg = findDestination("airport:CDG")!;
  const ory = findDestination("airport:ORY")!;
  assert.equal(destinationScopesOverlap(city, cdg), true);
  assert.equal(destinationScopesOverlap(city, ory), true);
  assert.equal(destinationScopesOverlap(country, city), true);
  assert.equal(destinationScopesOverlap(cdg, ory), false);
  assert.equal(
    destinationScopesOverlap(city, findDestination("city:US-paris-tx")!),
    false,
  );
  const created = buildPod(
    { ...emptyPodDraft, destinationSelection: cdg },
    "cdg",
    "demo",
  );
  for (const destinationId of [country.id, city.id, cdg.id])
    assert.equal(
      matches(created, "", "전체", { ...emptyFilters, destinationId }),
      true,
    );
  assert.equal(
    matches(created, "", "전체", { ...emptyFilters, destinationId: ory.id }),
    false,
  );
  const allAirports = buildPod(
    { ...emptyPodDraft, destinationSelection: city },
    "paris",
    "demo",
  );
  assert.equal(matches(allAirports, "ORY", "전체", emptyFilters), true);
  assert.equal(
    matches(allAirports, "프랑스 Paris", "전체", emptyFilters),
    true,
  );
  assert.equal(matches(allAirports, "東京", "전체", emptyFilters), false);
  const france = buildPod(
    { ...emptyPodDraft, destinationSelection: country },
    "france",
    "demo",
  );
  assert.equal(matches(france, "CDG", "전체", emptyFilters), true);
});
test("기존 팟은 표시 이름을 유지하고 인식 가능한 목적지만 연결한다", () => {
  const seeds = makeSeeds();
  const paris = seeds.find((p) => p.id === "paris")!;
  assert.equal(paris.destination, "파리 / CDG");
  assert.equal(paris.destinationSelection?.id, "airport:CDG");
  for (const query of ["프랑스", "France", "Paris", "CDG"])
    assert.equal(matches(paris, query, "전체", emptyFilters), true);
  assert.equal(
    matches(paris, "", "전체", {
      ...emptyFilters,
      destinationId: "city:FR-paris",
    }),
    true,
  );
  const legacy = { ...pod, country: "프랑스", destination: "나만의 작은 마을" };
  assert.equal(normalizePodDestination(legacy).destinationSelection, undefined);
  assert.equal(matches(legacy, "작은 마을", "전체", emptyFilters), true);
  const obsolete = normalizePodDestination({
    ...legacy,
    destinationSelection: {
      id: "obsolete:destination",
      type: "airport" as const,
    },
  });
  assert.equal(obsolete.destinationSelection, undefined);
  assert.equal(obsolete.destination, legacy.destination);
});
test("승인 바는 1명부터 전체 인원까지 정수로 제한하고 인원 감소를 반영한다", () => {
  assert.equal(clampApproval(0, 6), 1);
  assert.equal(clampApproval(10, 6), 6);
  assert.equal(clampApproval(3.6, 6), 4);
  assert.equal(clampApproval(5, 2), 2);
  assert.equal(clampApproval(NaN, 4), 3);
  assert.equal(validatePod({ ...pod, approval: 1 }), null);
  assert.equal(validatePod({ ...pod, approval: pod.capacity }), null);
});

test("더미 팟 4개의 순서와 파리 모집 일정이 요청과 일치한다", () => {
  const seeds = makeSeeds();
  assert.deepEqual(
    seeds.map((p) => p.id),
    ["osaka", "beijing", "paris", "la"],
  );
  const paris = seeds[2];
  assert.equal(paris.title, "우리의 프랑스 4박 5일");
  assert.equal(paris.capacity, 4);
  assert.equal(paris.members, 3);
  assert.equal(paris.investment, "공격");
  assert.equal(paris.startDate, "2026-11-20");
  assert.equal(paris.endDate, "2026-11-24");
  for (let day = 1; day <= 5; day++)
    assert.ok(paris.description.includes(`${day}일차`));
  for (const [query, id] of [
    ["베이징", "airport:PEK"],
    ["Beijing", "city:CN-beijing"],
    ["PKX", "airport:PKX"],
    ["LA", "city:US-los-angeles"],
    ["Los Angeles", "airport:LAX"],
  ]) {
    assert.ok(searchDestinations(query).some((d) => d.id === id));
  }
});

test("이전 데모는 한번 교체하고 이후 생성 및 가입 데이터는 보존한다", () => {
  const previous = {
    pods: [pod],
    applications: [
      {
        podId: pod.id,
        message: "hello",
        createdAt: "2026-10-07",
        status: "approved" as const,
      },
    ],
    saved: [pod.id],
    profile: { name: "나의 프로필" },
  };
  const refreshed = refreshDemoData(previous);
  assert.equal(refreshed.demoRevision, DEMO_REVISION);
  assert.equal(refreshed.pods.length, 4);
  assert.deepEqual(refreshed.applications, []);
  assert.deepEqual(refreshed.saved, []);
  assert.equal(refreshed.profile, previous.profile);
  const current = {
    ...refreshed,
    pods: [...refreshed.pods, pod],
    saved: ["paris"],
    applications: previous.applications,
  };
  const restored = refreshDemoData(current);
  assert.deepEqual(restored, current);
});

test("저장된 미국 팟의 사진만 교체하고 가입 및 저장 상태를 보존한다", () => {
  const previous = {
    demoRevision: DEMO_REVISION,
    pods: [
      {
        ...pod,
        id: "la",
        country: "미국",
        image: "https://old-photo.example/la.jpg",
      },
      pod,
    ],
    applications: [
      {
        podId: "la",
        message: "함께해요",
        createdAt: "2026-10-07",
        status: "approved" as const,
      },
    ],
    saved: ["la"],
  };
  const restored = refreshDemoData(previous);
  assert.equal(restored.pods[0].image, "asset:los-angeles");
  assert.equal(restored.pods[0].members, previous.pods[0].members);
  assert.deepEqual(restored.pods[1], pod);
  assert.deepEqual(restored.applications, previous.applications);
  assert.deepEqual(restored.saved, previous.saved);
  assert.deepEqual(refreshDemoData(restored), restored);
});
