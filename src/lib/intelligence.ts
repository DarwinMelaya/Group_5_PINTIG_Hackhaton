import {
  municipalities,
  type Listing,
  type Post,
  type Sentiment,
} from "./types";
export interface Scenario {
  baselineDemand: number;
  seasonalMultiplier: number;
  extraVisitors: number;
  assumedCapacity: number;
  availableServiceFraction: number;
}
export function congestion(s: Scenario) {
  if (
    [
      s.baselineDemand,
      s.seasonalMultiplier,
      s.extraVisitors,
      s.assumedCapacity,
      s.availableServiceFraction,
    ].some((v) => !Number.isFinite(v) || v < 0) ||
    s.availableServiceFraction > 1
  )
    throw new Error(
      "Use finite, non-negative inputs and a service fraction from 0 to 1.",
    );
  const modeledDemand =
    s.baselineDemand * s.seasonalMultiplier + s.extraVisitors;
  const availableCapacity = s.assumedCapacity * s.availableServiceFraction;
  const utilizationPercent =
    (100 * modeledDemand) / Math.max(availableCapacity, 1);
  return {
    modeledDemand,
    availableCapacity,
    utilizationPercent,
    category:
      utilizationPercent < 70
        ? "LOW"
        : utilizationPercent <= 100
          ? "MODERATE"
          : "HIGH",
  };
}
const positive = [
  "maganda",
  "malinis",
  "masaya",
  "mabait",
  "sulit",
  "beautiful",
  "clean",
  "friendly",
  "safe",
  "great",
  "love",
  "helpful",
];
const negative = [
  "marumi",
  "mahal",
  "delikado",
  "sira",
  "unsafe",
  "dirty",
  "expensive",
  "rude",
  "broken",
  "dangerous",
  "bad",
];
export const topics: Record<string, string[]> = {
  Cleanliness: ["clean", "dirty", "malinis", "marumi", "trash"],
  Pricing: ["price", "fee", "mahal", "sulit", "expensive"],
  Transport: ["ferry", "boat", "bus", "transport", "biyahe"],
  Accessibility: ["access", "wheelchair", "stairs", "accessible"],
  Safety: ["safe", "unsafe", "danger", "delikado"],
  Facilities: ["toilet", "facilities", "sira", "water"],
  Satisfaction: ["love", "great", "masaya", "beautiful", "maganda"],
};
export function classify(text: string): Sentiment {
  const words = text.toLowerCase().match(/[a-záéíóúñ]+/g) ?? [];
  let p = 0,
    n = 0;
  for (let i = 0; i < words.length; i++) {
    const neg = ["not", "no", "hindi", "di"].includes(words[i - 1] ?? "");
    if (positive.includes(words[i])) neg ? n++ : p++;
    if (negative.includes(words[i])) neg ? p++ : n++;
  }
  return p && n ? "Mixed" : p ? "Positive" : n ? "Negative" : "Neutral";
}
export function sentimentSummary(posts: Post[]) {
  const reviews = posts.filter(
    (p) =>
      p.post_type === "review" &&
      p.moderation_status === "published" &&
      !p.fictional,
  );
  const counts: Record<string, number> = {
    Positive: 0,
    Neutral: 0,
    Mixed: 0,
    Negative: 0,
  };
  reviews.forEach((r) => counts[classify(r.body)]++);
  const label: Sentiment = !reviews.length
    ? "Insufficient data"
    : counts.Positive && counts.Negative
      ? "Mixed"
      : (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Sentiment);
  return {
    label,
    counts,
    total: reviews.length,
    topics: Object.fromEntries(
      Object.entries(topics).map(([k, v]) => [
        k,
        reviews.filter((r) => v.some((w) => r.body.toLowerCase().includes(w)))
          .length,
      ]),
    ),
  };
}
export function feedbackCategory(text: string) {
  return (
    Object.entries(topics).find(([, words]) =>
      words.some((w) => text.toLowerCase().includes(w)),
    )?.[0] ?? "Tourist experience"
  );
}
export interface Preferences {
  days: number;
  municipality: string;
  interests: string[];
  budget: number;
  activity: string;
  saved: string[];
  date: string;
}
export function recommend(listings: Listing[], p: Preferences, s: Scenario) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  return listings
    .filter(
      (l) =>
        l.listing_type === "destination" &&
        l.moderation_status === "published" &&
        l.metadata.public_promotion &&
        l.metadata.verified,
    )
    .map((l) => {
      const interestMatch = clamp(
        l.metadata.activities.filter((a) => p.interests.includes(a)).length /
          Math.max(p.interests.length, 1),
      );
      const budgetFit =
        l.fee_max === null
          ? 0.35
          : l.fee_max <= p.budget
            ? 1
            : clamp(p.budget / Math.max(l.fee_max, 1));
      const proximityScore = l.municipality === p.municipality ? 1 : 0.4;
      const load = congestion({
        ...s,
        baselineDemand: l.metadata.baseline,
        assumedCapacity: l.metadata.capacity,
      });
      const lowCrowdingScore = clamp(1 - load.utilizationPercent / 200);
      const sourceConfidence = l.metadata.verified ? 1 : 0.25;
      const communityBenefitScore = clamp(l.metadata.community_benefit);
      const activityMatch =
        !p.activity || l.metadata.activities.includes(p.activity);
      return {
        listing: l,
        score:
          0.35 * interestMatch +
          0.2 * budgetFit +
          0.15 * proximityScore +
          0.15 * lowCrowdingScore +
          0.1 * sourceConfidence +
          0.05 * communityBenefitScore,
        reason: `${interestMatch ? "Matches your interests" : "Explore something different"} · ${l.municipality === p.municipality ? "Starting municipality" : "Different municipality"} · ${load.category.toLowerCase()} simulated crowding · ${l.fee_max === null ? "fee unverified" : "known fee within comparison"}`,
        activityMatch,
      };
    })
    .filter((x) => x.activityMatch)
    .sort(
      (a, b) =>
        Number(p.saved.includes(b.listing.id)) -
          Number(p.saved.includes(a.listing.id)) || b.score - a.score,
    )
    .slice(0, Math.max(3, Math.min(12, p.days * 3)));
}
export function rankFeed(
  posts: Post[],
  municipality: string,
  interests: string[],
  listings: Listing[],
  engagement: Record<string, number> = {},
  now = Date.now(),
) {
  return posts
    .filter(
      (p) =>
        p.moderation_status === "published" &&
        ["social", "review", "announcement"].includes(p.post_type) &&
        (!municipality || p.municipality === municipality),
    )
    .map((p) => {
      const l = listings.find((l) => l.id === p.listing_id);
      const recency =
        1 / (1 + Math.max(0, now - Date.parse(p.created_at)) / 86400000);
      const score =
        0.35 * recency +
        0.2 * Number(p.municipality === municipality) +
        0.2 *
          Number(l?.metadata.activities.some((a) => interests.includes(a))) +
        0.15 * Math.min((engagement[p.id] ?? 0) / 20, 1) +
        0.1 * Math.min(p.body.length / 300, 1);
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.post);
}
export function answerRini(input: string, listings: Listing[]) {
  const q = input.toLowerCase();
  if (/itiner|plan|two.day|dalawang araw/.test(q)) {
    const params = new URLSearchParams({ plan: "1" });
    const number = q.match(/\b([1-7])[- ]?(?:day|araw)/)?.[1];
    const words: Record<string, string> = {
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      six: "6",
      seven: "7",
      dalawang: "2",
      tatlong: "3",
    };
    const word = Object.keys(words).find((w) =>
      new RegExp("\\b" + w + "[- ]?(?:day|araw)").test(q),
    );
    if (number || word) params.set("days", number ?? words[word!]);
    const interests = [
      "beach",
      "heritage",
      "nature",
      "culture",
      "hiking",
      "photography",
    ].filter((i) => q.includes(i));
    if (interests.length) params.set("interests", interests.join(","));
    const municipality = municipalities.find((m) =>
      q.includes(m.toLowerCase()),
    );
    if (municipality) params.set("municipality", municipality);
    return {
      text: "Let’s build your trip using MAP’s actual itinerary engine. I have passed any recognized duration, interests and municipality to the planner. Recommendations require verified destination records; unknown fees stay unknown.",
      sources: [],
      action: "/map?" + params.toString(),
    };
  }
  if (/weather|bagyo|panahon|advis|ferry|schedule/.test(q))
    return {
      text: "For forecasts, check the weather card (Open-Meteo). Para sa opisyal na babala, consult PAGASA. I cannot confirm live ferry departures or official bulletins.",
      sources: [
        {
          name: "PAGASA · official advisories",
          url: "https://www.pagasa.dost.gov.ph/",
        },
      ],
    };
  if (/accredit|dot/.test(q))
    return {
      text: "DALUYAN cannot issue DOT accreditation. Check authoritative evidence and the official DOT portal.",
      sources: [
        {
          name: "DOT accreditation portal",
          url: "https://accreditation.tourism.gov.ph/",
        },
      ],
    };
  const matches = listings.filter(
    (l) =>
      l.moderation_status === "published" &&
      !l.metadata.fictional &&
      (q.includes(l.name.toLowerCase()) ||
        q.includes(l.municipality.toLowerCase())),
  );
  if (matches.length) {
    const l = matches[0];
    return {
      text: `${l.name}, ${l.municipality}: ${l.description} ${l.metadata.verified ? "Source-reviewed information." : "UNVERIFIED introductory record — confirm locally."} ${l.fee_max === null ? "Fee not verified — confirm with the operator." : `Recorded estimated fee: ₱${l.fee_max}.`}`,
      sources: l.source_url
        ? [{ name: l.name + " · source reference", url: l.source_url }]
        : [],
      action: "/places/" + l.id,
    };
  }
  if (/feedback|report|reklamo/.test(q))
    return {
      text: "You can submit a private tourism concern and track its status. Reports describe community allegations, not verified findings.",
      sources: [],
      action: "/feedback",
    };
  return {
    text: "I do not have a reliable answer in the approved records. Wala pa akong sapat na impormasyon. Try a destination or municipality name, or consult the provincial tourism office.",
    sources: [
      {
        name: "Marinduque provincial government",
        url: "https://marinduque.gov.ph/",
      },
    ],
  };
}
