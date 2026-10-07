const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  DEMO_CONFIG,
  DEMO_RULES,
  INITIAL_VOTES,
  LIVE_VOTE_EVENTS,
  createInitialState,
  reduceDemo,
  voteCount,
  isCandidate,
  discussionStatus,
  canSubmit,
  canConfirm,
  canRequestInvestment,
  totalInvestmentAmount,
  hasVoteChanges,
  proposerName,
} = require(process.env.HANA_DOMAIN_MODULE);
const toggle = (state, planId) =>
  reduceDemo(state, { type: "toggleSelection", planId });
const submit = (state) => reduceDemo(state, { type: "submit" });
const receive = (state, vote) =>
  reduceDemo(state, { type: "receiveVote", vote });

test("three AI ETFs and four member stocks have valid proposers", () => {
  const ai = DEMO_CONFIG.plans.filter((p) => p.source === "ai");
  const stocks = DEMO_CONFIG.plans.filter((p) => p.source === "member");
  assert.equal(ai.length, DEMO_RULES.maximumAiRecommendations);
  assert.equal(stocks.length, 4);
  assert.ok(ai.every((p) => p.assetType === "etf"));
  for (const p of stocks) {
    assert.equal(p.assetType, "stock");
    assert.ok(DEMO_CONFIG.pod.members.some((m) => m.id === p.proposedBy));
    assert.notEqual(proposerName(p), "모임원");
  }
});
test("the travel pod has four members, aggressive style and a three-person approval threshold", () => {
  assert.equal(DEMO_CONFIG.pod.name, "우리의 프랑스 4박 5일");
  assert.equal(DEMO_CONFIG.pod.members.length, 4);
  assert.equal(DEMO_CONFIG.pod.investmentStyle, "공격");
  assert.equal(DEMO_CONFIG.pod.threshold, 3);
  for (const vote of LIVE_VOTE_EVENTS) {
    assert.ok(DEMO_CONFIG.pod.members.some((member) => member.id === vote.memberId));
    assert.notEqual(vote.memberId, DEMO_CONFIG.currentMemberId);
    assert.ok(DEMO_CONFIG.plans.some((plan) => plan.id === vote.planId));
  }
});
test("initial member votes are valid and distinct; all counts fit the pod", () => {
  assert.equal(
    new Set(INITIAL_VOTES.map((v) => `${v.memberId}:${v.planId}`)).size,
    INITIAL_VOTES.length,
  );
  for (const v of INITIAL_VOTES) {
    assert.ok(DEMO_CONFIG.pod.members.some((m) => m.id === v.memberId));
    assert.ok(DEMO_CONFIG.plans.some((p) => p.id === v.planId));
    assert.notEqual(v.memberId, DEMO_CONFIG.currentMemberId);
  }
  assert.deepEqual(
    DEMO_CONFIG.plans.map((p) => voteCount(createInitialState(), p.id)),
    [3, 2, 1, 3, 2, 2, 0],
  );
});
test("one selection is required; ETF and stock selection can be changed before submission", () => {
  const initial = createInitialState();
  assert.equal(canSubmit(initial), false);
  assert.equal(submit(initial), initial);
  let state = toggle(toggle(initial, "bond"), "samsung");
  assert.deepEqual(state.selectedPlanIds, ["bond", "samsung"]);
  assert.equal(canSubmit(state), true);
  state = toggle(state, "bond");
  assert.deepEqual(state.selectedPlanIds, ["samsung"]);
  assert.equal(toggle(state, "invalid"), state);
});
test("three approvals qualify both ETF and stock; two approvals remain ineligible", () => {
  let state = receive(
    receive(createInitialState([
      { memberId: "m2", planId: "bond" },
      { memberId: "m2", planId: "skhynix" },
    ]), LIVE_VOTE_EVENTS[0]),
    LIVE_VOTE_EVENTS[1],
  );
  state = toggle(toggle(state, "bond"), "skhynix");
  assert.equal(isCandidate(state, "bond"), false);
  assert.equal(isCandidate(state, "skhynix"), false);
  state = submit(state);
  assert.equal(voteCount(state, "bond"), 3);
  assert.equal(voteCount(state, "skhynix"), 3);
  assert.equal(isCandidate(state, "bond"), true);
  assert.equal(isCandidate(state, "skhynix"), true);
});
test("all three discussion statuses are derived from votes", () => {
  const state = createInitialState();
  assert.equal(discussionStatus(state, "sp500"), "confirmed");
  assert.equal(discussionStatus(state, "samsung"), "confirmed");
  assert.equal(discussionStatus(state, "bond"), "discussing");
  assert.equal(discussionStatus(state, "naver"), "discussing");
  assert.equal(discussionStatus(state, "dividend"), "low");
  assert.equal(discussionStatus(state, "hyundai"), "low");
});
test("repeated submission is idempotent and revised votes replace only the current member votes", () => {
  const original = submit(toggle(createInitialState(), "skhynix"));
  assert.equal(submit(original), original);
  let revised = toggle(toggle(original, "skhynix"), "bond");
  assert.equal(hasVoteChanges(revised), true);
  assert.equal(voteCount(revised, "skhynix"), 3);
  revised = submit(revised);
  assert.equal(voteCount(revised, "skhynix"), 2);
  assert.equal(voteCount(revised, "bond"), 3);
  assert.deepEqual(revised.votes.filter((v) => v.memberId !== "m1"), INITIAL_VOTES);
  assert.equal(hasVoteChanges(revised), false);
  assert.equal(submit(revised), revised);
});
test("revision removes a candidate that falls below three approvals from confirmation targets", () => {
  let state = submit(toggle(createInitialState(), "bond"));
  state = reduceDemo(state, { type: "toggleConfirmation", planId: "bond" });
  assert.equal(canConfirm(state), true);
  state = toggle(toggle(state, "bond"), "samsung");
  assert.equal(canConfirm(state), false);
  state = submit(state);
  assert.equal(voteCount(state, "bond"), 2);
  assert.equal(isCandidate(state, "bond"), false);
  assert.deepEqual(state.confirmationPlanIds, []);
  assert.equal(canConfirm(state), false);
});
test("existing member vote cannot be duplicated", () => {
  const initial = createInitialState([
    ...INITIAL_VOTES,
    { memberId: "m1", planId: "bond" },
  ]);
  const state = submit(toggle(initial, "bond"));
  assert.equal(voteCount(state, "bond"), 3);
  assert.equal(state.votes.length, initial.votes.length);
});
test("no candidate configuration below the threshold remains ineligible", () => {
  const votes = ["m2"].map((memberId) => ({ memberId, planId: "bond" }));
  const state = submit(toggle(createInitialState(votes), "bond"));
  assert.equal(voteCount(state, "bond"), 2);
  assert.ok(DEMO_CONFIG.plans.every((p) => !isCandidate(state, p.id)));
  assert.equal(canConfirm(state), false);
  assert.equal(
    reduceDemo(state, { type: "toggleConfirmation", planId: "bond" }),
    state,
  );
});
test("representative can confirm mixed asset candidates and change selection", () => {
  let state = submit(toggle(toggle(createInitialState(), "sp500"), "samsung"));
  assert.equal(canConfirm(state), false);
  state = reduceDemo(state, { type: "toggleConfirmation", planId: "sp500" });
  state = reduceDemo(state, { type: "toggleConfirmation", planId: "samsung" });
  assert.equal(canConfirm(state), true);
  assert.deepEqual(state.confirmationPlanIds, ["sp500", "samsung"]);
  state = reduceDemo(state, { type: "toggleConfirmation", planId: "sp500" });
  assert.deepEqual(state.confirmationPlanIds, ["samsung"]);
});
test("ordinary member can vote but cannot confirm", () => {
  const config = { ...DEMO_CONFIG, currentMemberId: "m4" };
  let state = reduceDemo(
    createInitialState(),
    { type: "toggleSelection", planId: "sp500" },
    config,
  );
  state = reduceDemo(state, { type: "submit" }, config);
  assert.equal(voteCount(state, "sp500", config), 3);
  assert.equal(
    reduceDemo(state, { type: "toggleConfirmation", planId: "sp500" }, config),
    state,
  );
  assert.equal(
    canConfirm({ ...state, confirmationPlanIds: ["sp500"] }, config),
    false,
  );
});
test("live third approval confirms a candidate without submitting the current member selection", () => {
  const state = toggle(createInitialState(), "samsung");
  const next = receive(state, LIVE_VOTE_EVENTS[0]);
  assert.equal(voteCount(next, "bond"), 3);
  assert.equal(discussionStatus(next, "bond"), "confirmed");
  assert.deepEqual(next.selectedPlanIds, ["samsung"]);
  assert.equal(next.submitted, false);
  assert.deepEqual(next.latestVote, LIVE_VOTE_EVENTS[0]);
});
test("duplicate live vote is ignored; unknown member, plan and current member are rejected", () => {
  const state = receive(createInitialState(), LIVE_VOTE_EVENTS[0]);
  assert.equal(receive(state, LIVE_VOTE_EVENTS[0]), state);
  assert.equal(receive(state, { memberId: "unknown", planId: "bond" }), state);
  assert.equal(receive(state, { memberId: "m2", planId: "unknown" }), state);
  assert.equal(receive(state, { memberId: "m1", planId: "bond" }), state);
});
test("live votes continue after submission and remain consistent for all candidates", () => {
  let state = submit(toggle(createInitialState(), "hyundai"));
  for (const vote of LIVE_VOTE_EVENTS) state = receive(state, vote);
  assert.equal(voteCount(state, "bond"), 3);
  assert.equal(voteCount(state, "skhynix"), 3);
  assert.equal(voteCount(state, "naver"), 2);
  assert.equal(state.submitted, true);
  assert.deepEqual(state.selectedPlanIds, ["hyundai"]);
  for (const p of DEMO_CONFIG.plans)
    assert.ok(voteCount(state, p.id) <= DEMO_CONFIG.pod.members.length);
});
test("counts ignore duplicate and unknown member votes", () => {
  const state = createInitialState([
    ...INITIAL_VOTES,
    INITIAL_VOTES[0],
    { memberId: "outsider", planId: "bond" },
  ]);
  assert.equal(voteCount(state, "bond"), 2);
});

