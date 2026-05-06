import { useState } from 'react'
import { Plus, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddScheduleSheet } from '@/components/schedules/add-schedule-sheet'
import useAppStore from '@/stores/main'

export default function Schedules() {
  const { schedules, roles, members } = useAppStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Escalas</h2>
          <p className="text-muted-foreground">Planeje e visualize as missas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button onClick={() => setIsSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Escala
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Em Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6 space-y-4">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0 sm:flex">
                <div className="bg-muted/50 p-6 sm:w-1/4 sm:border-r flex flex-col justify-center">
                  <div className="text-lg font-bold text-primary">
                    {format(new Date(schedule.date), "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                  <div className="text-sm font-medium">{schedule.time}</div>
                  <div className="mt-2">
                    <Badge variant="outline">{schedule.status}</Badge>
                  </div>
                </div>
                <div className="p-6 sm:w-3/4">
                  <h3 className="text-xl font-semibold mb-4">{schedule.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schedule.assignments.map((assig) => {
                      const role = roles.find((r) => r.id === assig.roleId)
                      const member = members.find((m) => m.id === assig.memberId)
                      return (
                        <div key={assig.id} className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase">
                            {role?.name}
                          </span>
                          <span className={member ? 'font-medium' : 'text-destructive font-medium'}>
                            {member ? member.name : 'Vago'}
                          </span>
                        </div>
                      )
                    })}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase">Leitor 1</span>
                      <span
                        className={
                          schedule.leitor1 ? 'font-medium' : 'text-destructive font-medium'
                        }
                      >
                        {members.find((m) => m.id === schedule.leitor1)?.name || 'Vago'}
                      </span>
                    </div>
                    {schedule.leitor2 && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase">Leitor 2</span>
                        <span className="font-medium">
                          {members.find((m) => m.id === schedule.leitor2)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="calendar">
          <Card className="flex items-center justify-center p-12 text-muted-foreground">
            Visualização de calendário estará disponível em breve.
          </Card>
        </TabsContent>
      </Tabs>

      <AddScheduleSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </div>
  )
}
