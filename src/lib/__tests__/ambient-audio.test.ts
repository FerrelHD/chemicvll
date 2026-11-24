import assert from 'node:assert/strict';
import { ambientAudio, AMBIENT_MODES, isAmbientMode } from '../ambient-audio';

console.log('Testing Ambient Soundscape Engine...');

assert.deepEqual(AMBIENT_MODES, ['off', 'lofi', 'brown', 'rain']);
assert.equal(isAmbientMode('brown'), true);
assert.equal(isAmbientMode('invalid'), false);

// Safe no-op in headless Node runtime without crashing
ambientAudio.setMode('rain');
assert.equal(ambientAudio.getMode(), 'rain');
ambientAudio.stop();
assert.equal(ambientAudio.getMode(), 'off');

console.log('All Ambient Soundscape Engine tests passed!');
