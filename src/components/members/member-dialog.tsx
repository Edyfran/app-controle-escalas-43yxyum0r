import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import useAppStore from '@/stores/main'
import { Member } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  memberToEdit?: Member | null
}

export function MemberDialog({ open, onOpenChange, memberToEdit }: Props) {
  const { addMember, updateMember, roles } = useAppStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [availability, setAvailability] = useState('Semanal')
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      if (memberToEdit) {
        setName(memberToEdit.name)
        setPhone(memberToEdit.phone)
        setAvailability(memberToEdit.availability)
        setRoleIds(memberToEdit.roleIds || [])
        setNotes(memberToEdit.notes || '')
      } else {
        setName('')
        setPhone('')
        setAvailability('Semanal')
        setRoleIds([])
        setNotes('')
      }
    }
  }, [open, memberToEdit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return

    if (memberToEdit) {
      updateMember(memberToEdit.id, {
        name,
        phone,
        availability: availability as any,
        roleIds,
        notes,
      })
    } else {
      addMember({
        name,
        phone,
        availability: availability as any,
        status: 'Ativo',
        roleIds,
        notes,
        avatarUrl: `https://img.usecurling.com/ppl/thumbnail?gender=${Math.random() > 0.5 ? 'male' : 'female'}&seed=${Math.floor(Math.random() * 100)}`,
      })
    }

    onOpenChange(false)
  }

  const toggleRole = (roleId: string) => {
    setRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{memberToEdit ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
            <DialogDescription>
              {memberToEdit
                ? 'Atualize as informações do membro da pastoral.'
                : 'Cadastre um novo membro na pastoral litúrgica.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="availability">Disponibilidade</Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger id="availability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Funções Litúrgicas</Label>
              <div className="grid grid-cols-2 gap-3 mt-1 p-3 border rounded-md bg-muted/20">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={roleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <Label htmlFor={`role-${role.id}`} className="font-normal cursor-pointer">
                      {role.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Detalhes adicionais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Membro</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
