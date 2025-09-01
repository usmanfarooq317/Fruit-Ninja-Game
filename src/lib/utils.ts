// File: src/lib/utils.ts
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

type ClassValue = string | number | boolean | undefined | null | ClassValue[] | { [key: string]: any };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}