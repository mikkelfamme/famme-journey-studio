import en from './locales/en.json';
import da from './locales/da.json';
import { useWorkspace } from '../store/WorkspaceContext';
import type { AppLanguage, FunnelStage, JourneyNodeType, JourneyStatus } from '../types/domain';

const dictionaries: Record<AppLanguage, Record<string, string>> = { en, da };

export function translate(language: AppLanguage, key: string, fallback?: string) {
  return dictionaries[language]?.[key] ?? dictionaries.en[key] ?? fallback ?? key;
}

export function useI18n() {
  const { workspace } = useWorkspace();
  const language: AppLanguage = workspace?.settings.language ?? 'en';
  return {
    language,
    t: (key: string, fallback?: string) => translate(language, key, fallback),
    nodeType: (type: JourneyNodeType) => translate(language, `node.${type}`, type),
    stage: (stage: FunnelStage) => translate(language, `stage.${stage}`, stage),
    status: (status: JourneyStatus) => translate(language, `status.${status}`, status)
  };
}
