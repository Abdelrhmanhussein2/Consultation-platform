// frontend/src/utils/legalFormatters.js

/**
 * Formats the amended date of a law for display.
 * If there is no amendment (original text, not applicable, null, or em-dash), returns '—'.
 * Otherwise returns the valid amended date string.
 *
 * @param {string|null|undefined} amendedDate
 * @param {object} [law]
 * @returns {string}
 */
export function formatLawAmendedDate(amendedDate, law = {}) {
  if (!amendedDate) {
    return '—';
  }
  const clean = String(amendedDate).trim();
  if (
    !clean ||
    clean === '—' ||
    clean === '-' ||
    clean.includes('لا ينطبق') ||
    clean.includes('نص أصلي')
  ) {
    return '—';
  }
  return clean;
}

/**
 * Normalizes an original law title by removing '— كما صدر'.
 * Ensures original laws use '(النسخة الأصلية)'.
 *
 * @param {string} title
 * @returns {string}
 */
export function formatOriginalLawTitle(title) {
  if (!title) return '';
  let res = String(title)
    .replace(/\s*—\s*كما صدر/g, '')
    .replace(/\s*-\s*كما صدر/g, '')
    .replace(/\s+كما صدر/g, '')
    .trim();
  return res;
}
