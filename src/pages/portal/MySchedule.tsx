import { useMemo, useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, X, CalendarPlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import useAppStore from '@/stores/main'
import { ConfirmationStatus } from '@/types'
import { buildGoogleCalendarUrl } from '@/lib/google-calendar'
import { confirmationBadgeClass as statusBadgeClass } from '@/lib/confirmation-status'

function ConfirmActions({
  status,
  onConfirm,
  onDecline,
}: {
  status: ConfirmationStatus
  onConfirm: () => void
  onDecline: () => void
}) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <Badge variant="outline" className={statusBadgeClass(status)}>
        {status}
      </Badge>
      {status !== 'Confirmado' && (
        <Button size="sm" variant="outline" className="h-7" onClick={onConfirm}>
          <Check className="mr-1 h-3 w-3" /> Confirmar
        </Button>
      )}
      {status !== 'Recusado' && (
        <Button size="sm" variant="outline" className="h-7" onClick={onDecline}>
          <X className="mr-1 h-3 w-3" /> Recusar
        </Button>
      )}
    </div>
  )
}

export default function MySchedule() {
  const { currentMember, userType, schedules, roles, members, confirmAssignment, confirmLeitor } =
    useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  if (userType === 'unlinked' || !currentMember) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Seu email ainda não está vinculado a nenhuma ficha de membro. Peça ao seu coordenador
          para cadastrar seu email em <strong>Membros</strong>.
        </CardContent>
      </Card>
    )
  }

  const isInvolvedIn = (schedule: (typeof schedules)[number]) =>
    schedule.assignments.some((a) => a.memberId === currentMember.id) ||
    schedule.leitor1 === currentMember.id ||
    schedule.leitor2 === currentMember.id

  const myScheduleDays = schedules.filter(isInvolvedIn).map((s) => new Date(s.date))

  const visibleSchedules = selectedDate
    ? schedules.filter((s) => isSameDay(new Date(s.date), selectedDate))
    : schedules

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Minhas Escalas</h2>
        <p className="text-muted-foreground">Confirme sua presença nas próximas celebrações.</p>
      </div>

      {myScheduleDays.length > 0 && (
        <Card className="p-3 w-fit">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            modifiers={{ mine: myScheduleDays }}
            modifiersClassNames={{ mine: 'bg-primary/15 font-semibold text-primary' }}
          />
          {selectedDate && (
            <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => setSelectedDate(undefined)}>
              Ver todas as escalas
            </Button>
          )}
        </Card>
      )}

      {visibleSchedules.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {selectedDate
              ? `Nenhuma escala em ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.`
              : 'Nenhuma escala cadastrada ainda.'}
          </CardContent>
        </Card>
      )}

      {visibleSchedules.map((schedule) => {
        const myAssignment = schedule.assignments.find((a) => a.memberId === currentMember.id)
        const isLeitor1 = schedule.leitor1 === currentMember.id
        const isLeitor2 = schedule.leitor2 === currentMember.id
        const isInvolved = Boolean(myAssignment) || isLeitor1 || isLeitor2

        return (
          <Card
            key={schedule.id}
            className={`overflow-hidden border-l-4 ${isInvolved ? 'border-l-primary' : 'border-l-muted'}`}
          >
            <CardContent className="p-0 sm:flex relative">
              {isInvolved && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                >
                  <a
                    href={buildGoogleCalendarUrl(
                      schedule,
                      `Você está escalado(a) em ${schedule.title}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Adicionar ao Google Calendar"
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <div className="bg-muted/50 p-6 sm:w-1/4 sm:border-r flex flex-col justify-center">
                <div className="text-sm font-medium capitalize text-muted-foreground">
                  {format(new Date(schedule.date), 'EEEE', { locale: ptBR })}
                </div>
                <div className="text-lg font-bold text-primary">
                  {format(new Date(schedule.date), "dd 'de' MMMM", { locale: ptBR })}
                </div>
                <div className="text-sm font-medium">{schedule.time}</div>
              </div>
              <div className="p-6 sm:w-3/4 space-y-4">
                <h3 className="text-xl font-semibold pr-8">{schedule.title}</h3>

                {!isInvolved && (
                  <p className="text-sm text-muted-foreground">
                    Você não está escalado nesta celebração.
                  </p>
                )}

                {myAssignment && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">
                      {roles.find((r) => r.id === myAssignment.roleId)?.name}
                    </span>
                    <ConfirmActions
                      status={myAssignment.confirmationStatus}
                      onConfirm={() => confirmAssignment(myAssignment.id, 'Confirmado')}
                      onDecline={() => confirmAssignment(myAssignment.id, 'Recusado')}
                    />
                  </div>
                )}

                {isLeitor1 && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Leitor 1</span>
                    <ConfirmActions
                      status={schedule.leitor1Status}
                      onConfirm={() => confirmLeitor(schedule.id, 'leitor1', 'Confirmado')}
                      onDecline={() => confirmLeitor(schedule.id, 'leitor1', 'Recusado')}
                    />
                  </div>
                )}

                {isLeitor2 && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Leitor 2</span>
                    <ConfirmActions
                      status={schedule.leitor2Status}
                      onConfirm={() => confirmLeitor(schedule.id, 'leitor2', 'Confirmado')}
                      onDecline={() => confirmLeitor(schedule.id, 'leitor2', 'Recusado')}
                    />
                  </div>
                )}

                {isInvolved && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground uppercase">
                      Equipe completa
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {schedule.assignments.map((a) => (
                        <span key={a.id} className="text-sm">
                          {roles.find((r) => r.id === a.roleId)?.name}:{' '}
                          {members.find((m) => m.id === a.memberId)?.name ?? 'Vago'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
