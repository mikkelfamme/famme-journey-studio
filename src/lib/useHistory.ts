import { useCallback, useState, type SetStateAction } from 'react';
import { createHistory, pushHistory, redoHistory, undoHistory, type HistoryState } from './history';

export function useHistoryState<T>(initial: T) {
  const [history, setHistory] = useState<HistoryState<T>>(() => createHistory(initial));
  const set = useCallback((action: SetStateAction<T>) => {
    setHistory(current => {
      const next = typeof action === 'function' ? (action as (value: T) => T)(current.present) : action;
      if (Object.is(next, current.present)) return current;
      return pushHistory(current, next);
    });
  }, []);
  const setTransient = useCallback((action: SetStateAction<T>) => {
    setHistory(current => {
      const next = typeof action === 'function' ? (action as (value: T) => T)(current.present) : action;
      return { ...current, present: next };
    });
  }, []);
  const undo = useCallback(() => setHistory(undoHistory), []);
  const redo = useCallback(() => setHistory(redoHistory), []);
  const reset = useCallback((value: T) => setHistory(createHistory(value)), []);
  return { value: history.present, set, setTransient, undo, redo, reset, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
