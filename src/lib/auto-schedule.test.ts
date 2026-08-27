import { describe, it, expect } from 'vitest'
import { autoFillSchedule, periodForTime } from './auto-schedule'
import { Member, Role, Schedule } from '@/types'

const LEITOR_ROLE: Role = { id: 'role-leitor', name: 'Leitor', description: '', iconName: '', color: '' }
const ACOLITO_ROLE: Role = { id: 'role-acolito', name: 'Acólito', description: '', iconName: '', color: '' }
const roles = [LEITOR_ROLE, ACOLITO_ROLE]

function makeMember(overrides: Partial<Member> & { id: string }): Member {
  return {
    name: overrides.id,
    phone: '',
    avatarUrl: '',
    roleIds: [],
    availability: 'Semanal',
    availabilitySlots: [],
    status: 'Ativo',
    approvalStatus: 'Aprovado',
    ...overrides,
  }
}

function makeSchedule(overrides: Partial<Schedule> & { id: string; date: string }): Schedule {
  return {
    title: 'Missa',
    time: '19:00',
    status: 'Pendente',
    assignments: [],
    leitor1: null,
    leitor1Status: 'Pendente',
    leitor2: null,
    leitor2Status: 'Pendente',
    ...overrides,
  }
}

// Sunday 2026-07-05, night mass — every fixture below is dated relative to this.
const TARGET_DATE = new Date('2026-07-05T00:00:00')
const TARGET_TIME = '19:00'

describe('periodForTime', () => {
  it('splits Manha/Noite at the noon boundary', () => {
    expect(periodForTime('08:00')).toBe('Manha')
    expect(periodForTime('11:59')).toBe('Manha')
    expect(periodForTime('12:00')).toBe('Noite')
    expect(periodForTime('19:00')).toBe('Noite')
  })
})

