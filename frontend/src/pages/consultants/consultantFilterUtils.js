/**
 * consultantFilterUtils.js
 * Pure client-side filter logic for the consultants listing page.
 * All functions are stateless and testable.
 */

export const CITIES    = ['عمّان','الزرقاء','مادبا','إربد','العقبة'];
export const COMM      = [{v:'video',l:'جلسة فيديو'},{v:'chat',l:'جلسة محادثة'},{v:'report',l:'تقرير مكتوب'}];
export const CHIPS     = [{label:'≤ 50 د.أ',max:50},{label:'≤ 75 د.أ',max:75},{label:'≤ 100 د.أ',max:100},{label:'100+ د.أ',min:100}];
export const PAGE_SIZE = 9;

export const GRADIENTS = [
  ['#0B2E4B','#164D70'],['#1A4A67','#0D3A56'],
  ['#F59A23','#DF820F'],['#005D9C','#003F69'],
];
export function grad(idx){ const g=GRADIENTS[idx%4]; return `linear-gradient(135deg,${g[0]},${g[1]})`; }

export function normAr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u0652]/g, '');
}

/**
 * Apply all local filters to the full consultants array.
 *
 * @param {Array}  consultants - Raw array from API
 * @param {Object} filters     - { search, selSpecs, selComms, cityF, availF }
 * @returns {Array} filtered consultants
 */
export function applyFilters(consultants, filters) {
  const { search = '', selSpecs = [], selComms = [], cityF = '', availF = false } = filters;

  return consultants.filter(c => {

    // ── 1. Text search ─────────────────────────────────────────────
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [
        c.full_name || '',
        c.specialization_name || '',
        c.bio || '',
        ...(Array.isArray(c.services) ? c.services : []),
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // ── 2. Specialization checkbox (match by ID only — reliable) ───
    if (selSpecs.length > 0) {
      const cSpecId = String(c.main_specialization_id || c.specialization_id || '');
      if (!selSpecs.includes(cSpecId)) return false;
    }

    // ── 3. Availability ────────────────────────────────────────────
    if (availF && c.is_available === false) return false;

    // ── 4. City ────────────────────────────────────────────────────
    if (cityF) {
      const cCity = normAr(c.city);
      const fCity = normAr(cityF);
      if (!cCity && fCity) return false;           // city not set on consultant
      if (cCity && !cCity.includes(fCity) && !fCity.includes(cCity)) return false;
    }

    // ── 5. Service type ────────────────────────────────────────────
    if (selComms.length > 0) {
      const svArr = Array.isArray(c.services) ? c.services : [];
      if (svArr.length === 0) return true;          // no service data → don't hide
      const svText = svArr.join(' ').toLowerCase();
      const matches = selComms.some(comm => {
        if (comm === 'video')  return svText.includes('فيديو')  || svText.includes('video');
        if (comm === 'chat')   return svText.includes('محادثة') || svText.includes('chat');
        if (comm === 'report') return svText.includes('تقرير')  || svText.includes('report');
        return false;
      });
      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Sort filtered consultants array.
 */
export function applySorting(consultants, sort) {
  const arr = [...consultants];
  const getPrice = c => {
    const p = c.price ?? c.price_per_hour ?? 0;
    return typeof p === 'number' ? p : (parseFloat(p) || 0);
  };
  const getRating = c => {
    const r = c.average_rating;
    return typeof r === 'number' ? r : (parseFloat(r) || 0);
  };

  if (sort === 'rating')     return arr.sort((a, b) => getRating(b) - getRating(a));
  if (sort === 'priceLow')   return arr.sort((a, b) => getPrice(a) - getPrice(b));
  if (sort === 'priceHigh')  return arr.sort((a, b) => getPrice(b) - getPrice(a));
  return arr; // 'best' — backend order
}

/**
 * Build pagination numbers with ellipsis gaps.
 */
export function buildPageNums(totalPages, currentPage) {
  return Array.from({ length: totalPages }, (_,i) => i+1)
    .filter(p => p===1 || p===totalPages || Math.abs(p-currentPage)<=1)
    .reduce((a,p,i,arr) => {
      if (i>0 && arr[i-1] !== p-1) a.push('…');
      a.push(p);
      return a;
    }, []);
}
