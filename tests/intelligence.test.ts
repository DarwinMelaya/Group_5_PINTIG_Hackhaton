import { describe, it, expect } from "vitest";
import {
  congestion,
  classify,
  sentimentSummary,
  recommend,
  rankFeed,
  answerRini,
  feedbackCategory,
  type Preferences,
} from "../src/lib/intelligence";
import { seedListings, seedPosts } from "../src/data";
import { marinduqueDestinations } from "../src/data/marinduqueDestinations";
import scenarios from "../src/data/ferry_scenarios.json";
const pref: Preferences = {
  days: 2,
  municipality: "Boac",
  interests: ["beach", "heritage"],
  budget: 1500,
  activity: "",
  saved: [],
  date: "",
};
describe("transparent capacity model", () => {
  it("calculates all three scenarios", () => {
    expect(scenarios.map((s) => congestion(s).category)).toEqual([
      "LOW",
      "HIGH",
      "HIGH",
    ]);
    expect(congestion(scenarios[1]).modeledDemand).toBe(232);
  });
  it.each([
    [69.99, "LOW"],
    [70, "MODERATE"],
    [100, "MODERATE"],
    [100.01, "HIGH"],
  ])("threshold %s is %s", (d, c) => {
    expect(
      congestion({
        baselineDemand: +d,
        seasonalMultiplier: 1,
        extraVisitors: 0,
        assumedCapacity: 100,
        availableServiceFraction: 1,
      }).category,
    ).toBe(c);
  });
  it("handles zero capacity without dividing by zero", () =>
    expect(
      congestion({ ...scenarios[0], availableServiceFraction: 0 })
        .utilizationPercent,
    ).toBe(8000));
  it.each([NaN, Infinity, -1])("rejects invalid inputs %s", (n) =>
    expect(() => congestion({ ...scenarios[0], baselineDemand: n })).toThrow(),
  );
  it("rejects service fractions above 1", () =>
    expect(() =>
      congestion({ ...scenarios[0], availableServiceFraction: 1.1 }),
    ).toThrow());
});
describe("Filipino-English approximate sentiment", () => {
  it.each([
    ["Maganda at malinis", "Positive"],
    ["dirty and mahal", "Negative"],
    ["beautiful but marumi", "Mixed"],
    ["not clean", "Negative"],
    ["hindi marumi", "Positive"],
    ["A visit on Monday", "Neutral"],
  ])("%s → %s", (input, output) => expect(classify(input)).toBe(output));
  it("never derives public sentiment from private feedback or fictional posts", () => {
    const posts = seedPosts.map((p) => ({
      ...p,
      post_type: "feedback" as const,
      body: "dirty",
    }));
    expect(sentimentSummary(posts).total).toBe(0);
    expect(sentimentSummary([]).label).toBe("Insufficient data");
  });
  it("proposes relevant feedback categories", () =>
    expect(feedbackCategory("The toilet is broken")).toBe("Facilities"));
});
describe("itinerary and feed ranking", () => {
  const verified = seedListings
    .filter((l) => l.listing_type === "destination")
    .map((l) => ({ ...l, metadata: { ...l.metadata, verified: true } }));
  it("produces at least three explainable eligible destinations", () => {
    const r = recommend(verified, pref, scenarios[0]);
    expect(r.length).toBeGreaterThanOrEqual(3);
    expect(r.every((x) => x.score >= 0 && x.score <= 1 && !!x.reason)).toBe(
      true,
    );
  });
  it("generates from the source-reviewed Marinduque destination set", () => {
    const result = recommend(marinduqueDestinations, pref, scenarios[0]);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.map((item) => item.listing.name)).toContain("Poctoy White Beach");
    expect(result.every((item) => item.listing.source_url?.includes("marinduque.gov.ph"))).toBe(true);
  });
  it("excludes unverified and private-promotion destinations", () => {
    expect(recommend(seedListings, pref, scenarios[0])).toHaveLength(0);
    expect(
      recommend(
        verified.map((l) => ({
          ...l,
          metadata: { ...l.metadata, public_promotion: false },
        })),
        pref,
        scenarios[0],
      ),
    ).toHaveLength(0);
  });
  it("matches exact prescribed weights and treats unknown fees cautiously", () => {
    const one = verified[0];
    const result = recommend([one], pref, scenarios[0])[0];
    const load = congestion({
      ...scenarios[0],
      baselineDemand: one.metadata.baseline,
      assumedCapacity: one.metadata.capacity,
    });
    const expected =
      0.35 * 0.5 +
      0.2 * 0.35 +
      0.15 * 1 +
      0.15 * (1 - load.utilizationPercent / 200) +
      0.1 * 1 +
      0.05 * 0.7;
    expect(result.score).toBeCloseTo(expected);
    expect(result.reason).toContain("fee unverified");
  });
  it("prioritizes selected eligible saved destinations deterministically", () => {
    const selected = verified[5];
    expect(
      recommend(verified, { ...pref, saved: [selected.id] }, scenarios[0])[0]
        .listing.id,
    ).toBe(selected.id);
  });
  it("filters by actual municipality and moderation status", () => {
    const posts = [
      ...seedPosts,
      { ...seedPosts[0], id: "pending", moderation_status: "pending" as const },
    ];
    const r = rankFeed(posts, "Boac", [], seedListings);
    expect(r).toHaveLength(2);
    expect(
      r.every(
        (p) => p.municipality === "Boac" && p.moderation_status === "published",
      ),
    ).toBe(true);
  });
});
describe("source-grounded RINI", () => {
  it("cites a matched source and warns about unknown fees", () => {
    const r = answerRini("Tell me about Boac", seedListings);
    expect(r.text).toContain("Fee not verified");
    expect(r.sources[0].url).toContain("Boac_Cathedral");
  });
  it("connects a real itinerary workflow", () =>
    expect(answerRini("two-day itinerary", seedListings).action).toBe(
      "/map?plan=1&days=2",
    ));
  it("does not fabricate unknown answers or official schedules", () => {
    expect(answerRini("Where is Atlantis?", seedListings).text).toContain(
      "do not have a reliable answer",
    );
    expect(answerRini("ferry schedule", seedListings).text).toContain(
      "cannot confirm live ferry",
    );
  });
});
