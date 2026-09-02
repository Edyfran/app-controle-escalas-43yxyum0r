import { isBefore, startOfDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { Schedule } from '@/types'

export function isPastSchedule(schedule: Pick<Schedule, 'date'>): boolean {
  return isBefore(startOfDay(new Date(schedule.date)), startOfDay(new Date()))
}

/** Schedules already come sorted by date ascending from the store; this just drops past ones. */
export function getUpcomingSchedules(schedules: Schedule[]): Schedule[] {
  return schedules.filter((s) => !isPastSchedule(s))
}

/** Schedules whose date falls within the current calendar week (Sunday–Saturday). */
export function getSchedulesThisWeek(schedules: Schedule[]): Schedule[] {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 0 })
  const end = endOfWeek(now, { weekStartsOn: 0 })
  return schedules.filter((s) => isWithinInterval(new Date(s.date), { start, end }))
}
