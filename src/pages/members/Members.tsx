import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { MemberDialog } from '@/components/members/member-dialog'
import { PaginationControls } from '@/components/PaginationControls'
import { usePagination } from '@/hooks/use-pagination'
import useAppStore from '@/stores/main'
import { AvailabilitySlot, Member } from '@/types'

const PAGE_SIZE = 10

const DAY_ABBR: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' }
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function summarizeAvailability(slots: AvailabilitySlot[]): string {
  if (slots.length === 0) return 'Disponibilidade não informada'
  const manha = slots.filter((s) => s.period === 'Manha').map((s) => s.dayOfWeek)
  const noite = slots.filter((s) => s.period === 'Noite').map((s) => s.dayOfWeek)
  const format = (days: number[]) =>
    DAY_ORDER.filter((d) => days.includes(d))
      .map((d) => DAY_ABBR[d])
      .join(', ')
  const parts: string[] = []
  if (manha.length > 0) parts.push(`Manhã: ${format(manha)}`)
  if (noite.length > 0) parts.push(`Noite: ${format(noite)}`)
  return parts.join(' · ')
}

export default function Members() {
  const { members, roles, schedules, deleteMember, approveMember, rejectMember } = useAppStore()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)

  const pendingMembers = members.filter((m) => m.approvalStatus === 'Pendente')

  const filteredMembers = members.filter(
    (m) =>
      m.approvalStatus === 'Aprovado' &&
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (roleFilter === 'all' || m.roleIds.includes(roleFilter)) &&
      (availabilityFilter === 'all' || m.availability === availabilityFilter),
  )

  const { page, setPage, totalPages, paginatedItems } = usePagination(filteredMembers, PAGE_SIZE)

  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, availabilityFilter])

  const handleAddMember = () => {
    setMemberToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEditMember = (member: Member) => {
    setMemberToEdit(member)
    setIsDialogOpen(true)
  }

  const scheduleUsageFor = (memberId: string) =>
    schedules.filter(
      (s) =>
        s.assignments.some((a) => a.memberId === memberId) ||
        s.leitor1 === memberId ||
        s.leitor2 === memberId,
    ).length

  const handleConfirmDelete = () => {
    if (!memberToDelete) return
    deleteMember(memberToDelete.id)
    setMemberToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Membros da Pastoral</h2>
          <p className="text-muted-foreground">Gerencie o cadastro e disponibilidades.</p>
        </div>
        <Button onClick={handleAddMember}>
          <Plus className="mr-2 h-4 w-4" /> Cadastrar Membro
        </Button>
      </div>

      {pendingMembers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
            <CardDescription>
              Membros que se cadastraram sozinhos com o código de convite e aguardam sua aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email} {member.phone && `· ${member.phone}`}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {member.roleIds.length > 0 ? (
                        member.roleIds.map((rid) => {
                          const role = roles.find((r) => r.id === rid)
                          return role ? (
                            <Badge key={rid} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          ) : null
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Nenhuma função escolhida</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summarizeAvailability(member.availabilitySlots)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => approveMember(member.id)}>
                    <Check className="mr-1 h-4 w-4" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => rejectMember(member.id)}
                  >
                    <X className="mr-1 h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 max-w-sm flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="Função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="Disponibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as frequências</SelectItem>
            <SelectItem value="Semanal">Semanal</SelectItem>
            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
            <SelectItem value="Mensal">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.name}</span>
                </TableCell>
                <TableCell>{member.phone}</TableCell>
                <TableCell className="flex gap-1 flex-wrap">
                  {member.roleIds && member.roleIds.length > 0 ? (
                    member.roleIds.map((rid) => {
                      const role = roles.find((r) => r.id === rid)
                      return role ? (
                        <Badge key={rid} variant="secondary" className="text-xs">
                          {role.name}
                        </Badge>
                      ) : null
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Nenhuma função</span>
                  )}
                </TableCell>
                <TableCell>{member.availability}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      member.status === 'Ativo'
                        ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                        : 'text-muted-foreground'
                    }
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setMemberToDelete(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredMembers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />

      <MemberDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        memberToEdit={memberToEdit}
      />

      <AlertDialog open={!!memberToDelete} onOpenChange={(o) => !o && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{memberToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToDelete &&
                (() => {
                  const scheduleCount = scheduleUsageFor(memberToDelete.id)
                  const linkedNote = memberToDelete.email
                    ? ' Se ele tiver acesso ao portal, perderá o vínculo com a paróquia.'
                    : ''
                  if (scheduleCount === 0) {
                    return `Esta ação não pode ser desfeita.${linkedNote}`
                  }
                  return `Ele está escalado em ${scheduleCount} celebração(ões) — essas vagas ficarão em aberto. Esta ação não pode ser desfeita.${linkedNote}`
                })()}
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
