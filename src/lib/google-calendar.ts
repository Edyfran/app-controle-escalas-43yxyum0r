import { format } from 'date-fns'

const DEFAULT_DURATION_MS = 60 * 60 * 1000 // 1h, typical Mass length

/** Combines the schedule's calendar day with its separately-entered time-of-day string. */
export function getScheduleStart(schedule: { date: string; time: string }): Date {
  const dayStr = format(new Date(schedule.date), 'yyyy-MM-dd')
  return new Date(`${dayStr}T${schedule.time}:00`)
}

function toGoogleDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function buildGoogleCalendarUrl(
  schedule: { title: string; date: string; time: string },
  details?: string,
): string {
  const start = getScheduleStart(schedule)
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: schedule.title,
    dates: `${toGoogleDateUTC(start)}/${toGoogleDateUTC(end)}`,
  })
  if (details) params.set('details', details)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
