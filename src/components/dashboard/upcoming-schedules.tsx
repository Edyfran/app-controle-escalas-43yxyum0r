import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import useAppStore from '@/stores/main'
import { getUpcomingSchedules } from '@/lib/schedule-dates'

export function UpcomingSchedules() {
  const { schedules } = useAppStore()
  const upcoming = getUpcomingSchedules(schedules).slice(1, 6)

  if (!upcoming.length) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Próximas Escalas</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/escalas">
            Ver Todas <ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcoming.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{schedule.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(schedule.date), 'dd/MM/yyyy', { locale: ptBR })} às{' '}
                  {schedule.time}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={schedule.status === 'Pendente' ? 'bg-amber-100 text-amber-800' : ''}
              >
                {schedule.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
