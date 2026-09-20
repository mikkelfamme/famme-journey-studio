import type { CSSProperties } from 'react';
import { useI18n } from '../../i18n';
import { STAGE_NODE_X, stageScreenBoundaries, type CanvasViewport } from '../../lib/stageGeometry';

export function StageBackdrop({ viewport }: { viewport: CanvasViewport }) {
  const { t } = useI18n();
  const [b1, b2, b3] = stageScreenBoundaries(viewport);
  const labelX = (worldX: number) => viewport.x + worldX * viewport.zoom;

  const style: CSSProperties = {
    background: `linear-gradient(90deg,
      rgba(78, 99, 210, .105) 0px,
      rgba(78, 99, 210, .105) ${b1}px,
      rgba(70, 125, 153, .095) ${b1}px,
      rgba(70, 125, 153, .095) ${b2}px,
      rgba(48, 137, 104, .095) ${b2}px,
      rgba(48, 137, 104, .095) ${b3}px,
      rgba(177, 128, 38, .105) ${b3}px,
      rgba(177, 128, 38, .105) 100%)`
  };

  return <div className="stage-backdrop" style={style} aria-hidden="true">
    <span className="stage-backdrop-separator" style={{ left: b1 }}/>
    <span className="stage-backdrop-separator" style={{ left: b2 }}/>
    <span className="stage-backdrop-separator" style={{ left: b3 }}/>
    <span className="stage-backdrop-label stage-backdrop-label-top" style={{ left: Math.max(12, labelX(STAGE_NODE_X.top - 65)) }}>{t('stage.topLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-middle" style={{ left: labelX(STAGE_NODE_X.middle - 24) }}>{t('stage.middleLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-bottom" style={{ left: labelX(STAGE_NODE_X.bottom - 24) }}>{t('stage.bottomLong')}</span>
    <span className="stage-backdrop-label stage-backdrop-label-lifecycle" style={{ left: labelX(STAGE_NODE_X.lifecycle - 24) }}>{t('stage.lifecycleLong')}</span>
  </div>;
}
