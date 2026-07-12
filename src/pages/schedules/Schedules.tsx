import { useMemo, useState } from 'react'
import { Plus, Download, Edit2, CalendarPlus, Trash2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AddScheduleSheet } from '@/components/schedules/add-schedule-sheet'
import useAppStore from '@/stores/main'
import { ConfirmationStatus, Member, Role, Schedule } from '@/types'
import { buildGoogleCalendarUrl } from '@/lib/google-calendar'
import { confirmationBadgeClass } from '@/lib/confirmation-status'
import { exportSchedulesToCsv } from '@/lib/export-schedules'
import { PaginationControls } from '@/components/PaginationControls'
import { usePagination } from '@/hooks/use-pagination'

const PAGE_SIZE = 5

interface SubstituteSelectProps {
  eligibleMembers: Member[]
  currentMemberId: string | null
  confirmationStatus?: ConfirmationStatus
  onSubstitute: (newMemberId: string | null) => void
}

function SubstituteSelect({
  eligibleMembers,
  currentMemberId,
  confirmationStatus,
  onSubstitute,
}: SubstituteSelectProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={currentMemberId ?? 'none'}
        onValueChange={(v) => onSubstitute(v !== 'none' ? v : null)}
      >
        <SelectTrigger
          className={`h-auto w-auto gap-1 border-none bg-transparent p-0 shadow-none font-medium hover:underline focus:ring-0 ${
            currentMemberId ? '' : 'text-destructive'
          }`}
        >
          <SelectValue placeholder="Vago" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Deixar vago</SelectItem>
          {eligibleMembers.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentMemberId && confirmationStatus && (
        <Badge variant="outline" className={`text-xs ${confirmationBadgeClass(confirmationStatus)}`}>
          {confirmationStatus}
        </Badge>
      )}
    </div>
  )
}

interface ScheduleCardProps {
  schedule: Schedule
  roles: Role[]
  eligibleFor: (roleId?: string) => Member[]
  leitorRoleId?: string
  onEdit: (schedule: Schedule) => void
  onDelete: (schedule: Schedule) => void
  onSubstituteAssignment: (assignmentId: string, newMemberId: string | null) => void
  onSubstituteLeitor: (
    scheduleId: string,
    slot: 'leitor1' | 'leitor2',
    newMemberId: string | null,
  ) => void
}

