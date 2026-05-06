import { createContext, useContext, useState, ReactNode } from 'react'
import { Role, Member, Schedule } from '@/types'
import { format, addDays } from 'date-fns'

type AppContextType = {
  roles: Role[]
  members: Member[]
  schedules: Schedule[]
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  addMember: (member: Omit<Member, 'id'>) => void
  updateMember: (id: string, member: Partial<Member>) => void
  deleteMember: (id: string) => void
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void
}

const defaultRoles: Role[] = [
  { id: '1', name: 'Comentários', icon: 'Mic', color: 'blue' },
  { id: '2', name: 'Leitor', icon: 'BookOpen', color: 'emerald' },
  { id: '3', name: 'Preces', icon: 'MessageCircleHeart', color: 'purple' },
  { id: '4', name: 'Salmos', icon: 'Music', color: 'amber' },
]

const defaultMembers: Member[] = [
  { id: '1', name: 'João Silva', phone: '(11) 99999-1111', roles: ['1', '2'], status: 'active' },
  { id: '2', name: 'Maria Souza', phone: '(11) 99999-2222', roles: ['4'], status: 'active' },
  { id: '3', name: 'Carlos Mendes', phone: '(11) 99999-3333', roles: ['2', '3'], status: 'active' },
  { id: '4', name: 'Ana Clara', phone: '(11) 99999-4444', roles: ['1', '3'], status: 'active' },
  { id: '5', name: 'Pedro Paulo', phone: '(11) 99999-5555', roles: ['4'], status: 'inactive' },
]

const today = new Date()
const nextSunday = addDays(today, 7 - today.getDay())
const formattedNextSunday = format(nextSunday, 'yyyy-MM-dd')

const defaultSchedules: Schedule[] = [
  {
    id: '1',
    title: 'Missa de Domingo',
    date: formattedNextSunday,
    time: '19:00',
    assignments: [
      { roleId: '1', memberId: '1' },
      { roleId: '2', memberId: '3' },
      { roleId: '3', memberId: '4' },
      { roleId: '4', memberId: '2' },
    ],
  },
  {
    id: '2',
    title: 'Missa das Crianças',
    date: format(addDays(today, 14 - today.getDay()), 'yyyy-MM-dd'),
    time: '10:00',
    assignments: [
      { roleId: '1', memberId: '4' },
      { roleId: '4', memberId: '2' },
    ],
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [roles] = useState<Role[]>(defaultRoles)
  const [members, setMembers] = useState<Member[]>(defaultMembers)
  const [schedules, setSchedules] = useState<Schedule[]>(defaultSchedules)

  const login = () => setIsAuthenticated(true)
  const logout = () => setIsAuthenticated(false)

  const addMember = (member: Omit<Member, 'id'>) => {
    setMembers((prev) => [...prev, { ...member, id: Math.random().toString(36).substr(2, 9) }])
  }

  const updateMember = (id: string, updatedMember: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updatedMember } : m)))
  }

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const addSchedule = (schedule: Omit<Schedule, 'id'>) => {
    setSchedules((prev) => [...prev, { ...schedule, id: Math.random().toString(36).substr(2, 9) }])
  }

  return (
    <AppContext.Provider
      value={{
        roles,
        members,
        schedules,
        isAuthenticated,
        login,
        logout,
        addMember,
        updateMember,
        deleteMember,
        addSchedule,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
