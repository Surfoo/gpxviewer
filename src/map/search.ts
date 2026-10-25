import type { CacheFeature } from "@/types";

const text = (feature: CacheFeature, key: string): string =>
  (feature.get<string>(key) ?? "").toLowerCase();

// lower is better; -1 means no match
const rank = (feature: CacheFeature, query: string): number => {
  const code = text(feature, "code");
  if (code === query) return 0;
  if (code.startsWith(query)) return 1;
  if (code.includes(query)) return 2;
  return text(feature, "name").includes(query) ? 3 : -1;
};

// every cache whose code or name contains the query, best match first
export const searchCaches = (features: CacheFeature[], query: string): CacheFeature[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return features
    .map((feature) => ({ feature, score: rank(feature, needle) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => a.score - b.score)
    .map(({ feature }) => feature);
};
