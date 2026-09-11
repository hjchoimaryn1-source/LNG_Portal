// src/components/portal/utils/subProcessTitles.tsx
import type { SubProcessTitleEntry } from './subProcessTitleTypes';
import { SUBPROCESS_TITLES_MANPOWER_SAFETY } from './subProcessTitlesManpowerSafety';
import { SUBPROCESS_TITLES_LNG_PROCESS } from './subProcessTitlesLngProcess';

export type { SubProcessTitleEntry };

export const SUBPROCESS_TITLES: Record<string, SubProcessTitleEntry> = {
  ...SUBPROCESS_TITLES_MANPOWER_SAFETY,
  ...SUBPROCESS_TITLES_LNG_PROCESS,
};
