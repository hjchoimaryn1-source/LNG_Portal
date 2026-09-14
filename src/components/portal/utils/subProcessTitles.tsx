// src/components/portal/utils/subProcessTitles.tsx
import type { SubProcessTitleEntry } from './subProcessTitleTypes';
import { SUBPROCESS_TITLES_MANPOWER_SAFETY } from './subProcessTitlesManpowerSafety';
import { SUBPROCESS_TITLES_LNG_PROCESS } from './subProcessTitlesLngProcess';
import { SUBPROCESS_TITLES_TRUCKING } from './subProcessTitlesTrucking';
import { SUBPROCESS_TITLES_ENVIRONMENT } from './subProcessTitlesEnvironment';

export type { SubProcessTitleEntry };

export const SUBPROCESS_TITLES: Record<string, SubProcessTitleEntry> = {
  ...SUBPROCESS_TITLES_MANPOWER_SAFETY,
  ...SUBPROCESS_TITLES_LNG_PROCESS,
  ...SUBPROCESS_TITLES_TRUCKING,
  ...SUBPROCESS_TITLES_ENVIRONMENT,
};
