import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const japaneseNumericCollator = new Intl.Collator('ja-JP', { numeric: true });

export const compareJapaneseNumeric = japaneseNumericCollator.compare;