test("live demo has two AI and two member candidates, two discussing and one low", () => {
  let state = createInitialState();
  for (const vote of LIVE_VOTE_EVENTS) state = receive(state, vote);
  const candidates = DEMO_CONFIG.plans.filter((p) => isCandidate(state, p.id));
  assert.equal(candidates.filter((p) => p.source === "ai").length, 2);
  assert.equal(candidates.filter((p) => p.source === "member").length, 2);
  assert.equal(
    DEMO_CONFIG.plans.filter(
      (p) => discussionStatus(state, p.id) === "discussing",
    ).length,
    2,
  );
  assert.equal(
    DEMO_CONFIG.plans.filter((p) => discussionStatus(state, p.id) === "low")
      .length,
    1,
  );
});

function confirmedPair() {
  let state = submit(toggle(createInitialState(), "sp500"));
  state = reduceDemo(state, { type: "toggleConfirmation", planId: "sp500" });
  return reduceDemo(state, { type: "toggleConfirmation", planId: "samsung" });
}
test("each selected candidate needs its own positive amount; request total equals only selected amounts", () => {
  let state = confirmedPair();
  assert.equal(canRequestInvestment(state), false);
  state = reduceDemo(state, { type: "setInvestmentAmount", planId: "sp500", amount: 150000 });
  assert.equal(canRequestInvestment(state), false);
  state = reduceDemo(state, { type: "setInvestmentAmount", planId: "samsung", amount: 250000 });
  assert.equal(canRequestInvestment(state), true);
  assert.equal(totalInvestmentAmount(state), 400000);
  state = reduceDemo(state, { type: "setInvestmentAmount", planId: "samsung", amount: 75000 });
  assert.equal(totalInvestmentAmount(state), 225000);
  state = reduceDemo(state, { type: "toggleConfirmation", planId: "samsung" });
  assert.equal(totalInvestmentAmount(state), 150000);
  assert.equal(canRequestInvestment(state), true);
  state = reduceDemo(state, { type: "toggleConfirmation", planId: "samsung" });
  assert.equal(state.investmentAmounts.samsung, 75000);
  assert.equal(totalInvestmentAmount(state), 225000);
});
test("amount entry rejects negative, decimal, nonfinite, unknown and unselected inputs", () => {
  const state = confirmedPair();
  for (const amount of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(reduceDemo(state, { type: "setInvestmentAmount", planId: "sp500", amount }), state);
  }
  for (const planId of ["unknown", "bond"]) {
    assert.equal(reduceDemo(state, { type: "setInvestmentAmount", planId, amount: 10000 }), state);
  }
  const cleared = reduceDemo(state, { type: "setInvestmentAmount", planId: "sp500", amount: 0 });
  assert.equal(canRequestInvestment(cleared), false);
});
test("ordinary members cannot set an investment amount or request investment", () => {
  const state = confirmedPair();
  const config = { ...DEMO_CONFIG, currentMemberId: "m4" };
  assert.equal(reduceDemo(state, { type: "setInvestmentAmount", planId: "sp500", amount: 10000 }, config), state);
  assert.equal(canRequestInvestment(state, config), false);
});


