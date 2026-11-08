import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areas, distance, places, recommendations, randomPlace } from '../src/planner';
import { emptySchedule, forStorage, newDraft, rankPlaces, samplePlaces, scheduleError } from '../src/model';

test('distance is zero at origin and about 111 km per latitude degree', () => {
  assert.equal(distance(areas[0], areas[0]), 0);
  assert.ok(Math.abs(distance({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 }) - 111.195) < 0.01);
});
test('planned and quick searches enforce 3 km and 5 km radii', () => {
  for (const area of areas) {
    const planned = recommendations(area, 3, []);
    const quick = recommendations(area, 5, []);
    assert.ok(planned.length >= 5);
    assert.ok(quick.length > planned.length);
    assert.ok(planned.every(p => distance(area, p) <= 3));
    assert.ok(quick.every(p => distance(area, p) <= 5));
  }
  assert.equal(recommendations({ latitude: 0, longitude: 0 }, 5, []).length, 0);
});
test('shared interests rank ahead of a single person’s interests', () => {
  const result = recommendations(areas[0], 3, [
    { id: 1, name: 'A', interests: ['Coffee', 'Food'] },
    { id: 2, name: 'B', interests: ['Coffee'] },
  ]);
  assert.equal(result[0].category, 'Coffee');
});
test('shuffle excludes chosen stops and current place, and handles exhaustion', () => {
  const chosen: string[] = [];
  for (let i = 0; i < 5; i++) {
    const p = randomPlace(places, chosen, undefined, () => 0);
    assert.ok(p); chosen.push(p.id);
  }
  assert.equal(new Set(chosen).size, 5);
  assert.notEqual(randomPlace(places, chosen, places[5].id, () => 0)?.id, places[5].id);
  assert.equal(randomPlace(places, places.map(p => p.id)), undefined);
});

test('free-form interests rank a shared match above individual matches', () => {
  const ranked = rankPlaces(samplePlaces, areas[0], 3, [
    { id: 'a', name: 'A', interests: ['coffee', 'Art'] },
    { id: 'b', name: 'B', interests: ['Coffee', 'Japanese Food'] },
  ]);
  assert.equal(ranked[0].category, 'Cafe');
  assert.ok(ranked.findIndex(p => p.category === 'Activity') < ranked.findIndex(p => p.category === 'Outdoor'));
});

test('schedule validates optional, impossible and out-of-order times', () => {
  assert.equal(scheduleError(emptySchedule, false), '');
  assert.notEqual(scheduleError(emptySchedule, true), '');
  const schedule = { ...emptySchedule, scheduledDate: '2026-02-28', startTime: '18:00', endTime: '20:00' };
  assert.equal(scheduleError(schedule, true), '');
  assert.notEqual(scheduleError({ ...schedule, scheduledDate: '2026-02-30' }, true), '');
  assert.notEqual(scheduleError({ ...schedule, endTime: '17:00' }, true), '');
  assert.notEqual(scheduleError({ ...schedule, timezone: 'Fake/City' }, true), '');
});

test('saved Google plans keep place IDs and user itinerary without venue content', () => {
  const destination = { ...samplePlaces[0], google: true, arrivalTime: '19:30', photoUrl: 'https://example.com/photo' };
  const saved = forStorage({
    ...newDraft('plan_ahead'), id: 'plan', name: 'Date', status: 'planned',
    createdAt: '2026-11-08', updatedAt: '2026-11-08',
    location: { ...areas[0], placeId: 'area' }, destinations: [destination],
  });
  assert.equal(saved.location?.placeId, 'area');
  assert.equal(saved.destinations[0].placeId, destination.placeId);
  assert.equal(saved.destinations[0].arrivalTime, '19:30');
  assert.equal(saved.destinations[0].photoUrl, undefined);
  assert.notEqual(saved.destinations[0].name, destination.name);
});
