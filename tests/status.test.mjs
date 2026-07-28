import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getFreshnessMeta,
  getOfficialStatusMeta,
  getRiskMeta,
  trendLabel
} from '../src/utils/status.js';

test('uživatelské štítky jsou české', () => {
  assert.equal(getOfficialStatusMeta('excellent').label, 'Výborná');
  assert.equal(getRiskMeta('elevated').label, 'Zvýšené kontextové riziko');
});

test('stáří používá české tvary', () => {
  assert.equal(getFreshnessMeta(0).label, 'dnes');
  assert.equal(getFreshnessMeta(1).label, '1 den');
  assert.equal(getFreshnessMeta(3).label, '3 dny');
  assert.equal(getFreshnessMeta(8).label, '8 dní');
});

test('trend bezpečně zachází s krátkou historií', () => {
  assert.equal(trendLabel([]), 'Trend nelze určit');
});
