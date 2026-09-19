import { describe, expect, it } from 'vitest';
import { createHistory, pushHistory, redoHistory, undoHistory } from './history';

describe('editor history', () => {
  it('supports undo and redo without mutating the current value', () => {
    let state = createHistory({ value: 1 });
    state = pushHistory(state, { value: 2 });
    state = pushHistory(state, { value: 3 });
    state = undoHistory(state);
    expect(state.present.value).toBe(2);
    state = redoHistory(state);
    expect(state.present.value).toBe(3);
  });
});
