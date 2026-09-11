// src/components/portal/utils/manpowerTabConstants.ts
import { SubProcessKey } from '../../../types/lng';

export type ManpowerTabKey = 'OVERVIEW' | 'DAILY_SHIFT_BOARD' | 'MONTHLY_GRID' | 'ROTATION_TRACKER' | 'TRAINING_MATRIX';

export const MANPOWER_TAB_LABELS: Record<ManpowerTabKey, string> = {
  OVERVIEW: 'Overview',
  DAILY_SHIFT_BOARD: 'Daily Board',
  MONTHLY_GRID: 'Monthly Plan',
  ROTATION_TRACKER: 'Rotation',
  TRAINING_MATRIX: 'Training Matrix',
};

export const MANPOWER_TAB_KEY_MAP: Record<ManpowerTabKey, SubProcessKey> = {
  OVERVIEW: 'MANPOWER_DAILY_SHIFT',
  DAILY_SHIFT_BOARD: 'MANPOWER_SHIFT_ROSTER',
  MONTHLY_GRID: 'MANPOWER_MONTHLY_GRID',
  ROTATION_TRACKER: 'MANPOWER_ROTATION_TRACKER',
  TRAINING_MATRIX: 'MANPOWER_TRAINING_MATRIX',
};

export const NORMALIZE_MANPOWER_TAB = (value: string | undefined): ManpowerTabKey => {
  switch (value) {
    case 'DAILY_SHIFT_BOARD':
      return 'DAILY_SHIFT_BOARD';
    case 'MONTHLY_GRID':
      return 'MONTHLY_GRID';
    case 'ROTATION_TRACKER':
      return 'ROTATION_TRACKER';
    case 'TRAINING_MATRIX':
      return 'TRAINING_MATRIX';
    case 'OVERVIEW':
    default:
      return 'OVERVIEW';
  }
};
