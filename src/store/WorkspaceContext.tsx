import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Journey, Workspace } from '../types/domain';
import { clearWorkspace, loadWorkspace, saveWorkspace } from '../lib/db';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface WorkspaceContextValue {
  workspace: Workspace | null;
  loading: boolean;
  saveState: SaveState;
  lastSavedAt?: string;
  saveError?: string;
  setWorkspace: (workspace: Workspace | null) => void;
  updateWorkspace: (updater: (workspace: Workspace) => Workspace) => void;
  updateJourney: (journey: Journey) => void;
  saveNow: () => Promise<void>;
  resetWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const saveTimer = useRef<number | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);

  useEffect(() => {
    loadWorkspace().then(ws => {
      workspaceRef.current = ws;
      setWorkspaceState(ws);
      setLoading(false);
      if (ws) {
        setSaveState('saved');
        setLastSavedAt(ws.updatedAt);
      }
    }).catch(error => {
      setLoading(false);
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Could not load the local workspace.');
    });
  }, []);

  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);

  const persist = useCallback(async (target?: Workspace | null) => {
    const current = target ?? workspaceRef.current;
    if (!current) return;
    setSaveState('saving');
    setSaveError(undefined);
    try {
      await saveWorkspace(current);
      const stamp = new Date().toISOString();
      setSaveState('saved');
      setLastSavedAt(stamp);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Autosave failed.');
      return;
    }
  }, []);

  useEffect(() => {
    if (loading || !workspace) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = window.setTimeout(() => { void persist(workspace).catch(() => undefined); }, 450);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [workspace, loading, persist]);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'hidden' && workspaceRef.current) void persist(workspaceRef.current).catch(() => undefined);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [persist]);

  const setWorkspace = useCallback((ws: Workspace | null) => {
    workspaceRef.current = ws;
    setWorkspaceState(ws);
    setSaveState(ws ? 'saving' : 'idle');
  }, []);
  const updateWorkspace = useCallback((updater: (workspace: Workspace) => Workspace) => {
    setWorkspaceState(current => current ? { ...updater(current), updatedAt: new Date().toISOString() } : current);
  }, []);
  const updateJourney = useCallback((journey: Journey) => {
    updateWorkspace(ws => ({ ...ws, journeys: ws.journeys.map(j => j.id === journey.id ? { ...journey, updatedAt: new Date().toISOString() } : j) }));
  }, [updateWorkspace]);
  const saveNow = useCallback(async () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await persist(workspaceRef.current);
  }, [persist]);
  const resetWorkspace = useCallback(async () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await clearWorkspace();
    workspaceRef.current = null;
    setWorkspaceState(null);
    setSaveState('idle');
    setLastSavedAt(undefined);
    setSaveError(undefined);
  }, []);

  const value = useMemo(() => ({ workspace, loading, saveState, lastSavedAt, saveError, setWorkspace, updateWorkspace, updateJourney, saveNow, resetWorkspace }), [workspace, loading, saveState, lastSavedAt, saveError, setWorkspace, updateWorkspace, updateJourney, saveNow, resetWorkspace]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
