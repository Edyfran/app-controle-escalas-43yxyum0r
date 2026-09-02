import { describe, it, expect, vi, afterEach } from 'vitest'
import { isPastSchedule, getUpcomingSchedules, getSchedulesThisWeek } from './schedule-dates'
import { Schedule } from '@/types'

function makeSchedule(date: string): Schedule {
  return {
    id: 'x',
    title: 'Missa',
    date,
    time: '10:00',
    status: 'Pendente',
    assignments: [],
    leitor1: null,
    leitor1Status: 'Pendente',
    leitor2: null,
    leitor2Status: 'Pendente',
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('isPastSchedule', () => {
  it('treats yesterday as past and today/tomorrow as not past, ignoring time-of-day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-07T12:00:00'))

    expect(isPastSchedule(makeSchedule('2026-07-06T23:00:00'))).toBe(true)
    expect(isPastSchedule(makeSchedule('2026-07-07T00:00:00'))).toBe(false)
    expect(isPastSchedule(makeSchedule('2026-07-07T23:59:00'))).toBe(false)
    expect(isPastSchedule(makeSchedule('2026-07-08T00:00:00'))).toBe(false)
  })
})

describe('getUpcomingSchedules', () => {
  it('drops past schedules and keeps today/future ones in order', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-07T12:00:00'))

    const past = makeSchedule('2026-07-01T10:00:00')
    const today = makeSchedule('2026-07-07T10:00:00')
    const future = makeSchedule('2026-07-10T10:00:00')

    expect(getUpcomingSchedules([past, today, future])).toEqual([today, future])
  })

  it('returns an empty array when everything is in the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-07T12:00:00'))

    expect(getUpcomingSchedules([makeSchedule('2026-01-01T10:00:00')])).toEqual([])
  })
})

describe('getSchedulesThisWeek', () => {
  // "Now" is Tuesday 2026-07-07 — the containing week runs Sun 2026-07-05 to Sat 2026-07-11.
  it('keeps only schedules within the current Sunday-to-Saturday week, past or future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-07T12:00:00'))

    const lastSaturday = makeSchedule('2026-07-04T23:00:00')
    const thisSunday = makeSchedule('2026-07-05T08:00:00')
    const today = makeSchedule('2026-07-07T10:00:00')
    const thisSaturdayNight = makeSchedule('2026-07-11T23:00:00')
    const nextSunday = makeSchedule('2026-07-12T00:00:00')

    expect(
      getSchedulesThisWeek([lastSaturday, thisSunday, today, thisSaturdayNight, nextSunday]),
    ).toEqual([thisSunday, today, thisSaturdayNight])
  })

  it('returns an empty array when nothing falls in the current week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-07T12:00:00'))

    expect(getSchedulesThisWeek([makeSchedule('2026-01-01T10:00:00')])).toEqual([])
  })
})
