import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapOfficialClass,
  parseArgs,
  parseMontenegrinDate,
  polygonCentroid
} from '../scripts/import-morsko-dobro.mjs';

test('výchozí import pokrývá všechny cílové obce', () => {
  assert.deepEqual(
    parseArgs(['--year=2026']).municipalities,
    ['Kotor', 'Tivat', 'Herceg Novi', 'Budva']
  );
});

test('jednu obec lze vybrat zpětně kompatibilním parametrem', () => {
  assert.deepEqual(
    parseArgs(['--municipality=Tivat', '--year=2026']).municipalities,
    ['Tivat']
  );
});

test('datum Morsko dobro se převádí na ISO', () => {
  assert.equal(parseMontenegrinDate('20.07.2026.'), '2026-07-20');
  assert.equal(parseMontenegrinDate('20.07.2026. 10:37'), '2026-07-20');
});

test('číselná třída je primární zdroj mapování', () => {
  assert.equal(mapOfficialClass(1, 'Anything'), 'excellent');
  assert.equal(mapOfficialClass(2, 'Anything'), 'good');
  assert.equal(mapOfficialClass(3, 'Okay'), 'satisfactory');
  assert.equal(mapOfficialClass(4, 'Bad'), 'poor');
});

test('neznámá třída se neodhaduje', () => {
  assert.throws(() => mapOfficialClass(9, 'Maybe'), /Neznámá klasifikace/);
});

test('centroid jednoduchého polygonu je správný', () => {
  const centroid = polygonCentroid('POLYGON ((18 42, 20 42, 20 44, 18 44, 18 42))');
  assert.ok(Math.abs(centroid.lon - 19) < 1e-9);
  assert.ok(Math.abs(centroid.lat - 43) < 1e-9);
});