test("reset restores votes, selections, confirmation, amounts and submission state", () => {
  let state = confirmedPair();
  state = reduceDemo(state, { type: "setInvestmentAmount", planId: "sp500", amount: 150000 });
  state = receive(state, LIVE_VOTE_EVENTS[0]);
  assert.ok(state.submitted);
  assert.equal(state.investmentAmounts.sp500, 150000);
  assert.ok(state.latestVote);
  const reset = reduceDemo(state, { type: "reset" });
  assert.deepEqual(reset, createInitialState());
  assert.deepEqual(reduceDemo(reset, { type: "reset" }), reset);
  assert.notEqual(reset.votes[0], INITIAL_VOTES[0]);
});

const { clearDemoStorage } = require(process.env.HANA_STORAGE_MODULE);
test("demo reset removes only service keys and supports empty storage", async () => {
  const entries = new Map([
    ["hana-spot-pod:v1", "join-demo"],
    ["hana-spot-pod:investment", "investment-demo"],
    ["other-app:v1", "keep"],
    ["hana-spot-pod-other", "keep"],
  ]);
  let removals = 0;
  const storage = {
    getAllKeys: async () => [...entries.keys()],
    multiRemove: async (keys) => { removals++; keys.forEach((key) => entries.delete(key)); },
  };
  await clearDemoStorage(storage);
  assert.deepEqual([...entries.keys()], ["other-app:v1", "hana-spot-pod-other"]);
  await clearDemoStorage(storage);
  assert.equal(removals, 1);
});
test("storage read or deletion failure rejects instead of reporting successful reset", async () => {
  let removed = false;
  await assert.rejects(clearDemoStorage({
    getAllKeys: async () => { throw new Error("read failed"); },
    multiRemove: async () => { removed = true; },
  }), /read failed/);
  assert.equal(removed, false);
  await assert.rejects(clearDemoStorage({
    getAllKeys: async () => ["hana-spot-pod:v1"],
    multiRemove: async () => { throw new Error("delete failed"); },
  }), /delete failed/);
});
