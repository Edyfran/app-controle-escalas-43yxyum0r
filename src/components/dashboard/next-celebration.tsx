import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Calendar as CalendarIcon, MapPin, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAppStore from '@/stores/main'

export function NextCelebration() {
  const { schedules, members, roles } = useAppStore()

  if (!schedules.length) return null
  const next = schedules[0] // Assuming sorted

  return (
    <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <CalendarIcon className="w-48 h-48" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-background">
            Próxima Celebração
          </Badge>
          <Badge className={next.status === 'Confirmada' ? 'bg-emerald-500' : 'bg-amber-500'}>
            {next.status}
          </Badge>
        </div>
        <CardTitle className="text-2xl mt-4 text-primary-foreground">{next.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-4" />{' '}
            {format(new Date(next.date), "dd 'de' MMMM", { locale: ptBR })}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-4" /> {next.time}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4" /> Matriz
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Equipe Escalada
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {next.assignments.map((assignment) => {
              const role = roles.find((r) => r.id === assignment.roleId)
              const member = members.find((m) => m.id === assignment.memberId)

              return (
                <div
                  key={assignment.id}
                  className="flex items-center gap-3 bg-background rounded-lg p-2 border shadow-sm"
                >
                  <Avatar className="size-8">
                    {member?.avatarUrl ? <AvatarImage src={member.avatarUrl} /> : null}
                    <AvatarFallback>
                      <User className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-primary">{role?.name}</span>
                    <span className="text-sm truncate">
                      {member ? (
                        member.name
                      ) : (
                        <span className="text-destructive font-medium">Vago</span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
