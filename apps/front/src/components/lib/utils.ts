import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(str?: string) {
  if (str === '' || !str) return str;
  return `${str[0].toLocaleUpperCase()}${str.slice(1)}`;
}
