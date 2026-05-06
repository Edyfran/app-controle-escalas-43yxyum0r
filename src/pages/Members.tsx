import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, UserCheck, UserX } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function Members() {
  const { members, roles, addMember } = useAppContext()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [open, setOpen] = useState(false)

  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRoles, setNewRoles] = useState<string[]>([])

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || m.roles.includes(roleFilter)
    return matchesSearch && matchesRole
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    addMember({
      name: newName,
      phone: newPhone,
      roles: newRoles,
      status: 'active',
    })
    toast({ title: 'Membro adicionado', description: `${newName} foi cadastrado com sucesso.` })
    setOpen(false)
    setNewName('')
    setNewPhone('')
    setNewRoles([])
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Membros</h1>
          <p className="text-slate-500 mt-1">Gerencie as informações da equipe litúrgica.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Cadastrar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Membro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-base">Funções Preferenciais</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {roles.map((r) => (
                    <div key={r.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${r.id}`}
                        checked={newRoles.includes(r.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setNewRoles([...newRoles, r.id])
                          else setNewRoles(newRoles.filter((id) => id !== r.id))
                        }}
                      />
                      <Label htmlFor={`role-${r.id}`} className="font-medium cursor-pointer">
                        {r.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Cadastro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-10 bg-slate-50 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[220px] bg-slate-50 border-slate-200">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Nome</TableHead>
              <TableHead className="font-semibold text-slate-700">Contato</TableHead>
              <TableHead className="font-semibold text-slate-700">Funções</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id} className="hover:bg-slate-50/50">
                <TableCell className="font-semibold text-slate-900">{member.name}</TableCell>
                <TableCell className="text-slate-600">{member.phone || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {member.roles.map((rId) => {
                      const role = roles.find((r) => r.id === rId)
                      if (!role) return null
                      return (
                        <Badge
                          key={rId}
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                        >
                          {role.name}
                        </Badge>
                      )
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {member.status === 'active' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none inline-flex items-center shadow-none">
                      <UserCheck className="w-3.5 h-3.5 mr-1" /> Ativo
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-slate-500 inline-flex items-center bg-slate-50 shadow-none"
                    >
                      <UserX className="w-3.5 h-3.5 mr-1" /> Inativo
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredMembers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  Nenhum membro encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
