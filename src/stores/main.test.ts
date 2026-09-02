import { describe, it, expect, vi } from 'vitest'

// main.tsx imports the real Supabase client at module scope, which throws if
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY aren't set (they aren't in CI). Stub it out —
// these tests only exercise the pure data-mapping functions below, not Supabase calls.
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { mapRole, mapMember, mapSchedule, friendlyMemberErrorMessage } from './main'

describe('mapRole', () => {
  it('maps snake_case DB columns to the camelCase Role shape', () => {
    expect(
      mapRole({
        id: 'r1',
        name: 'Leitor',
        description: 'Proclama as leituras',
        icon_name: 'BookOpen',
        color: 'bg-indigo-500',
      }),
    ).toEqual({
      id: 'r1',
      name: 'Leitor',
      description: 'Proclama as leituras',
      iconName: 'BookOpen',
      color: 'bg-indigo-500',
    })
  })
})

describe('mapMember', () => {
  const baseRow = {
    id: 'm1',
    name: 'João',
    phone: '11999999999',
    email: null,
    avatar_url: 'https://example.com/avatar.png',
    availability: 'Semanal' as const,
    status: 'Ativo' as const,
    notes: null,
    approval_status: 'Aprovado' as const,
    member_roles: null,
    member_availability: null,
  }

  it('flattens member_roles into roleIds and member_availability into availabilitySlots', () => {
    const result = mapMember({
      ...baseRow,
      member_roles: [{ role_id: 'r1' }, { role_id: 'r2' }],
      member_availability: [
        { day_of_week: 0, period: 'Manha' },
        { day_of_week: 3, period: 'Noite' },
      ],
    })

    expect(result.roleIds).toEqual(['r1', 'r2'])
    expect(result.availabilitySlots).toEqual([
      { dayOfWeek: 0, period: 'Manha' },
      { dayOfWeek: 3, period: 'Noite' },
    ])
  })

  it('defaults roleIds/availabilitySlots to empty arrays when the joins come back null', () => {
    const result = mapMember(baseRow)
    expect(result.roleIds).toEqual([])
    expect(result.availabilitySlots).toEqual([])
  })

  it('turns null email/notes into undefined (the app-facing optional shape)', () => {
    const result = mapMember(baseRow)
    expect(result.email).toBeUndefined()
    expect(result.notes).toBeUndefined()
  })

  it('preserves an actual email/notes value when present', () => {
    const result = mapMember({ ...baseRow, email: 'joao@example.com', notes: 'Alérgico a incenso' })
    expect(result.email).toBe('joao@example.com')
    expect(result.notes).toBe('Alérgico a incenso')
  })
})

describe('mapSchedule', () => {
  const baseRow = {
    id: 's1',
    title: 'Missa Dominical',
    date: '2026-07-05T19:00:00Z',
    time: '19:00',
    theme: null,
    status: 'Pendente' as const,
    leitor1: null,
    leitor1_status: 'Pendente' as const,
    leitor2: null,
    leitor2_status: 'Pendente' as const,
    schedule_assignments: null,
  }

  it('maps schedule_assignments rows to the camelCase ScheduleAssignment shape', () => {
    const result = mapSchedule({
      ...baseRow,
      schedule_assignments: [
        { id: 'a1', role_id: 'r1', member_id: 'm1', confirmation_status: 'Confirmado' },
        { id: 'a2', role_id: 'r2', member_id: null, confirmation_status: 'Pendente' },
      ],
    })

    expect(result.assignments).toEqual([
      { id: 'a1', roleId: 'r1', memberId: 'm1', confirmationStatus: 'Confirmado' },
      { id: 'a2', roleId: 'r2', memberId: null, confirmationStatus: 'Pendente' },
    ])
  })

  it('defaults assignments to an empty array when the join comes back null', () => {
    expect(mapSchedule(baseRow).assignments).toEqual([])
  })

  it('turns a null theme into undefined but leaves leitor1/leitor2 as null (not undefined)', () => {
    const result = mapSchedule(baseRow)
    expect(result.theme).toBeUndefined()
    expect(result.leitor1).toBeNull()
    expect(result.leitor2).toBeNull()
  })
})

describe('friendlyMemberErrorMessage', () => {
  it('translates the members_email_unique_idx constraint violation into Portuguese', () => {
    expect(
      friendlyMemberErrorMessage({
        code: '23505',
        message:
          'duplicate key value violates unique constraint "members_email_unique_idx"',
      }),
    ).toBe('Esse email já está em uso por outro membro.')
  })

  it('falls back to the raw message for any other error', () => {
    expect(friendlyMemberErrorMessage({ code: '23503', message: 'foreign key violation' })).toBe(
      'foreign key violation',
    )
    expect(friendlyMemberErrorMessage({ message: 'network error' })).toBe('network error')
  })

  it('does not special-case a 23505 on a different constraint', () => {
    expect(
      friendlyMemberErrorMessage({ code: '23505', message: 'duplicate key on parishes_join_code_unique_idx' }),
    ).toBe('duplicate key on parishes_join_code_unique_idx')
  })
})
