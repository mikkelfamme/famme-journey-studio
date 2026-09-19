import { RotateCcw, Save, Trash2 } from 'lucide-react';
import type { Journey, JourneyVersion } from '../../types/domain';
import { diffVersion } from '../../lib/versions';

export function VersionsPanel({ journey, onSaveVersion, onRestore, onDelete }: { journey: Journey; onSaveVersion: () => void; onRestore: (version: JourneyVersion) => void; onDelete: (versionId: string) => void }) {
  return <aside className="editor-panel inspector-special">
    <div className="panel-heading">Version history</div>
    <button className="button full" onClick={onSaveVersion}><Save size={14}/> Save current version</button>
    <p className="muted-small">Versions are snapshots inside the workspace file. Compare them with the current draft before restoring.</p>
    <div className="version-list">
      {journey.versions.length === 0 && <div className="empty-mini">No versions saved yet.</div>}
      {[...journey.versions].reverse().map(version => <VersionCard key={version.id} journey={journey} version={version} onRestore={onRestore} onDelete={onDelete}/>) }
    </div>
  </aside>;
}

function VersionCard({ journey, version, onRestore, onDelete }: { journey: Journey; version: JourneyVersion; onRestore: (version: JourneyVersion) => void; onDelete: (versionId: string) => void }) {
  const diff = diffVersion(journey, version);
  return <div className="version-card">
    <div className="definition-card-head"><div><strong>{version.label}</strong><small>{new Date(version.createdAt).toLocaleString()}</small></div><button className="mini-icon danger-icon" onClick={() => onDelete(version.id)}><Trash2 size={13}/></button></div>
    {version.note && <p>{version.note}</p>}
    <div className="diff-grid"><span>Nodes <strong>+{diff.addedNodes.length} / -{diff.removedNodes.length} / ~{diff.changedNodes.length}</strong></span><span>Edges <strong>{diff.edgeDelta >= 0 ? '+' : ''}{diff.edgeDelta}</strong></span><span>Tracking <strong>{diff.trackingDelta >= 0 ? '+' : ''}{diff.trackingDelta}</strong></span><span>Creatives <strong>{diff.creativeDelta >= 0 ? '+' : ''}{diff.creativeDelta}</strong></span></div>
    {(diff.addedNodes.length + diff.removedNodes.length + diff.changedNodes.length) > 0 && <div className="diff-lines">{diff.addedNodes.slice(0,3).map(x => <span key={`a-${x}`}>+ {x}</span>)}{diff.removedNodes.slice(0,3).map(x => <span key={`r-${x}`}>- {x}</span>)}{diff.changedNodes.slice(0,3).map(x => <span key={`c-${x}`}>~ {x}</span>)}</div>}
    <button className="button compact" onClick={() => onRestore(version)}><RotateCcw size={12}/> Restore</button>
  </div>;
}
