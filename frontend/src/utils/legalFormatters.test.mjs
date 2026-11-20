import assert from 'node:assert/strict';
import { formatLawAmendedDate, formatOriginalLawTitle } from './legalFormatters.js';

console.log('--- Running legalFormatters unit tests ---');

// 1. formatLawAmendedDate tests
// Case A: قانون بلا تعديلات (amended_date is null/undefined/empty)
assert.equal(formatLawAmendedDate(null), '—', 'null should return em-dash');
assert.equal(formatLawAmendedDate(undefined), '—', 'undefined should return em-dash');
assert.equal(formatLawAmendedDate(''), '—', 'empty string should return em-dash');
assert.equal(formatLawAmendedDate('—'), '—', 'em-dash should return em-dash');
assert.equal(formatLawAmendedDate('-'), '—', 'dash should return em-dash');

// Case B: نسخة أصلية (amended_date is "لا ينطبق (نص أصلي)")
assert.equal(formatLawAmendedDate('لا ينطبق (نص أصلي)'), '—', 'not applicable should return em-dash');
assert.equal(formatLawAmendedDate('لا ينطبق'), '—', 'not applicable should return em-dash');
assert.equal(formatLawAmendedDate('نص أصلي'), '—', 'original text should return em-dash');
assert.equal(
  formatLawAmendedDate(null, { type: 'نسخة أصلية', law_id: 'قانون_34_2014_الأصلية' }),
  '—',
  'original version without date should return em-dash'
);

// Case C: قانون معدل بتاريخ (amended_date is a valid date)
assert.equal(formatLawAmendedDate('01-01-2019'), '01-01-2019', 'valid date should be preserved');
assert.equal(formatLawAmendedDate('2019-01-01'), '2019-01-01', 'valid date YYYY-MM-DD preserved');
assert.equal(formatLawAmendedDate('2023'), '2023', 'year date preserved');

// 2. formatOriginalLawTitle tests
assert.equal(
  formatOriginalLawTitle('قانون ضريبة الدخل رقم 34 لسنة 2014 (النسخة الأصلية — كما صدر)'),
  'قانون ضريبة الدخل رقم 34 لسنة 2014 (النسخة الأصلية)',
  'should strip — كما صدر leaving (النسخة الأصلية)'
);
assert.equal(
  formatOriginalLawTitle('قانون ضريبة الدخل رقم 34 لسنة 2014 — كما صدر'),
  'قانون ضريبة الدخل رقم 34 لسنة 2014',
  'should strip — كما صدر'
);
assert.equal(
  formatOriginalLawTitle('قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته'),
  'قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته',
  'should keep amended law title unchanged'
);
assert.equal(
  formatOriginalLawTitle('قانون رقم 45 لسنة 2008 (قانون التأجير التمويلي لسنة 2008)'),
  'قانون رقم 45 لسنة 2008 (قانون التأجير التمويلي لسنة 2008)',
  'should preserve regular law titles'
);
assert.equal(formatOriginalLawTitle(''), '', 'empty title returns empty');

console.log('✓ All 15 formatters assertions passed successfully!');
