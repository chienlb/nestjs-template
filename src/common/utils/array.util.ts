/**
 * Group an array of objects by a specific key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce(
    (result, currentValue) => {
      const groupKey = String(currentValue[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(currentValue);
      return result;
    },
    {} as Record<string, T[]>,
  );
};

/**
 * Remove duplicate primitive items from an array
 */
export const uniqueArray = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Remove duplicates from an array of objects based on a key
 */
export const uniqueArrayByKey = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter((item) => {
    const itemKey = item[key];
    if (seen.has(itemKey)) {
      return false;
    }
    seen.add(itemKey);
    return true;
  });
};
