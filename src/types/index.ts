export interface Role {
  id: string
  name: string
  description: string
  iconName: string
  color: string
}

export interface Member {
  id: string
  name: string
  phone: string
  avatarUrl: string
  roleIds: string[]
  availability: 'Semanal' | 'Quinzenal' | 'Mensal'
  status: 'Ativo' | 'Inativo'
  notes?: string
}

export interface ScheduleAssignment {
  id: string
  roleId: string
  memberId: string | null
}

export interface Schedule {
  id: string
  title: string
  date: string // ISO string
  time: string
  theme?: string
  status: 'Confirmada' | 'Pendente' | 'Rascunho'
  assignments: ScheduleAssignment[]
  leitor1?: string | null
  leitor2?: string | null
}
