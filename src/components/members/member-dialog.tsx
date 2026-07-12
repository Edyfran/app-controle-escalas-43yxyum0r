import { useState, useEffect, useRef } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  memberToEdit?: Member | null
}

export function MemberDialog({ open, onOpenChange, memberToEdit }: Props) {
  const { addMember, updateMember, roles, uploadMemberPhoto } = useAppStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [availability, setAvailability] = useState('Semanal')
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (memberToEdit) {
        setName(memberToEdit.name)
        setPhone(memberToEdit.phone)
        setEmail(memberToEdit.email || '')
        setAvailability(memberToEdit.availability)
        setRoleIds(memberToEdit.roleIds || [])
        setNotes(memberToEdit.notes || '')
        setAvatarUrl(memberToEdit.avatarUrl)
      } else {
        setName('')
        setPhone('')
        setEmail('')
        setAvailability('Semanal')
        setRoleIds([])
        setNotes('')
        setAvatarUrl('')
      }
    }
  }, [open, memberToEdit])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploadingPhoto(true)
    const { url, error } = await uploadMemberPhoto(file)
    setIsUploadingPhoto(false)

    if (error || !url) {
      toast({ title: 'Erro ao enviar foto', description: error ?? undefined, variant: 'destructive' })
      return
    }
    setAvatarUrl(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return

    if (memberToEdit) {
      updateMember(memberToEdit.id, {
        name,
        phone,
        email,
        availability: availability as any,
        roleIds,
        notes,
        avatarUrl,
      })
    } else {
      addMember({
        name,
        phone,
        email,
        availability: availability as any,
        status: 'Ativo',
        roleIds,
        notes,
        avatarUrl:
          avatarUrl ||
          `https://img.usecurling.com/ppl/thumbnail?gender=${Math.random() > 0.5 ? 'male' : 'female'}&seed=${Math.floor(Math.random() * 100)}`,
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
            <div className="flex flex-col items-center gap-2">
              <Avatar className="size-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{name.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                <Camera className="mr-2 h-4 w-4" />
                {isUploadingPhoto ? 'Enviando...' : 'Alterar Foto'}
              </Button>
            </div>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="membro@email.com"
              />
              <p className="text-xs text-muted-foreground">
                Usado pelo membro para criar acesso ao portal e confirmar suas escalas.
              </p>
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
