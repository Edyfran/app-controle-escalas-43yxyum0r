import { Users, CalendarDays, AlertCircle, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useAppStore from '@/stores/main'
import { getUpcomingSchedules, getSchedulesThisWeek } from '@/lib/schedule-dates'

export function StatCards() {
  const { members, roles, schedules } = useAppStore()

  const activeMembers = members.filter(
    (m) => m.status === 'Ativo' && m.approvalStatus === 'Aprovado',
  ).length
  const schedulesThisWeek = getSchedulesThisWeek(schedules).length
  // Actual open slots in upcoming celebrations — not just schedules whose overall status
  // happens to be "Pendente" (leitor2 is optional, so an empty leitor2 doesn't count as a vaga).
  const openSlots = getUpcomingSchedules(schedules).reduce((count, s) => {
    const vacantAssignments = s.assignments.filter((a) => a.memberId === null).length
    const vacantLeitor1 = s.leitor1 ? 0 : 1
    return count + vacantAssignments + vacantLeitor1
  }, 0)

  const stats = [
    {
      title: 'Membros Ativos',
      value: activeMembers.toString(),
      icon: Users,
      desc: 'Equipe pastoral',
    },
    {
      title: 'Escalas da Semana',
      value: schedulesThisWeek.toString(),
      icon: CalendarDays,
      desc: 'Celebrações agendadas',
    },
    {
      title: 'Vagas em Aberto',
      value: openSlots.toString(),
      icon: AlertCircle,
      desc: 'Precisam de atenção',
      alert: openSlots > 0,
    },
    {
      title: 'Funções Cadastradas',
      value: roles.length.toString(),
      icon: Shield,
      desc: 'Ministérios ativos',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon
              className={`h-4 w-4 ${stat.alert ? 'text-destructive' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.alert ? 'text-destructive' : ''}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
