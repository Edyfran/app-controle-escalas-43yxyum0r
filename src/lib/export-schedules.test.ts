import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportSchedulesToCsv } from './export-schedules'
import { Member, Role, Schedule } from '@/types'

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm1',
    name: 'Ana',
    phone: '',
    avatarUrl: '',
    roleIds: ['r1'],
    availability: 'Semanal',
    availabilitySlots: [],
    status: 'Ativo',
    approvalStatus: 'Aprovado',
    ...overrides,
  }
}

function makeRole(overrides: Partial<Role> = {}): Role {
  return { id: 'r1', name: 'Comentários', description: '', iconName: 'Mic', color: 'bg-blue-500', ...overrides }
}

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: 's1',
    title: 'Missa Dominical',
    date: '2026-07-06T10:00:00',
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

describe('exportSchedulesToCsv', () => {
  let clickSpy: ReturnType<typeof vi.fn>
  let capturedBlob: Blob | undefined

  beforeEach(() => {
    clickSpy = vi.fn()
    capturedBlob = undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') el.click = clickSpy
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('triggers a CSV download with the expected filename and content type', () => {
    exportSchedulesToCsv([makeSchedule()], [makeRole()], [makeMember()])

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(capturedBlob).toBeDefined()
    expect(capturedBlob!.type).toContain('text/csv')
  })

  it('writes one row per assignment plus a Leitor 1 row, using "Vago" for empty slots', async () => {
    const schedule = makeSchedule({
      assignments: [
        { id: 'a1', roleId: 'r1', memberId: 'm1', confirmationStatus: 'Confirmado' },
      ],
    })
    exportSchedulesToCsv([schedule], [makeRole()], [makeMember()])

    const text = await capturedBlob!.text()
    const lines = text.replace(/^﻿/, '').trim().split('\n')

    expect(lines[0]).toBe('Data,Dia da Semana,Horário,Título,Status,Função,Membro,Confirmação')
    expect(lines).toContain('06/07/2026,segunda-feira,19:00,Missa Dominical,Pendente,Comentários,Ana,Confirmado')
    expect(lines).toContain('06/07/2026,segunda-feira,19:00,Missa Dominical,Pendente,Leitor 1,Vago,')
    // leitor2 is optional and unset here, so it should not produce a row at all
    expect(lines.some((l) => l.includes('Leitor 2'))).toBe(false)
  })

  it('quotes fields that contain commas', async () => {
    const schedule = makeSchedule({ title: 'Missa, Especial' })
    exportSchedulesToCsv([schedule], [], [])

    const text = await capturedBlob!.text()
    expect(text).toContain('"Missa, Especial"')
  })
})