function ScheduleCard({
  schedule,
  roles,
  eligibleFor,
  leitorRoleId,
  onEdit,
  onDelete,
  onSubstituteAssignment,
  onSubstituteLeitor,
}: ScheduleCardProps) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <CardContent className="p-0 sm:flex relative">
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
            <a
              href={buildGoogleCalendarUrl(schedule, 'Escala pastoral')}
              target="_blank"
              rel="noopener noreferrer"
              title="Adicionar ao Google Calendar"
            >
              <CalendarPlus className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(schedule)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(schedule)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-muted/50 p-6 sm:w-1/4 sm:border-r flex flex-col justify-center">
          <div className="text-sm font-medium capitalize text-muted-foreground">
            {format(new Date(schedule.date), 'EEEE', { locale: ptBR })}
          </div>
          <div className="text-lg font-bold text-primary">
            {format(new Date(schedule.date), "dd 'de' MMMM", { locale: ptBR })}
          </div>
          <div className="text-sm font-medium">{schedule.time}</div>
          <div className="mt-2">
            <Badge variant="outline">{schedule.status}</Badge>
          </div>
        </div>
        <div className="p-6 sm:w-3/4">
          <h3 className="text-xl font-semibold mb-4 pr-24">{schedule.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedule.assignments.map((assig) => {
              const role = roles.find((r) => r.id === assig.roleId)
              return (
                <div key={assig.id} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase">{role?.name}</span>
                  <SubstituteSelect
                    eligibleMembers={eligibleFor(role?.id)}
                    currentMemberId={assig.memberId}
                    confirmationStatus={assig.confirmationStatus}
                    onSubstitute={(newMemberId) => onSubstituteAssignment(assig.id, newMemberId)}
                  />
                </div>
              )
            })}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Leitor 1</span>
              <SubstituteSelect
                eligibleMembers={eligibleFor(leitorRoleId)}
                currentMemberId={schedule.leitor1 ?? null}
                confirmationStatus={schedule.leitor1Status}
                onSubstitute={(newMemberId) => onSubstituteLeitor(schedule.id, 'leitor1', newMemberId)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase">Leitor 2 (opcional)</span>
              <SubstituteSelect
                eligibleMembers={eligibleFor(leitorRoleId)}
                currentMemberId={schedule.leitor2 ?? null}
                confirmationStatus={schedule.leitor2 ? schedule.leitor2Status : undefined}
                onSubstitute={(newMemberId) => onSubstituteLeitor(schedule.id, 'leitor2', newMemberId)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Schedules() {
  const { schedules, roles, members, substituteAssignment, substituteLeitor, deleteSchedule } =
    useAppStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const handleAddSchedule = () => {
    setScheduleToEdit(null)
    setIsSheetOpen(true)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setScheduleToEdit(schedule)
    setIsSheetOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!scheduleToDelete) return
    deleteSchedule(scheduleToDelete.id)
    setScheduleToDelete(null)
  }

  const eligibleFor = (roleId?: string) =>
    roleId ? members.filter((m) => m.roleIds.includes(roleId) && m.status === 'Ativo') : []

  const leitorRole = roles.find((r) => r.name === 'Leitor')

  const { page, setPage, totalPages, paginatedItems } = usePagination(schedules, PAGE_SIZE)

  const scheduledDays = useMemo(() => schedules.map((s) => new Date(s.date)), [schedules])

  const schedulesForSelectedDay = useMemo(
    () => (selectedDate ? schedules.filter((s) => isSameDay(new Date(s.date), selectedDate)) : []),
    [schedules, selectedDate],
  )

  const renderCard = (schedule: Schedule) => (
    <ScheduleCard
      key={schedule.id}
      schedule={schedule}
      roles={roles}
      eligibleFor={eligibleFor}
      leitorRoleId={leitorRole?.id}
      onEdit={handleEditSchedule}
      onDelete={setScheduleToDelete}
      onSubstituteAssignment={substituteAssignment}
      onSubstituteLeitor={substituteLeitor}
    />
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Escalas</h2>
          <p className="text-muted-foreground">Planeje e visualize as missas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => exportSchedulesToCsv(schedules, roles, members)}
            disabled={schedules.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button onClick={handleAddSchedule}>
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
          {paginatedItems.map(renderCard)}
          {schedules.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">
              Nenhuma escala cadastrada ainda.
            </Card>
          )}
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <Card className="p-3 w-fit mx-auto lg:mx-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                modifiers={{ hasSchedule: scheduledDays }}
                modifiersClassNames={{
                  hasSchedule: 'bg-primary/15 font-semibold text-primary',
                }}
              />
            </Card>
            <div className="space-y-4">
              {!selectedDate && (
                <Card className="flex items-center justify-center p-12 text-muted-foreground">
                  Selecione um dia marcado no calendário para ver as escalas.
                </Card>
              )}
              {selectedDate && schedulesForSelectedDay.length === 0 && (
                <Card className="flex items-center justify-center p-12 text-muted-foreground">
                  Nenhuma escala em{' '}
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.
                </Card>
              )}
              {schedulesForSelectedDay.map(renderCard)}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AddScheduleSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        scheduleToEdit={scheduleToEdit}
      />

      <AlertDialog open={!!scheduleToDelete} onOpenChange={(o) => !o && setScheduleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{scheduleToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {scheduleToDelete &&
                `Escala de ${format(new Date(scheduleToDelete.date), "dd 'de' MMMM", { locale: ptBR })}. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
