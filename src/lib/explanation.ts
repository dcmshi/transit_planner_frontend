export function isExplanationAvailable(s: string): boolean {
  return !s.startsWith("Explanation unavailable:");
}

/** Returns 0-based index into routes[] for the recommended option, or null. */
export function parseRecommendedIndex(explanation: string): number | null {
  const match = explanation.match(/\*\*Recommendation:\*\*[^*]*Option (\d+)/i);
  return match ? parseInt(match[1], 10) - 1 : null;
}
