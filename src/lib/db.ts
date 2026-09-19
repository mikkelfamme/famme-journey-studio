import { openDB } from 'idb';
import type { Workspace } from '../types/domain';
import { normalizeWorkspace } from './migrate';

const DB_NAME = 'famme-journey-studio';
const WORKSPACE_STORE = 'workspace';
const RECOVERY_STORE = 'recovery';
const KEY = 'active';
const RECOVERY_LIMIT = 5;

export interface RecoverySnapshot {
  key: string;
  createdAt: string;
  workspace: Workspace;
}

const dbPromise = openDB(DB_NAME, 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(WORKSPACE_STORE)) db.createObjectStore(WORKSPACE_STORE);
    if (!db.objectStoreNames.contains(RECOVERY_STORE)) db.createObjectStore(RECOVERY_STORE);
  }
});

export async function loadWorkspace(): Promise<Workspace | null> {
  const workspace = (await (await dbPromise).get(WORKSPACE_STORE, KEY)) as Workspace | undefined;
  return workspace ? normalizeWorkspace(workspace) : null;
}

async function addRecoverySnapshot(workspace: Workspace): Promise<void> {
  const db = await dbPromise;
  const key = `${Date.now()}-${workspace.id}`;
  await db.put(RECOVERY_STORE, { key, createdAt: new Date().toISOString(), workspace: structuredClone(workspace) } satisfies RecoverySnapshot, key);
  const keys = (await db.getAllKeys(RECOVERY_STORE)).map(String).sort().reverse();
  await Promise.all(keys.slice(RECOVERY_LIMIT).map(oldKey => db.delete(RECOVERY_STORE, oldKey)));
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const db = await dbPromise;
  const previous = (await db.get(WORKSPACE_STORE, KEY)) as Workspace | undefined;
  if (previous && previous.updatedAt !== workspace.updatedAt) await addRecoverySnapshot(previous);
  await db.put(WORKSPACE_STORE, workspace, KEY);
}

export async function listRecoverySnapshots(): Promise<RecoverySnapshot[]> {
  const db = await dbPromise;
  const rows = await db.getAll(RECOVERY_STORE) as RecoverySnapshot[];
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function restoreRecoverySnapshot(key: string): Promise<Workspace | null> {
  const db = await dbPromise;
  const row = await db.get(RECOVERY_STORE, key) as RecoverySnapshot | undefined;
  if (!row?.workspace) return null;
  const normalized = normalizeWorkspace(row.workspace);
  await db.put(WORKSPACE_STORE, normalized, KEY);
  return normalized;
}

export async function restoreLatestRecovery(): Promise<Workspace | null> {
  const snapshots = await listRecoverySnapshots();
  return snapshots[0] ? restoreRecoverySnapshot(snapshots[0].key) : null;
}

export async function clearRecoverySnapshots(): Promise<void> {
  await (await dbPromise).clear(RECOVERY_STORE);
}

export async function clearWorkspace(): Promise<void> {
  await (await dbPromise).delete(WORKSPACE_STORE, KEY);
}
