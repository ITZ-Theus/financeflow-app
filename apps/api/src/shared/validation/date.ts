import { z } from 'zod'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Accepts only real calendar dates in YYYY-MM-DD (rejects 2026-02-30, 2026-13-01, 2026-1-1).
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

export const isoDateSchema = z.string().refine(isIsoDate, {
  message: 'Use uma data valida no formato YYYY-MM-DD',
})
