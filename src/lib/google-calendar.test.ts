import { describe, it, expect } from 'vitest'
import { getScheduleStart, buildGoogleCalendarUrl } from './google-calendar'

describe('getScheduleStart', () => {
  it('combines the schedule day with the given time-of-day, ignoring any time baked into date', () => {
    const start = getScheduleStart({ date: '2026-07-06T23:00:00.000Z', time: '19:30' })
    expect(start.getHours()).toBe(19)
    expect(start.getMinutes()).toBe(30)
  })
})

describe('buildGoogleCalendarUrl', () => {
  it('builds a Google Calendar template URL with a 1-hour event window', () => {
    const url = buildGoogleCalendarUrl({
      title: 'Missa Dominical',
      date: '2026-07-06',
      time: '19:00',
    })
    const parsed = new URL(url)

    expect(parsed.origin + parsed.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(parsed.searchParams.get('action')).toBe('TEMPLATE')
    expect(parsed.searchParams.get('text')).toBe('Missa Dominical')

    const [startStr, endStr] = parsed.searchParams.get('dates')!.split('/')
    expect(startStr).toMatch(/^\d{8}T\d{6}Z$/)
    expect(endStr).toMatch(/^\d{8}T\d{6}Z$/)

    const parseGoogleDate = (s: string) => {
      const y = s.slice(0, 4)
      const mo = s.slice(4, 6)
      const d = s.slice(6, 8)
      const h = s.slice(9, 11)
      const mi = s.slice(11, 13)
      const sec = s.slice(13, 15)
      return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec))
    }
    const diffMs = parseGoogleDate(endStr) - parseGoogleDate(startStr)
    expect(diffMs).toBe(60 * 60 * 1000)
  })

  it('includes details only when provided', () => {
    const withDetails = buildGoogleCalendarUrl(
      { title: 'X', date: '2026-07-06', time: '10:00' },
      'Você está escalado(a).',
    )
    expect(new URL(withDetails).searchParams.get('details')).toBe('Você está escalado(a).')

    const withoutDetails = buildGoogleCalendarUrl({ title: 'X', date: '2026-07-06', time: '10:00' })
    expect(new URL(withoutDetails).searchParams.has('details')).toBe(false)
  })
})
