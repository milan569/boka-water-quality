import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const officialWorkflow = await readFile(
  new URL('../.github/workflows/update-official-data.yml', import.meta.url),
  'utf8'
);
const weatherWorkflow = await readFile(
  new URL('../.github/workflows/update-weather.yml', import.meta.url),
  'utf8'
);
const serviceWorker = await readFile(
  new URL('../public/sw.js', import.meta.url),
  'utf8'
);
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('oficiální data se lehce kontrolují čtyřikrát denně a lze je spustit ručně', () => {
  assert.match(officialWorkflow, /schedule:/);
  assert.match(officialWorkflow, /43 2,8,14,20 \* \* \*/);
  assert.match(officialWorkflow, /17 1 \* \* 0/);
  assert.match(officialWorkflow, /workflow_dispatch:/);
  assert.match(officialWorkflow, /Force complete history refresh/);
  assert.match(officialWorkflow, /date -u \+%Y/);
  assert.match(officialWorkflow, /Detect official-data changes/);
  assert.match(officialWorkflow, /steps\.official\.outputs\.changed == 'true'/);
});

test('oba datové workflow po změně spouštějí nasazení', () => {
  for (const workflow of [officialWorkflow, weatherWorkflow]) {
    assert.match(workflow, /actions: write/);
    assert.match(workflow, /gh workflow run deploy\.yml --ref main/);
    assert.match(workflow, /steps\.commit\.outputs\.changed == 'true'/);
  }
});

test('PWA navigace používá při dostupné síti novou verzi', () => {
  assert.match(serviceWorker, /request\.mode === 'navigate'/);
  assert.match(serviceWorker, /fetch\(request, \{ cache: 'no-store' \}\)/);
  assert.match(serviceWorker, /boka-water-quality-mvp-v8/);
});

test('obsah iOS PWA začíná pod stavovým pruhem a výřezem', () => {
  assert.match(index, /apple-mobile-web-app-status-bar-style" content="default"/);
  assert.match(index, /viewport-fit=cover/);
  assert.match(styles, /--safe-top: env\(safe-area-inset-top, 0px\)/);
  assert.match(styles, /padding: calc\(8px \+ var\(--safe-top\)\) 8px 8px/);
  assert.match(styles, /top: var\(--safe-top\)/);
});

test('aplikace nabízí tlačítko i gesto pro načtení zveřejněných dat', () => {
  assert.match(app, /'Aktualizovat'/);
  assert.match(app, /touchstart/);
  assert.match(app, /pullDistanceRef\.current >= 62/);
  assert.match(app, /window\.location\.reload\(\)/);
  assert.match(app, /Nejnovější odběr:/);
});
