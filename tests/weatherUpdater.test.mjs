import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBatches,
  degreesToCardinal,
  fetchWithRetry,
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

test('krátký síťový výpadek se automaticky zopakuje', async () => {
  let calls = 0;
  const waits = [];
  const response = await fetchWithRetry('https://example.test', {}, {
    attempts: 3,
    delaysMs: [10, 20],
    fetchImpl: async () => {
      calls += 1;
      if (calls < 3) throw new Error('fetch failed');
      return { ok: true, status: 200 };
    },
    sleepImpl: async (milliseconds) => waits.push(milliseconds)
  });

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [10, 20]);
});

test('chyby serveru se opakují, ale trvalá klientská chyba ne', async () => {
  let serverCalls = 0;
  await assert.rejects(
    fetchWithRetry('https://example.test', {}, {
      attempts: 2,
      delaysMs: [0],
      fetchImpl: async () => {
        serverCalls += 1;
        return { ok: false, status: 503, statusText: 'Service Unavailable' };
      },
      sleepImpl: async () => {}
    }),
    /nedostupné po 2 pokusech/
  );
  assert.equal(serverCalls, 2);

  let clientCalls = 0;
  const clientError = await fetchWithRetry('https://example.test', {}, {
    attempts: 3,
    fetchImpl: async () => {
      clientCalls += 1;
      return { ok: false, status: 400, statusText: 'Bad Request' };
    },
    sleepImpl: async () => {}
  });
  assert.equal(clientError.status, 400);
  assert.equal(clientCalls, 1);
});
