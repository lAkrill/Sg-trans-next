const UPCOMING_REPAIR_CELL_CLASS = "bg-pink-200/80 dark:bg-pink-900/60";
const OVERDUE_REPAIR_CELL_CLASS = "bg-red-700 text-white dark:bg-red-950 dark:text-white";

function parseLocalDate(value: string | undefined): Date | null {
  if (!value) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addOneCalendarMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const lastDayOfNextMonth = new Date(year, month + 2, 0).getDate();

  return new Date(year, month + 1, Math.min(day, lastDayOfNextMonth));
}

export function isWithinNextCalendarMonth(value: string | undefined): boolean {
  const target = parseLocalDate(value);
  if (!target) return false;

  const today = startOfLocalDay(new Date());
  const targetDay = startOfLocalDay(target);
  const nextMonth = addOneCalendarMonth(today);

  return targetDay >= today && targetDay <= nextMonth;
}

export function isOverduePlannedRepairDate(value: string | undefined): boolean {
  const target = parseLocalDate(value);
  if (!target) return false;

  const today = startOfLocalDay(new Date());
  const targetDay = startOfLocalDay(target);

  return targetDay < today;
}

export function getUpcomingRepairCellClass(value: string | undefined): string | undefined {
  return isWithinNextCalendarMonth(value) ? UPCOMING_REPAIR_CELL_CLASS : undefined;
}

export function getPlannedRepairCellClass(value: string | undefined): string | undefined {
  if (isOverduePlannedRepairDate(value)) return OVERDUE_REPAIR_CELL_CLASS;
  return getUpcomingRepairCellClass(value);
}
