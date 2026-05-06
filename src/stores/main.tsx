import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Member, Role, Schedule } from '@/types'
import { mockMembers, mockRoles, mockSchedules } from '@/lib/mock-data'
import { toast } from '@/hooks/use-toast'

interface AppState {
  members: Member[]
  roles: Role[]
  schedules: Schedule[]
  addMember: (member: Omit<Member, 'id'>) => void
  updateMember: (id: string, member: Partial<Member>) => void
  deleteMember: (id: string) => void
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void
}

export const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>(mockMembers)
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules)

  const addMember = (memberData: Omit<Member, 'id'>) => {
    const newMember = { ...memberData, id: Math.random().toString(36).substr(2, 9) }
    setMembers((prev) => [newMember, ...prev])
    toast({
      title: 'Membro adicionado',
      description: `${newMember.name} foi cadastrado com sucesso.`,
    })
  }

  const updateMember = (id: string, updatedMember: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updatedMember } : m)))
    toast({ title: 'Membro atualizado', description: `Os dados foram salvos com sucesso.` })
  }

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
    toast({ title: 'Membro removido', description: `O cadastro foi excluído.` })
  }

  const addSchedule = (scheduleData: Omit<Schedule, 'id'>) => {
    const newSchedule = { ...scheduleData, id: Math.random().toString(36).substr(2, 9) }
    setSchedules((prev) =>
      [...prev, newSchedule].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    )
    toast({ title: 'Escala criada', description: `A escala para ${newSchedule.title} foi salva.` })
  }

  return React.createElement(
    AppContext.Provider,
    { value: { members, roles, schedules, addMember, updateMember, deleteMember, addSchedule } },
    children,
  )
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}
