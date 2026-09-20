import { useI18n } from '../../i18n';
import { STAGE_NODE_X, stageScreenBoundaries, type CanvasViewport } from '../../lib/stageGeometry';

export function StageBackdrop({ viewport }: { viewport: CanvasViewport }) {
  const { t } = useI18n();
  const [b1, b2, b3] = stageScreenBoundaries(viewport);
  const labelX = (worldX: number) => viewport.x + worldX * viewport.zoom;

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
