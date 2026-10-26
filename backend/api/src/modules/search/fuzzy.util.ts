/**
 * 🔍 FUZZY SEARCH & STRING SIMILARITY UTILITIES
 * 
 * High-performance string distance algorithms, phonetic indexing,
 * and multi-criteria relevance scoring for medical entities.
 */

export interface FuzzyScoreResult {
  score: number; // 0.0 (no match) to 1.0 (exact match)
  isMatch: boolean;
  matchType: "EXACT" | "PREFIX" | "WORD_BOUNDARY" | "SUBSTRING" | "PHONETIC" | "FUZZY" | "NONE";
}

/**
 * Standard Levenshtein Distance with O(min(m, n)) space optimization.
 * Calculates minimum single-character edits (insertions, deletions, substitutions).
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  let v0 = new Array(s2.length + 1);
  let v1 = new Array(s2.length + 1);

  for (let i = 0; i <= s2.length; i++) {
    v0[i] = i;
  }

  for (let i = 0; i < s1.length; i++) {
    v1[0] = i + 1;

    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      v1[j + 1] = Math.min(
        v1[j] + 1,      // insertion
        v0[j + 1] + 1,  // deletion
        v0[j] + cost    // substitution
      );
    }

    for (let j = 0; j <= s2.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[s2.length];
}

/**
 * Damerau-Levenshtein / Optimal String Alignment (OSA) Distance.
 * Considers insertions, deletions, substitutions, and transposition of two adjacent characters.
 * Essential for common medical clerical typos (e.g., "tset" -> "test", "clnical" -> "clinical").
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  const s1 = (a || "").toLowerCase();
  const s2 = (b || "").toLowerCase();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition of adjacent characters
      if (
        i > 1 &&
        j > 1 &&
        s1[i - 1] === s2[j - 2] &&
        s1[i - 2] === s2[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[m][n];
}

/**
 * Computes normalized similarity between 0.0 and 1.0 based on Damerau-Levenshtein.
 */
export function calculateSimilarity(source: string, target: string): number {
  const s = source.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  if (s === t) return 1.0;
  if (!s || !t) return 0.0;

  const maxLen = Math.max(s.length, t.length);
  const distance = damerauLevenshteinDistance(s, t);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * American Soundex phonetic algorithm implementation.
 * Encodes name into a 4-character code (Letter + 3 digits) to match phonetically identical names
 * e.g. "Ashok" & "Ashoc", "Panchal" & "Panchall".
 */
export function soundex(str: string): string {
  const s = str.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!s) return "0000";

  const charMap: Record<string, string> = {
    B: "1", F: "1", P: "1", V: "1",
    C: "2", G: "2", J: "2", K: "2", Q: "2", S: "2", X: "2", Z: "2",
    D: "3", T: "3",
    L: "4",
    M: "5", N: "5",
    R: "6"
  };

  const firstLetter = s[0];
  let result = firstLetter;
  let prevCode = charMap[firstLetter] || "0";

  for (let i = 1; i < s.length && result.length < 4; i++) {
    const char = s[i];
    const code = charMap[char] || "0";

    if (code !== "0" && code !== prevCode) {
      result += code;
    }
    prevCode = code;
  }

  return result.padEnd(4, "0").slice(0, 4);
}

/**
 * Evaluates whether two tokens match phonetically via Soundex.
 */
export function isPhoneticMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return soundex(a) === soundex(b);
}

/**
 * Multi-layer clinical fuzzy scoring engine.
 * Computes match relevance against exact matches, prefix matches, word boundaries,
 * substrings, phonetic similarity, and character-level edit distance.
 */
export function fuzzyScore(
  targetText: string,
  queryString: string,
  threshold: number = 0.45
): FuzzyScoreResult {
  const target = (targetText || "").trim().toLowerCase();
  const query = (queryString || "").trim().toLowerCase();

  if (!query || !target) {
    return { score: 0, isMatch: false, matchType: "NONE" };
  }

  // 1. Exact Match
  if (target === query) {
    return { score: 1.0, isMatch: true, matchType: "EXACT" };
  }

  // 2. Exact Prefix Match (e.g. query "hemo" matches "hemoglobin")
  if (target.startsWith(query)) {
    const score = 0.90 + 0.08 * (query.length / target.length);
    return { score, isMatch: true, matchType: "PREFIX" };
  }

  // 3. Word Boundary Match (e.g. query "cbc" matches "Panel CBC Complete")
  const words = target.split(/[\s,./\-_]+/);
  for (const word of words) {
    if (word === query) {
      return { score: 0.88, isMatch: true, matchType: "WORD_BOUNDARY" };
    }
    if (word.startsWith(query)) {
      return { score: 0.82, isMatch: true, matchType: "WORD_BOUNDARY" };
    }
  }

  // 4. Substring Match (e.g. "blood" in "whole blood count")
  if (target.includes(query)) {
    const score = 0.70 + 0.10 * (query.length / target.length);
    return { score, isMatch: true, matchType: "SUBSTRING" };
  }

  // 5. Phonetic Soundex Match for words
  for (const word of words) {
    if (word.length >= 3 && query.length >= 3 && isPhoneticMatch(word, query)) {
      return { score: 0.65, isMatch: true, matchType: "PHONETIC" };
    }
  }

  // 6. Token-level Damerau-Levenshtein similarity
  let bestTokenSim = 0;
  for (const word of words) {
    const sim = calculateSimilarity(word, query);
    if (sim > bestTokenSim) {
      bestTokenSim = sim;
    }
  }

  // Also check whole string similarity
  const fullSim = calculateSimilarity(target, query);
  const maxSim = Math.max(bestTokenSim, fullSim);

  if (maxSim >= threshold) {
    return { score: maxSim * 0.60, isMatch: true, matchType: "FUZZY" };
  }

  return { score: 0, isMatch: false, matchType: "NONE" };
}

/**
 * Highlights matching terms by wrapping matches in `<mark>` tags.
 */
export function highlightMatch(text: string, query: string): string {
  if (!text || !query.trim()) return text;
  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return text.replace(regex, "<mark class=\"bg-amber-400/30 text-amber-200 font-semibold px-0.5 rounded\">$1</mark>");
}
