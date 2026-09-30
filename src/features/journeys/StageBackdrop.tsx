import type { FunnelOrientation } from '../../types/domain';
import { useI18n } from '../../i18n';
import { STAGE_NODE_X, STAGE_NODE_Y, stageScreenBoundaries, type CanvasViewport } from '../../lib/stageGeometry';

export function StageBackdrop({ viewport, orientation = 'horizontal' }: { viewport: CanvasViewport; orientation?: FunnelOrientation }) {
  const { t } = useI18n();
  const [b1, b2, b3] = stageScreenBoundaries(viewport, orientation);
  const labelX = (worldX: number) => viewport.x + worldX * viewport.zoom;
  const labelY = (worldY: number) => viewport.y + worldY * viewport.zoom;

  if (orientation === 'vertical') return <div className="stage-backdrop stage-backdrop-vertical" aria-hidden="true">
    <span className="stage-backdrop-fill stage-backdrop-fill-top" style={{ top: 0, bottom: `calc(100% - ${b1}px)` }}/>
    <span className="stage-backdrop-fill stage-backdrop-fill-middle" style={{ top: b1, bottom: `calc(100% - ${b2}px)` }}/>
    <span className="stage-backdrop-fill stage-backdrop-fill-bottom" style={{ top: b2, bottom: `calc(100% - ${b3}px)` }}/>
    <span className="stage-backdrop-fill stage-backdrop-fill-lifecycle" style={{ top: b3, bottom: 0 }}/>
    <span className="stage-backdrop-separator" style={{ top: b1 }}/>
    <span className="stage-backdrop-separator" style={{ top: b2 }}/>
    <span className="stage-backdrop-separator" style={{ top: b3 }}/>
    <span className="stage-backdrop-label stage-backdrop-label-top" style={{ top: labelY(STAGE_NODE_Y.top - 54), left: 14 }}>{t('stage.topLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-middle" style={{ top: labelY(STAGE_NODE_Y.middle - 54), left: 14 }}>{t('stage.middleLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-bottom" style={{ top: labelY(STAGE_NODE_Y.bottom - 54), left: 14 }}>{t('stage.bottomLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-lifecycle" style={{ top: labelY(STAGE_NODE_Y.lifecycle - 54), left: 14 }}>{t('stage.lifecycleLong')}</span>
  </div>;

  return <div className="stage-backdrop" aria-hidden="true">
    <span className="stage-backdrop-fill stage-backdrop-fill-top" style={{ left: 0, right: `calc(100% - ${b1}px)` }}/>
    <span className="stage-backdrop-fill stage-backdrop-fill-middle" style={{ left: b1, right: `calc(100% - ${b2}px)` }}/>
    <span className="stage-backdrop-fill stage-backdrop-fill-bottom" style={{ left: b2, right: `calc(100% - ${b3}px)` }}/>
    <span className="stage-backdrop-fill stage-backdrop-fill-lifecycle" style={{ left: b3, right: 0 }}/>
    <span className="stage-backdrop-separator" style={{ left: b1 }}/>
    <span className="stage-backdrop-separator" style={{ left: b2 }}/>
    <span className="stage-backdrop-separator" style={{ left: b3 }}/>
    <span className="stage-backdrop-label stage-backdrop-label-top" style={{ left: labelX(STAGE_NODE_X.top - 65) }}>{t('stage.topLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-middle" style={{ left: labelX(STAGE_NODE_X.middle - 24) }}>{t('stage.middleLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-bottom" style={{ left: labelX(STAGE_NODE_X.bottom - 24) }}>{t('stage.bottomLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-lifecycle" style={{ left: labelX(STAGE_NODE_X.lifecycle - 24) }}>{t('stage.lifecycleLong')}</span>
  </div>;
}
