import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/main'
import { Schedule } from '@/types'
import { autoFillSchedule, AutoFillSlot } from '@/lib/auto-schedule'
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  scheduleToEdit?: Schedule | null
}

export function AddScheduleSheet({ open, onOpenChange, scheduleToEdit }: Props) {
  const { roles, members, schedules, addSchedule, updateSchedule } = useAppStore()
  const [title, setTitle] = useState('Missa Dominical')
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState('19:00')
  const [status, setStatus] = useState<Schedule['status']>('Pendente')
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [leitor1, setLeitor1] = useState<string>('none')
  const [leitor2, setLeitor2] = useState<string>('none')

  useEffect(() => {
    if (!open) return

    if (scheduleToEdit) {
      setTitle(scheduleToEdit.title)
      setDate(new Date(scheduleToEdit.date))
      setTime(scheduleToEdit.time)
      setStatus(scheduleToEdit.status)
      setAssignments(
        Object.fromEntries(
          scheduleToEdit.assignments.map((a) => [a.roleId, a.memberId ?? 'none']),
        ),
      )
      setLeitor1(scheduleToEdit.leitor1 ?? 'none')
      setLeitor2(scheduleToEdit.leitor2 ?? 'none')
    } else {
      setTitle('Missa Dominical')
      setDate(new Date())
      setTime('19:00')
      setStatus('Pendente')
      setAssignments({})
      setLeitor1('none')
      setLeitor2('none')
    }
  }, [open, scheduleToEdit])

  // Soft warning only — small parishes sometimes genuinely need the same volunteer twice.
  const currentSelections: { slotKey: string; memberId: string }[] = [
    ...Object.entries(assignments)
      .filter(([, memberId]) => memberId && memberId !== 'none')
      .map(([roleId, memberId]) => ({ slotKey: `role:${roleId}`, memberId })),
    ...(leitor1 !== 'none' ? [{ slotKey: 'leitor1', memberId: leitor1 }] : []),
    ...(leitor2 !== 'none' ? [{ slotKey: 'leitor2', memberId: leitor2 }] : []),
  ]

  const isSelectedElsewhere = (memberId: string, currentSlotKey: string) =>
    currentSelections.some((s) => s.memberId === memberId && s.slotKey !== currentSlotKey)

  const handleAutoFill = () => {
    const leitorRole = roles.find((r) => r.name === 'Leitor')
    const slots: AutoFillSlot[] = [
      ...roles
        .filter((r) => r.name !== 'Leitor')
        .map((r) => ({
          key: `role:${r.id}`,
          roleId: r.id,
          currentMemberId: assignments[r.id] && assignments[r.id] !== 'none' ? assignments[r.id] : null,
        })),
      ...(leitorRole
        ? [
            {
              key: 'leitor1',
              roleId: leitorRole.id,
              currentMemberId: leitor1 !== 'none' ? leitor1 : null,
            },
            {
              key: 'leitor2',
              roleId: leitorRole.id,
              currentMemberId: leitor2 !== 'none' ? leitor2 : null,
            },
          ]
        : []),
    ]

    const { suggestions, unfilled } = autoFillSchedule({ date, time, slots, roles, members, schedules })
    const filledCount = Object.keys(suggestions).length

    if (filledCount === 0) {
      toast({
        title: 'Nada para preencher',
        description:
          unfilled.length > 0
            ? 'Nenhum membro disponível (função, disponibilidade ou regra de semana seguida) para as vagas em aberto.'
            : 'Todas as funções já estão escaladas.',
      })
      return
    }

    setAssignments((prev) => {
      const next = { ...prev }
      for (const [key, memberId] of Object.entries(suggestions)) {
        if (key.startsWith('role:')) next[key.slice('role:'.length)] = memberId
      }
      return next
    })
    if (suggestions.leitor1) setLeitor1(suggestions.leitor1)
    if (suggestions.leitor2) setLeitor2(suggestions.leitor2)

    toast({
      title: `${filledCount} ${filledCount === 1 ? 'vaga preenchida' : 'vagas preenchidas'} automaticamente`,
      description:
        unfilled.length > 0
          ? `${unfilled.length} ${unfilled.length === 1 ? 'vaga não teve' : 'vagas não tiveram'} membro disponível. Revise antes de salvar.`
          : 'Revise as sugestões antes de salvar.',
    })
  }

  const handleSave = () => {
    const formattedAssignments = roles
      .filter((r) => r.name !== 'Leitor')
      .map((r) => {
        const existing = scheduleToEdit?.assignments.find((a) => a.roleId === r.id)
        return {
          id: existing?.id ?? Math.random().toString(),
          roleId: r.id,
          memberId: assignments[r.id] && assignments[r.id] !== 'none' ? assignments[r.id] : null,
          confirmationStatus: existing?.confirmationStatus ?? ('Pendente' as const),
        }
      })

    const scheduleData = {
      title,
      date: date.toISOString(),
      time,
      status,
      assignments: formattedAssignments,
      leitor1: leitor1 !== 'none' ? leitor1 : null,
      leitor1Status: scheduleToEdit?.leitor1Status ?? ('Pendente' as const),
      leitor2: leitor2 !== 'none' ? leitor2 : null,
      leitor2Status: scheduleToEdit?.leitor2Status ?? ('Pendente' as const),
    }

    if (scheduleToEdit) {
      updateSchedule(scheduleToEdit.id, scheduleData)
    } else {
      addSchedule(scheduleData)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{scheduleToEdit ? 'Editar Escala' : 'Nova Escala'}</SheetTitle>
          <SheetDescription>Configure a celebração e escale os membros.</SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Detalhes da Celebração</h3>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'dd/MM/yyyy') : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Schedule['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-medium">Escalar Equipe</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAutoFill}>
                <Wand2 className="mr-2 h-3.5 w-3.5" /> Preencher Automaticamente
              </Button>
            </div>
            {roles.map((role) => {
              if (role.name === 'Leitor') {
                const leitorMembers = members.filter(
                  (m) =>
                    m.roleIds.includes(role.id) &&
                    m.status === 'Ativo' &&
                    m.approvalStatus === 'Aprovado',
                )
                return (
                  <div key="leitores" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Leitor 1</Label>
                      <Select value={leitor1} onValueChange={setLeitor1}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o Leitor 1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Deixar vago</SelectItem>
                          {leitorMembers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                              {isSelectedElsewhere(m.id, 'leitor1') && ' (já escalado)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Leitor 2 (Opcional)</Label>
                      <Select value={leitor2} onValueChange={setLeitor2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o Leitor 2" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Deixar vago</SelectItem>
                          {leitorMembers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                              {isSelectedElsewhere(m.id, 'leitor2') && ' (já escalado)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              }
              return (
                <div key={role.id} className="space-y-2">
                  <Label>{role.name}</Label>
                  <Select
                    value={assignments[role.id] || 'none'}
                    onValueChange={(v) => setAssignments((prev) => ({ ...prev, [role.id]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Deixar vago</SelectItem>
                      {members
                        .filter(
                          (m) =>
                            m.roleIds.includes(role.id) &&
                            m.status === 'Ativo' &&
                            m.approvalStatus === 'Aprovado',
                        )
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                            {isSelectedElsewhere(m.id, `role:${role.id}`) && ' (já escalado)'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </div>
        <SheetFooter className="pt-4">
          <Button onClick={handleSave} className="w-full">
            {scheduleToEdit ? 'Salvar Alterações' : 'Salvar Escala'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
