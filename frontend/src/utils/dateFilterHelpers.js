// frontend/src/utils/dateFilterHelpers.js

export function normalizeDigits(str) {
  if (!str) return '';
  return String(str).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

export function formatFullDate(y, m, d) {
  const dStr = String(d).padStart(2, '0');
  const mStr = String(m + 1).padStart(2, '0');
  return `${y}-${mStr}-${dStr}`;
}

export function formatMonthOnly(y, m) {
  const mStr = String(m + 1).padStart(2, '0');
  return `${y}-${mStr}`;
}

export function formatYearOnly(y) {
  return String(y);
}

export function buildDateFilterPayload(filters) {
  const params = {};
  if (filters?.dateFrom) {
    const cleanFrom = String(filters.dateFrom).trim();
    if (cleanFrom) {
      params.date_from = cleanFrom;
      const nums = cleanFrom.replace(/[^0-9]/g, ' ').trim().split(/\s+/);
      const possibleYear = parseInt(nums.find(n => n.length === 4) || nums[nums.length - 1], 10);
      if (possibleYear >= 1900 && possibleYear <= 2100) {
        params.year_from = possibleYear;
      }
    }
  }

  if (filters?.dateTo) {
    const cleanTo = String(filters.dateTo).trim();
    if (cleanTo) {
      params.date_to = cleanTo;
      const nums = cleanTo.replace(/[^0-9]/g, ' ').trim().split(/\s+/);
      const possibleYear = parseInt(nums.find(n => n.length === 4) || nums[nums.length - 1], 10);
      if (possibleYear >= 1900 && possibleYear <= 2100) {
        params.year_to = possibleYear;
      }
    }
  }

  return params;
}
