import { Member, Role, Schedule } from '@/types'
import { addDays, format, setHours, setMinutes } from 'date-fns'

export const mockRoles: Role[] = [
  {
    id: 'r1',
    name: 'Comentários',
    description: 'Guia a assembleia durante a celebração',
    iconName: 'Mic',
    color: 'bg-blue-500',
  },
  {
    id: 'r2',
    name: 'Leitor',
    description: 'Proclama as leituras (1ª e 2ª)',
    iconName: 'BookOpen',
    color: 'bg-indigo-500',
  },
  {
    id: 'r3',
    name: 'Preces',
    description: 'Lê as intenções da comunidade',
    iconName: 'HeartHandshake',
    color: 'bg-rose-500',
  },
  {
    id: 'r4',
    name: 'Salmos',
    description: 'Canta ou recita o Salmo Responsorial',
    iconName: 'Music',
    color: 'bg-emerald-500',
  },
]

export const mockMembers: Member[] = [
  {
    id: 'm1',
    name: 'João Silva',
    phone: '(11) 99999-1111',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
    roleIds: ['r1', 'r2'],
    availability: 'Semanal',
    status: 'Ativo',
  },
  {
    id: 'm2',
    name: 'Maria Souza',
    phone: '(11) 99999-2222',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
    roleIds: ['r2', 'r3'],
    availability: 'Quinzenal',
    status: 'Ativo',
  },
  {
    id: 'm3',
    name: 'Pedro Almeida',
    phone: '(11) 99999-3333',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
    roleIds: ['r4'],
    availability: 'Semanal',
    status: 'Ativo',
  },
  {
    id: 'm4',
    name: 'Ana Costa',
    phone: '(11) 99999-4444',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=4',
    roleIds: ['r1', 'r4'],
    availability: 'Mensal',
    status: 'Inativo',
  },
  {
    id: 'm5',
    name: 'Lucas Santos',
    phone: '(11) 99999-5555',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=5',
    roleIds: ['r2'],
    availability: 'Semanal',
    status: 'Ativo',
  },
]

const today = new Date()
const nextSunday = addDays(today, 7 - today.getDay())
const nextSundayDate = format(setMinutes(setHours(nextSunday, 19), 0), "yyyy-MM-dd'T'HH:mm:ss")

export const mockSchedules: Schedule[] = [
  {
    id: 's1',
    title: 'Missa Dominical',
    date: nextSundayDate,
    time: '19:00',
    theme: 'Tempo Comum',
    status: 'Confirmada',
    assignments: [
      { id: 'a1', roleId: 'r1', memberId: 'm1' },
      { id: 'a3', roleId: 'r3', memberId: 'm2' },
      { id: 'a4', roleId: 'r4', memberId: 'm3' },
    ],
    leitor1: 'm2',
    leitor2: 'm5',
  },
  {
    id: 's2',
    title: 'Missa das Crianças',
    date: format(setMinutes(setHours(nextSunday, 9), 0), "yyyy-MM-dd'T'HH:mm:ss"),
    time: '09:00',
    theme: 'Tempo Comum',
    status: 'Pendente',
    assignments: [
      { id: 'a5', roleId: 'r1', memberId: null },
      { id: 'a7', roleId: 'r4', memberId: null },
    ],
    leitor1: 'm5',
    leitor2: null,
  },
]
