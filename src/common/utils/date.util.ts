/**
 * Get the current date in ISO format
 */
export const getCurrentIsoDate = (): string => {
  return new Date().toISOString();
};

/**
 * Add days to a given date
 */
export const addDaysToDate = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add minutes to a given date
 */
export const addMinutesToDate = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

/**
 * Check if a date is in the past
 */
export const isDateInPast = (date: Date): boolean => {
  return new Date() > date;
};
