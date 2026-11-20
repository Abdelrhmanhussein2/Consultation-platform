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
 * Extracts the 4-digit display year for a law:
 * Priority 1: Year from amended_date (آخر تعديل) if present and valid.
 * Priority 2: Year from issue_date (تاريخ الإصدار).
 * Priority 3: Fallback to year_short / year / title.
 *
 * @param {object} law
 * @returns {string} 4-digit year string (e.g. '2019', '2014')
 */
export function getLawDisplayYear(law) {
  if (!law) return '';

  // 1. Check amended_date (آخر تعديل) first
  const amendedRaw = law.amended_date || law.تاريخ_آخر_تعديل || law.amendedDate;
  if (amendedRaw) {
    const cleanAmended = String(amendedRaw).trim();
    if (
      cleanAmended &&
      cleanAmended !== '—' &&
      cleanAmended !== '-' &&
      !cleanAmended.includes('لا ينطبق') &&
      !cleanAmended.includes('نص أصلي')
    ) {
      const match = cleanAmended.match(/\d{4}/);
      if (match) return match[0];
    }
  }

  // 2. Fallback to issue_date (تاريخ الإصدار)
  const issueRaw = law.issue_date || law.تاريخ_الصدور || law.تاريخ_النشر || law.issueDate;
  if (issueRaw) {
    const cleanIssue = String(issueRaw).trim();
    if (cleanIssue && cleanIssue !== '—' && cleanIssue !== '-') {
      const match = cleanIssue.match(/\d{4}/);
      if (match) return match[0];
    }
  }

  // 3. Fallback to year_short / year
  if (law.year_short) {
    const match = String(law.year_short).match(/\d{4}/);
    if (match) return match[0];
  }
  if (law.year) {
    const match = String(law.year).match(/\d{4}/);
    if (match) return match[0];
  }

  // 4. Fallback to title: لسنة YYYY
  if (law.title) {
    const match = String(law.title).match(/لسنة\s+(\d{4})/);
    if (match) return match[1];
  }

  return '';
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
