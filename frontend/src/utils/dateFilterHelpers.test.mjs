import assert from 'node:assert';
import {
  normalizeDigits,
  formatFullDate,
  formatMonthOnly,
  formatYearOnly,
  buildDateFilterPayload
} from './dateFilterHelpers.js';

console.log('--- Running Node Unit Tests for Date Filter Pure Helpers ---');

// 1. Normalization of Arabic numerals
assert.strictEqual(normalizeDigits('٢٠٢٦'), '2026', 'Should convert Arabic numerals to English');
assert.strictEqual(normalizeDigits('٢٠٢٦-٠٣-١٥'), '2026-03-15');

// 2. Format Year Only
assert.strictEqual(formatYearOnly(2026), '2026');

// 3. Format Month Only (m is 0-indexed: 2 -> March)
assert.strictEqual(formatMonthOnly(2026, 2), '2026-03');
assert.strictEqual(formatMonthOnly(2026, 0), '2026-01');
assert.strictEqual(formatMonthOnly(2026, 11), '2026-12');

// 4. Format Full Date (m is 0-indexed: 2 -> March, day: 15)
assert.strictEqual(formatFullDate(2026, 2, 15), '2026-03-15');
assert.strictEqual(formatFullDate(2026, 0, 5), '2026-01-05');

// 5. Build Payload: Year only
const payloadYear = buildDateFilterPayload({ dateFrom: '2024', dateTo: '2026' });
assert.deepStrictEqual(payloadYear, {
  date_from: '2024',
  year_from: 2024,
  date_to: '2026',
  year_to: 2026
});

// 6. Build Payload: Year + Month
const payloadMonth = buildDateFilterPayload({ dateFrom: '2024-06', dateTo: '2026-12' });
assert.deepStrictEqual(payloadMonth, {
  date_from: '2024-06',
  year_from: 2024,
  date_to: '2026-12',
  year_to: 2026
});

// 7. Build Payload: Year + Month + Day
const payloadDay = buildDateFilterPayload({ dateFrom: '2024-06-15', dateTo: '2026-12-31' });
assert.deepStrictEqual(payloadDay, {
  date_from: '2024-06-15',
  year_from: 2024,
  date_to: '2026-12-31',
  year_to: 2026
});

// 8. Build Payload: Empty / missing
assert.deepStrictEqual(buildDateFilterPayload({}), {});
assert.deepStrictEqual(buildDateFilterPayload(null), {});

console.log('ALL NODE DATE FILTER TESTS PASSED SUCCESSFULLY (8/8)!');
