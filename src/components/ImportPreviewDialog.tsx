import { AlertTriangle, Database, FileInput, X } from 'lucide-react';
import type { StudioImport, StudioImportPreview } from '../lib/files';

export function ImportPreviewDialog({ imported, preview, onConfirm, onCancel }: { imported: StudioImport; preview: StudioImportPreview; onConfirm: (imported: StudioImport) => void; onCancel: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="modal-card import-preview-card" role="dialog" aria-modal="true" aria-labelledby="import-preview-title">
        <div className="modal-header">
          <div className="modal-icon"><FileInput size={20}/></div>
          <div><h2 id="import-preview-title">{preview.title}</h2><p>{preview.subtitle}</p></div>
          <button className="icon-button" onClick={onCancel} aria-label="Close import preview"><X size={17}/></button>
        </div>
        {preview.replacesWorkspace && <div className="warning-callout"><AlertTriangle size={17}/><div><strong>This replaces the active workspace.</strong><span>Autosave recovery keeps recent local snapshots, but export the current workspace first if you need a portable backup.</span></div></div>}
        <div className="preview-grid">
          {preview.rows.map(row => <div className="preview-row" key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}
        </div>
        {preview.migrationReport && <div className="migration-report"><div className="card-heading-row"><div><h3>Migration report</h3><p>Legacy data will be normalized into the 2.0 model before import.</p></div><span className="chip">{preview.migrationReport.reviewItems} review</span></div><div className="migration-stats"><span>{preview.migrationReport.journeys} journeys</span><span>{preview.migrationReport.nodes} nodes</span><span>{preview.migrationReport.edges} connections</span><span>{preview.migrationReport.tracking} tracking</span><span>{preview.migrationReport.creatives} creatives</span><span>{preview.migrationReport.crossJourneyLinks} handoffs</span></div></div>}
        {preview.warnings.length > 0 && <div className="preview-warnings"><strong>Review after import</strong><ul>{preview.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></div>}
        <div className="modal-actions"><button className="button" onClick={onCancel}>Cancel</button><button className="button primary" onClick={() => onConfirm(imported)}><Database size={15}/> {preview.replacesWorkspace ? 'Import & replace' : 'Import data'}</button></div>
      </section>
    </div>
  );
}
