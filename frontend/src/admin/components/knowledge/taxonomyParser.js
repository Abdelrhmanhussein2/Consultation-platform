/**
 * frontend/src/admin/components/knowledge/taxonomyParser.js
 * Pure utility to parse GET /api/legal/relations/{law_id} response into 3 display groups:
 * 1. issued_under: ما صدر بموجبه (أنظمة، قرارات، تعليمات، إلخ)
 * 2. repealed_by: ما أُلغي بموجبه (وثائق وتشريعات ألغاها هذا القانون الأصل)
 *    Direction notice: In taxonomy tree, target documents under parent's repealed_by are documents
 *    repealed by this parent law.
 * 3. judicial: الارتباطات القضائية (تمييز حقوق، تمييز جزاء، إلخ)
 */

const CANONICAL_NAMES = {
  'أنظمة': 'الأنظمة',
  'الأنظمة': 'الأنظمة',
  'قرارات': 'القرارات',
  'القرارات': 'القرارات',
  'تعليمات': 'التعليمات',
  'التعليمات': 'التعليمات',
  'قوانين': 'القوانين',
  'القوانين': 'القوانين',
  'أحكام ملزمة': 'أحكام ملزمة',
  'احكام ملزمة': 'أحكام ملزمة',
  'جداول': 'جداول',
  'الجداول': 'جداول',
  'ملاحق': 'ملاحق',
  'الملاحق': 'ملاحق'
};

function collectCategories(rawDict) {
  if (!rawDict || typeof rawDict !== 'object') return [];
  const map = new Map();
  for (const [key, items] of Object.entries(rawDict)) {
    if (Array.isArray(items) && items.length > 0) {
      const canonical = CANONICAL_NAMES[key.trim()] || key.trim();
      const existing = map.get(canonical) || [];
      map.set(canonical, existing.concat(items));
    }
  }
  const result = [];
  for (const [name, items] of map.entries()) {
    result.push({ name, count: items.length, items });
  }
  return result;
}

export function parseTaxonomyGroups(treeData) {
  if (!treeData || typeof treeData !== 'object') {
    return { groups: [], totalCount: 0 };
  }

  // Handle both bare treeData and wrapped envelope { code, status, data: { ... } }
  const root = (treeData.data && typeof treeData.data === 'object' && !Array.isArray(treeData.data))
    ? treeData.data
    : treeData;

  const groups = [];

  // Group 1: ما صدر بموجبه
  const rawIssued = root.legislative?.issued_under || {};
  const issuedCategories = collectCategories(rawIssued);
  const issuedTotal = issuedCategories.reduce((sum, c) => sum + c.count, 0);
  if (issuedTotal > 0) {
    groups.push({
      key: 'issued_under',
      title: 'ما صدر بموجبه',
      hint: null,
      categories: issuedCategories,
      total: issuedTotal
    });
  }

  // Group 2: ما أُلغي بموجبه (وثائق ألغاها هذا القانون)
  const rawRepealed = root.legislative?.repealed_by || {};
  const repealedCategories = collectCategories(rawRepealed);
  const repealedTotal = repealedCategories.reduce((sum, c) => sum + c.count, 0);
  if (repealedTotal > 0) {
    groups.push({
      key: 'repealed_by',
      title: 'ما أُلغي بموجبه',
      hint: 'وثائق ألغاها هذا القانون',
      categories: repealedCategories,
      total: repealedTotal
    });
  }

  // Group 3: الارتباطات القضائية
  const rawJudicial = root.judicial || {};
  const judicialCategories = collectCategories(rawJudicial);
  const judicialTotal = judicialCategories.reduce((sum, c) => sum + c.count, 0);
  if (judicialTotal > 0) {
    groups.push({
      key: 'judicial',
      title: 'الارتباطات القضائية',
      hint: null,
      categories: judicialCategories,
      total: judicialTotal
    });
  }

  const totalCount = groups.reduce((sum, g) => sum + g.total, 0);
  return { groups, totalCount };
}
