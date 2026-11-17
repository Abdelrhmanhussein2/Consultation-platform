import test from 'node:test';
import assert from 'node:assert';
import {
  LEGAL_FORM_OPTIONS,
  SECTOR_OPTIONS,
  CONSULTANT_ACTIVITY_OPTIONS,
  CONSULTANT_REGISTRATION_ACTIVITIES,
  CONSULTANT_SPECIALIZATION_OPTIONS
} from '../notifications/broadcastConstants.js';

test('CONSULTANT_ACTIVITY_OPTIONS contains only the 5 official types and excludes independent_consultant', () => {
  const values = CONSULTANT_ACTIVITY_OPTIONS.map((o) => o.value);
  assert.ok(values.includes('all'));
  assert.ok(values.includes('مستشار ضريبي'));
  assert.ok(values.includes('مدقق حسابات'));
  assert.ok(values.includes('خبير ضريبي'));
  assert.ok(values.includes('مستشار قانوني'));
  assert.ok(values.includes('محاسب قانوني'));
  // Ensure independent_consultant / مستشار مستقل is strictly absent
  assert.strictEqual(values.includes('independent_consultant'), false);
  assert.strictEqual(values.includes('مستشار مستقل'), false);
  // Total length must be exactly 6 (all + 5 types)
  assert.strictEqual(values.length, 6);
  assert.strictEqual(values.length, new Set(values).size);
});

test('CONSULTANT_REGISTRATION_ACTIVITIES has exactly the 5 official types without "all"', () => {
  const values = CONSULTANT_REGISTRATION_ACTIVITIES.map((o) => o.value);
  assert.strictEqual(values.length, 5);
  assert.deepStrictEqual(values, ['مستشار ضريبي', 'مدقق حسابات', 'خبير ضريبي', 'مستشار قانوني', 'محاسب قانوني']);
});

test('CONSULTANT_SPECIALIZATION_OPTIONS contains all 8 official specializations', () => {
  const values = CONSULTANT_SPECIALIZATION_OPTIONS.map((o) => o.value);
  const expected = ['all', 'tax', 'sales_tax', 'income_tax', 'customs', 'free_zones', 'transfer_pricing', 'legal', 'audit'];
  for (const exp of expected) {
    assert.ok(values.includes(exp), `Expected ${exp} in options`);
  }
});

test('LEGAL_FORM_OPTIONS and SECTOR_OPTIONS contain all default and required options', () => {
  const legalVals = LEGAL_FORM_OPTIONS.map((o) => o.value);
  assert.ok(legalVals.includes('all'));
  assert.ok(legalVals.includes('sole_proprietorship'));
  assert.ok(legalVals.includes('llc'));

  const sectorVals = SECTOR_OPTIONS.map((o) => o.value);
  assert.ok(sectorVals.includes('all'));
  assert.ok(sectorVals.includes('commercial'));
  assert.ok(sectorVals.includes('industrial'));
  assert.ok(sectorVals.includes('services'));
});

test('Payload generation for target_group "all"', () => {
  const payload = {
    title: 'تنبيه هام لكافة المنصة',
    message: 'تحديث تشريعي جديد',
    target_group: 'all',
    user_filters: {},
    consultant_filters: {},
    source_id: 'law_123',
    source_title: 'قانون ضريبة الدخل'
  };
  assert.strictEqual(payload.target_group, 'all');
  assert.strictEqual(payload.source_id, 'law_123');
  assert.deepStrictEqual(payload.user_filters, {});
  assert.deepStrictEqual(payload.consultant_filters, {});
});

test('Payload generation for target_group "users" with company filters', () => {
  const userFilters = { legal_form: 'llc', sector: 'industrial' };
  const payload = {
    title: 'تنبيه للشركات الصناعية ذات المسؤولية المحدودة',
    message: 'تحديث الأنظمة الصناعية',
    target_group: 'users',
    user_filters: userFilters,
    consultant_filters: {},
    source_id: 'law_456',
    source_title: 'قانون الشركات'
  };
  assert.strictEqual(payload.target_group, 'users');
  assert.strictEqual(payload.user_filters.legal_form, 'llc');
  assert.strictEqual(payload.user_filters.sector, 'industrial');
  assert.deepStrictEqual(payload.consultant_filters, {});
});

test('Payload generation for target_group "consultants" with Arabic activity filter', () => {
  const consultantFilters = { activity: 'مستشار ضريبي', specialization: 'income_tax' };
  const payload = {
    title: 'تنبيه للمستشارين الضريبيين',
    message: 'تعديل على تعليمات ضريبة الدخل',
    target_group: 'consultants',
    user_filters: {},
    consultant_filters: consultantFilters,
    source_id: 'law_789',
    source_title: 'تعليمات ضريبة الدخل'
  };
  assert.strictEqual(payload.target_group, 'consultants');
  assert.strictEqual(payload.consultant_filters.activity, 'مستشار ضريبي');
  assert.strictEqual(payload.consultant_filters.specialization, 'income_tax');
  assert.deepStrictEqual(payload.user_filters, {});
});
