import { useState, useMemo } from 'react';

export const DEFAULT_INSPECTION_DATES = [
  '2026-08-01',
  '2026-08-02',
  '2026-08-03',
  '2026-08-04',
  '2026-08-05',
  '2026-08-06',
  '2026-08-07',
  '2026-08-08',
  '2026-08-09',
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
];

export interface CalendarDay {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  hasData: boolean;
  isSelected: boolean;
  isToday: boolean;
}

export interface UseNiasCalendarOptions {
  selectedDate?: string;
  inspectionDates?: string[];
  initialViewDate?: Date;
}

export function useNiasCalendar(options: UseNiasCalendarOptions = {}) {
  const {
    selectedDate = '2026-08-13',
    inspectionDates = DEFAULT_INSPECTION_DATES,
    initialViewDate,
  } = options;

  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(
    () => initialViewDate || new Date(2026, 7, 1) // August 2026
  );

  const calYear = calendarViewDate.getFullYear();
  const calMonth = calendarViewDate.getMonth(); // 0-indexed (7 = August)

  const monthNames = [
    'January (1월)', 'February (2월)', 'March (3월)', 'April (4월)',
    'May (5월)', 'June (6월)', 'July (7월)', 'August (8월)',
    'September (9월)', 'October (10월)', 'November (11월)', 'December (12월)'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar month days calculation for 7-column grid
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const days: CalendarDay[] = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = calMonth === 0 ? 12 : calMonth;
      const prevY = calMonth === 0 ? calYear - 1 : calYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        hasData: inspectionDates.includes(dateStr),
        isSelected: selectedDate === dateStr,
        isToday: dateStr === '2026-08-13',
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        hasData: inspectionDates.includes(dateStr),
        isSelected: selectedDate === dateStr,
        isToday: dateStr === '2026-08-13',
      });
    }

    // Next month padding to complete 7-day rows
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = calMonth === 11 ? 1 : calMonth + 2;
      const nextY = calMonth === 11 ? calYear + 1 : calYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        hasData: inspectionDates.includes(dateStr),
        isSelected: selectedDate === dateStr,
        isToday: dateStr === '2026-08-13',
      });
    }

    return days;
  }, [calYear, calMonth, selectedDate, inspectionDates]);

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth + 1, 1));
  };

  return {
    isCalendarOpen,
    setIsCalendarOpen,
    calendarViewDate,
    setCalendarViewDate,
    calYear,
    calMonth,
    monthNames,
    weekdayNames,
    calendarDays,
    handlePrevMonth,
    handleNextMonth,
  };
}

export default useNiasCalendar;
