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
  type Pod,
} from "../src/domain.ts";

const pod: Pod = {
  id: "test",
  title: "교토 함께 걷기",
  country: "일본",
  destination: "교토 · KIX",
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
