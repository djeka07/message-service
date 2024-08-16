export const isEmpty = <T>(arr: T[]): boolean => !arr || arr.length === 0;

export const difference = <T>(arrOne: T[], arrTwo: T[]): T[] => {
  if (isEmpty(arrOne)) return [];
  if (isEmpty(arrTwo)) return arrOne;
  const arrOneSet = new Set(arrOne);
  const arrTwoSet = new Set(arrTwo);
  return [...new Set([...arrOneSet].filter((x) => !arrTwoSet.has(x)))];
};

export const unique = <T>(arr: T[], property: string | null = null): T[] => {
  if (isEmpty(arr)) return [];
  if (!property) return [...new Set(arr)] as T[];

  const result: T[] = [];
  const map = new Map();
  for (const item of arr) {
    if (!map.has(item[property])) {
      map.set(item[property], true);
      result.push(item);
    }
  }
  return result;
};
