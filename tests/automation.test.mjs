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

test('oficiální data mají denní plán i ruční spuštění', () => {
  assert.match(officialWorkflow, /schedule:/);
  assert.match(officialWorkflow, /workflow_dispatch:/);
  assert.match(officialWorkflow, /date -u \+%Y/);
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
  assert.match(serviceWorker, /boka-water-quality-mvp-v6/);
});
