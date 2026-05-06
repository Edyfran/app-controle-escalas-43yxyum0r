import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarDays, Plus, Share2, Users } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function Schedules() {
  const { schedules, roles, members, addSchedule } = useAppContext()
  const [open, setOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [assignments, setAssignments] = useState<Record<string, string>>({})

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date || !time) return

    const newAssignments = Object.entries(assignments)
      .filter(([_, memberId]) => memberId !== 'none')
      .map(([roleId, memberId]) => ({ roleId, memberId }))

    addSchedule({
      title,
      date,
      time,
      assignments: newAssignments,
    })

    toast({ title: 'Escala criada', description: 'A escala foi salva com sucesso.' })
    setOpen(false)
    setTitle('')
    setDate('')
    setTime('')
    setAssignments({})
  }

  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Escalas</h1>
          <p className="text-slate-500 mt-1">Organize as escalas das próximas celebrações.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Nova Escala
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Criar Nova Escala</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-semibold text-slate-700">Título da Celebração</Label>
                    <Input
                      placeholder="Ex: Missa de Domingo"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Data</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Horário</Label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-lg text-slate-900">Distribuição de Funções</h3>
                  </div>

                  {roles.map((role) => {
                    const availableMembers = members.filter(
                      (m) => m.roles.includes(role.id) && m.status === 'active',
                    )
                    const assignedMemberIds = Object.values(assignments).filter(
                      (id) => id !== 'none',
                    )

                    return (
                      <div
                        key={role.id}
                        className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Label className="md:text-right font-medium text-slate-700">
                          {role.name}
                        </Label>
                        <div className="md:col-span-2">
                          <Select
                            value={assignments[role.id] || 'none'}
                            onValueChange={(val) =>
                              setAssignments((prev) => ({ ...prev, [role.id]: val }))
                            }
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Selecione um membro" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-slate-400 italic">
                                Deixar vago
                              </SelectItem>
                              {availableMembers.map((m) => {
                                const isAssignedElsewhere =
                                  assignedMemberIds.includes(m.id) && assignments[role.id] !== m.id
                                return (
                                  <SelectItem
                                    key={m.id}
                                    value={m.id}
                                    disabled={isAssignedElsewhere}
                                  >
                                    {m.name}{' '}
                                    {isAssignedElsewhere && (
                                      <span className="text-xs text-amber-500 ml-2">(Ocupado)</span>
                                    )}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Salvar Escala
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {sortedSchedules.map((schedule) => {
          const dateObj = parseISO(schedule.date)
          return (
            <Card
              key={schedule.id}
              className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow group"
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 flex flex-col items-center justify-center min-w-[160px] border-b md:border-b-0 md:border-r border-indigo-100 relative overflow-hidden">
                  <div className="absolute -left-4 -top-4 opacity-5">
                    <CalendarDays size={100} />
                  </div>
                  <span className="text-4xl font-extrabold text-indigo-700 tracking-tighter">
                    {format(dateObj, 'dd')}
                  </span>
                  <span className="text-sm font-bold uppercase text-indigo-500 tracking-widest">
                    {format(dateObj, 'MMMM', { locale: ptBR })}
                  </span>
                  <div className="mt-3 bg-white/60 px-3 py-1 rounded-full text-xs font-bold text-indigo-900 flex items-center shadow-sm">
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {schedule.time}
                  </div>
                </div>
                <div className="p-6 flex-1 bg-white">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {schedule.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600"
                    >
                      Editar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {roles.map((role) => {
                      const assignment = schedule.assignments.find((a) => a.roleId === role.id)
                      const member = assignment
                        ? members.find((m) => m.id === assignment.memberId)
                        : null

                      return (
                        <div
                          key={role.id}
                          className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 relative overflow-hidden"
                        >
                          <div
                            className={`absolute top-0 left-0 w-1 h-full ${member ? 'bg-indigo-400' : 'bg-amber-400'}`}
                          ></div>
                          <div className="text-[11px] text-slate-500 font-bold mb-1 uppercase tracking-wider pl-2">
                            {role.name}
                          </div>
                          <div
                            className={`font-semibold pl-2 ${member ? 'text-slate-900 text-sm' : 'text-amber-600 text-sm italic'}`}
                          >
                            {member ? member.name : 'Vaga Aberta'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
        {sortedSchedules.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Nenhuma escala cadastrada</h3>
            <p className="text-slate-500 mt-1">
              Crie sua primeira escala para começar a organizar.
            </p>
            <Button
              className="mt-6 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Criar Escala
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
