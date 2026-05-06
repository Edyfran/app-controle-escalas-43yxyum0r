import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function AddScheduleSheet({ open, onOpenChange }: Props) {
  const { roles, members, addSchedule } = useAppStore()
  const [title, setTitle] = useState('Missa Dominical')
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState('19:00')
  const [assignments, setAssignments] = useState<Record<string, string>>({})

  const handleSave = () => {
    const formattedAssignments = roles.map((r) => ({
      id: Math.random().toString(),
      roleId: r.id,
      memberId: assignments[r.id] || null,
    }))

    addSchedule({
      title,
      date: date.toISOString(),
      time,
      status: 'Pendente',
      assignments: formattedAssignments,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Escala</SheetTitle>
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
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Escalar Equipe</h3>
            {roles.map((role) => (
              <div key={role.id} className="space-y-2">
                <Label>{role.name}</Label>
                <Select
                  value={assignments[role.id]}
                  onValueChange={(v) => setAssignments((prev) => ({ ...prev, [role.id]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um membro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Deixar vago</SelectItem>
                    {members
                      .filter((m) => m.roleIds.includes(role.id) && m.status === 'Ativo')
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
        <SheetFooter className="pt-4">
          <Button onClick={handleSave} className="w-full">
            Salvar Escala
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