describe('autoFillSchedule', () => {
  it('only suggests a member who has the role, is active/approved, and is available that day+period', () => {
    const available = makeMember({
      id: 'm-ok',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })
    const wrongRole = makeMember({ id: 'm-wrong-role', roleIds: [], availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }] })
    const wrongAvailability = makeMember({
      id: 'm-wrong-avail',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 1, period: 'Noite' }],
    })
    const inactive = makeMember({
      id: 'm-inactive',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
      status: 'Inativo',
    })
    const unapproved = makeMember({
      id: 'm-unapproved',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
      approvalStatus: 'Pendente',
    })

    const result = autoFillSchedule({
      date: TARGET_DATE,
      time: TARGET_TIME,
      slots: [{ key: `role:${ACOLITO_ROLE.id}`, roleId: ACOLITO_ROLE.id, currentMemberId: null }],
      roles,
      members: [available, wrongRole, wrongAvailability, inactive, unapproved],
      schedules: [],
    })

    expect(result.suggestions[`role:${ACOLITO_ROLE.id}`]).toBe('m-ok')
    expect(result.unfilled).toEqual([])
  })

  it('excludes a member who served (any role) in the immediately preceding week', () => {
    const m1 = makeMember({
      id: 'm1',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })
    const m2 = makeMember({
      id: 'm2',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })

    // m1 served as Leitor last Sunday (2026-06-28) — a different role, still counts.
    const lastWeekSchedule = makeSchedule({
      id: 'prev',
      date: '2026-06-28T19:00:00',
      leitor1: 'm1',
    })

    const result = autoFillSchedule({
      date: TARGET_DATE,
      time: TARGET_TIME,
      slots: [{ key: `role:${ACOLITO_ROLE.id}`, roleId: ACOLITO_ROLE.id, currentMemberId: null }],
      roles,
      members: [m1, m2],
      schedules: [lastWeekSchedule],
    })

    expect(result.suggestions[`role:${ACOLITO_ROLE.id}`]).toBe('m2')
  })

  it('does not exclude a member who served two weeks ago (only the immediately preceding week counts)', () => {
    const m1 = makeMember({
      id: 'm1',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })
    const twoWeeksAgo = makeSchedule({ id: 'old', date: '2026-06-21T19:00:00', leitor1: 'm1' })

    const result = autoFillSchedule({
      date: TARGET_DATE,
      time: TARGET_TIME,
      slots: [{ key: `role:${ACOLITO_ROLE.id}`, roleId: ACOLITO_ROLE.id, currentMemberId: null }],
      roles,
      members: [m1],
      schedules: [twoWeeksAgo],
    })

    expect(result.suggestions[`role:${ACOLITO_ROLE.id}`]).toBe('m1')
  })

  it('prefers whoever served longest ago, rotating fairly', () => {
    const recentlyServed = makeMember({
      id: 'recent',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })
    const neverServed = makeMember({
      id: 'never',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })
    // Three weeks ago — old enough to not trigger the consecutive-week exclusion.
    const oldSchedule = makeSchedule({ id: 'old', date: '2026-06-14T19:00:00', leitor1: 'recent' })

    const result = autoFillSchedule({
      date: TARGET_DATE,
      time: TARGET_TIME,
      slots: [{ key: `role:${ACOLITO_ROLE.id}`, roleId: ACOLITO_ROLE.id, currentMemberId: null }],
      roles,
      members: [recentlyServed, neverServed],
      schedules: [oldSchedule],
    })

    expect(result.suggestions[`role:${ACOLITO_ROLE.id}`]).toBe('never')
  })

  it('never suggests the same member twice within the same schedule', () => {
    const onlyCandidate = makeMember({
      id: 'only',
      roleIds: [ACOLITO_ROLE.id, LEITOR_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })

    const result = autoFillSchedule({
      date: TARGET_DATE,
      time: TARGET_TIME,
      slots: [
        { key: `role:${ACOLITO_ROLE.id}`, roleId: ACOLITO_ROLE.id, currentMemberId: null },
        { key: 'leitor1', roleId: LEITOR_ROLE.id, currentMemberId: null },
      ],
      roles,
      members: [onlyCandidate],
      schedules: [],
    })

    const filledSlots = Object.keys(result.suggestions)
    expect(filledSlots).toHaveLength(1)
    expect(result.unfilled).toHaveLength(1)
  })

  it('does not suggest a member already occupying another slot in the same schedule (manual pick respected)', () => {
    const onlyCandidate = makeMember({
      id: 'only',
      roleIds: [ACOLITO_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })

    const result = autoFillSchedule({
      date: TARGET_DATE,
      time: TARGET_TIME,
      slots: [
        { key: `role:${ACOLITO_ROLE.id}`, roleId: ACOLITO_ROLE.id, currentMemberId: null },
        { key: 'leitor1', roleId: LEITOR_ROLE.id, currentMemberId: 'only' },
      ],
      roles,
      members: [onlyCandidate],
      schedules: [],
    })

    expect(result.suggestions[`role:${ACOLITO_ROLE.id}`]).toBeUndefined()
    expect(result.unfilled).toEqual([`role:${ACOLITO_ROLE.id}`])
  })

  it('fills the scarcest slot first so a lone eligible member is not stolen by a more flexible slot', () => {
    // scarceCandidate is the ONLY person eligible for the acolito role.
    // flexibleCandidate is eligible for leitor only, and would normally be picked over
    // scarceCandidate by fairness (never served) if leitor were processed first — but since
    // leitor has two eligible people and acolito only one, acolito must be filled first.
    const scarceCandidate = makeMember({
      id: 'scarce',
      roleIds: [ACOLITO_ROLE.id, LEITOR_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })
    const flexibleCandidate = makeMember({
      id: 'flexible',
      roleIds: [LEITOR_ROLE.id],
      availabilitySlots: [{ dayOfWeek: 0, period: 'Noite' }],
    })

    const result = autoFillSchedule({
      date: TARGET_DATE,
      time: TARGET_TIME,
      slots: [
        { key: `role:${ACOLITO_ROLE.id}`, roleId: ACOLITO_ROLE.id, currentMemberId: null },
        { key: 'leitor1', roleId: LEITOR_ROLE.id, currentMemberId: null },
      ],
      roles,
      members: [scarceCandidate, flexibleCandidate],
      schedules: [],
    })

    expect(result.suggestions[`role:${ACOLITO_ROLE.id}`]).toBe('scarce')
    expect(result.suggestions.leitor1).toBe('flexible')
    expect(result.unfilled).toEqual([])
  })
})
