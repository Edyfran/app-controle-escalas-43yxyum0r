import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Member, Role, Schedule } from '@/types'

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportSchedulesToCsv(schedules: Schedule[], roles: Role[], members: Member[]) {
  const header = [
    'Data',
    'Dia da Semana',
    'Horário',
    'Título',
    'Status',
    'Função',
    'Membro',
    'Confirmação',
  ]
  const rows: string[][] = []

  for (const schedule of schedules) {
    const dateStr = format(new Date(schedule.date), 'dd/MM/yyyy')
    const dayStr = format(new Date(schedule.date), 'EEEE', { locale: ptBR })
    const base = [dateStr, dayStr, schedule.time, schedule.title, schedule.status]

    for (const assignment of schedule.assignments) {
      const role = roles.find((r) => r.id === assignment.roleId)
      const member = members.find((m) => m.id === assignment.memberId)
      rows.push([
        ...base,
        role?.name ?? '',
        member?.name ?? 'Vago',
        member ? assignment.confirmationStatus : '',
      ])
    }

    const leitor1Member = members.find((m) => m.id === schedule.leitor1)
    rows.push([...base, 'Leitor 1', leitor1Member?.name ?? 'Vago', leitor1Member ? schedule.leitor1Status : ''])

    if (schedule.leitor2) {
      const leitor2Member = members.find((m) => m.id === schedule.leitor2)
      rows.push([
        ...base,
        'Leitor 2',
        leitor2Member?.name ?? 'Vago',
        leitor2Member ? schedule.leitor2Status : '',
      ])
    }
  }

  const csvContent = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  // BOM prefix so Excel opens the accented Portuguese text as UTF-8 instead of mangling it.
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `escalas-${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
