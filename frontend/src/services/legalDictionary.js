// frontend/src/services/legalDictionary.js
// Legal dictionary & semantic suggestion service
// Matches colloquial phrases, typos, and legislative terms from official Excel dataset.
// Guaranteed high-availability: searches verified embedded dictionary with backend API fallback.

import SEEDED_TERMS from './legal_terms_seed.json';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Normalize Arabic text for robust semantic and phonetic matching.
 */
function normArabic(s) {
  if (!s) return '';
  return String(s)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel & tatweel
    .replace(/[«»\"\'\(\)\[\]\.\,\:\-\_\/\\]/g, ' ') // punctuation to space
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strip common Arabic grammatical prefixes (ال، لل، بال، وال، كال، فال).
 */
function stripPrefix(w) {
  return w.replace(/^(?:ال|لل|بال|وال|كال|فال)/, '');
}

/**
 * Levenshtein distance for typo tolerance.
 */
function levDistance(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) m[i][j] = m[i - 1][j - 1];
      else m[i][j] = Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

/**
 * Fuzzy word match allowing 1-2 character typos based on length.
 */
function isFuzzyWordMatch(w1, w2) {
  if (w1 === w2) return true;
  const sw1 = stripPrefix(w1);
  const sw2 = stripPrefix(w2);
  if (sw1 === sw2) return true;
  if (!sw1 || !sw2) return false;
  const maxL = Math.max(sw1.length, sw2.length);
  const maxAllowedDist = maxL <= 4 ? 1 : 2;
  return levDistance(sw1, sw2) <= maxAllowedDist;
}

/**
 * Comprehensive scoring for a term against query:
 * 1. Exact popular or legislative term match -> 1.0
 * 2. Normalized exact match -> 0.98
 * 3. Word-set permutation match (e.g. "دخل صافي" vs "صافي الدخل") -> 0.95
 * 4. Substring containment -> 0.90
 * 5. Typo tolerance fuzzy word match -> 0.70 - 0.88
 */
function scoreTerm(query, term) {
  const qClean = normArabic(query);
  const popClean = normArabic(term.popular_term);
  const legClean = normArabic(term.legislative_term);

  if (term.popular_term === query || term.legislative_term === query) return 1.0;
  if (popClean === qClean || legClean === qClean) return 0.98;

  const qWords = qClean.split(/\s+/).filter(Boolean);
  const popWords = popClean.split(/\s+/).filter(Boolean);
  const legWords = legClean.split(/\s+/).filter(Boolean);

  const qStripSorted = qWords.map(stripPrefix).sort().join(' ');
  const popStripSorted = popWords.map(stripPrefix).sort().join(' ');
  const legStripSorted = legWords.map(stripPrefix).sort().join(' ');

  // Word order permutation match (e.g. "دخل صافي" matches "صافي الدخل" or "الدخل الصافي")
  if (qStripSorted === popStripSorted || qStripSorted === legStripSorted) return 0.95;

  // Substring containment
  if (popClean.includes(qClean) || legClean.includes(qClean)) return 0.90;
  if (qClean.includes(popClean) || qClean.includes(legClean)) return 0.88;

  // Fuzzy word matching for typos and colloquial variations
  for (const tWords of [popWords, legWords]) {
    if (qWords.length === 0 || tWords.length === 0) continue;
    let matchedWordsCount = 0;
    for (const qw of qWords) {
      if (tWords.some(tw => isFuzzyWordMatch(qw, tw))) {
        matchedWordsCount++;
      }
    }
    const ratio = matchedWordsCount / Math.max(qWords.length, tWords.length);
    if (ratio >= 0.5) {
      return 0.70 + (ratio * 0.20);
    }
  }

  return 0;
}

/**
 * Extract numeric article from Arabic reference (e.g. "المادة 2" -> "2", "المادة 9/أ/1" -> "9")
 */
function extractArticleNumber(ref) {
  if (!ref) return '2';
  const m = String(ref).match(/\d+/);
  return m ? m[0] : '2';
}

/**
 * Search the verified local dataset with full typo tolerance and word permutation support.
 */
export function searchLocalDictionary(userQuery, limit = 5) {
  if (!userQuery || !userQuery.trim()) return [];

  const scored = [];
  const seenLeg = new Set();

  for (const t of SEEDED_TERMS) {
    const s = scoreTerm(userQuery.trim(), t);
    if (s >= 0.7) {
      const legKey = normArabic(t.legislative_term);
      if (!seenLeg.has(legKey)) {
        seenLeg.add(legKey);
        scored.push({ score: s, term: t });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ term: t }, idx) => {
    const artNum = extractArticleNumber(t.article_reference);
    const lawId = t.law_name?.includes('34') ? 'قانون_34_2014_وتعديلاته' : 'قانون_34_2014_وتعديلاته';
    const highlightSnippet = (t.literal_text || t.legislative_term || '').slice(0, 100);

    return {
      id: t.row_hash || `term_${idx}`,
      title: t.legislative_term,
      popular_term: t.popular_term,
      law_name: t.law_name,
      law_id: lawId,
      article_reference: t.article_reference,
      article_number: parseInt(artNum, 10),
      literal_text: t.literal_text,
      open_url: `/regulations/law/${encodeURIComponent(lawId)}?article=مادة_${artNum}&highlight=${encodeURIComponent(highlightSnippet)}`,
      is_direct_banner: true
    };
  });
}

/**
 * Fetch legislative term suggestions: tries backend with quick timeout,
 * falls back to verified embedded dictionary with zero network failure possible.
 * NEVER throws an error!
 */
export async function getLegalSuggestionAsync(userQuery) {
  if (!userQuery || !userQuery.trim()) {
    return { matched: false, is_direct_banner: false, options: [] };
  }

  const query = userQuery.trim();

  // Try fetching from backend with a 750ms timeout guard
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 750);

    const url = `${API_BASE}/api/legal/terms/suggest?q=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.options) && data.options.length > 0) {
        return {
          matched: true,
          is_direct_banner: Boolean(data.is_direct_banner),
          options: data.options
        };
      }
    }
  } catch (_ignored) {
    // Backend offline, slow, or returning error -> gracefully fall back to local dictionary
  }

  // Fallback / primary search via embedded verified legal terms dictionary
  const localOptions = searchLocalDictionary(query, 5);

  return {
    matched: localOptions.length > 0,
    is_direct_banner: localOptions.length > 0,
    options: localOptions
  };
}
