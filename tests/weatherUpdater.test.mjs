import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBatches,
  degreesToCardinal,
  precipitationSum
} from '../scripts/update-weather.mjs';

test('větší seznam lokalit se rozdělí do bezpečných dávek', () => {
  const batches = createBatches(Array.from({ length: 81 }, (_, index) => index), 25);
  assert.deepEqual(batches.map((batch) => batch.length), [25, 25, 25, 6]);
});

test('směr větru se převádí na osm světových stran', () => {
  assert.equal(degreesToCardinal(0), 'N');
  assert.equal(degreesToCardinal(44), 'NE');
  assert.equal(degreesToCardinal(180), 'S');
  assert.equal(degreesToCardinal(315), 'NW');
  assert.equal(degreesToCardinal(360), 'N');
});

test('srážky se sčítají pouze v požadovaném okně', () => {
  const times = [
    '2026-07-26T08:00',
    '2026-07-26T09:00',
    '2026-07-27T08:00'
  ];
  const values = [100, 2.5, 1.5];
  const reference = new Date('2026-07-27T08:00:00+02:00');
  assert.equal(precipitationSum(times, values, reference, 24, 7200), 4);
});
