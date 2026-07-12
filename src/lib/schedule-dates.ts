import { isBefore, startOfDay } from 'date-fns'
import { Schedule } from '@/types'

export function isPastSchedule(schedule: Pick<Schedule, 'date'>): boolean {
  return isBefore(startOfDay(new Date(schedule.date)), startOfDay(new Date()))
}

/** Schedules already come sorted by date ascending from the store; this just drops past ones. */
export function getUpcomingSchedules(schedules: Schedule[]): Schedule[] {
  return schedules.filter((s) => !isPastSchedule(s))
}
