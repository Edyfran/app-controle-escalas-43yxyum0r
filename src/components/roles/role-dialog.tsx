import { useEffect, useState } from 'react'
import { Mic, BookOpen, HeartHandshake, Music, Users, Heart, Star, Bell, Cross, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import useAppStore from '@/stores/main'
import { Role } from '@/types'

export const ROLE_ICONS: Record<string, any> = {
  Mic,
  BookOpen,
  HeartHandshake,
  Music,
  Users,
  Heart,
  Star,
  Bell,
  Cross,
  Sparkles,
}

export const ROLE_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
]

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  roleToEdit?: Role | null
}

export function RoleDialog({ open, onOpenChange, roleToEdit }: Props) {
  const { addRole, updateRole } = useAppStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconName, setIconName] = useState('Mic')
  const [color, setColor] = useState(ROLE_COLORS[0])

  useEffect(() => {
    if (!open) return

    if (roleToEdit) {
      setName(roleToEdit.name)
      setDescription(roleToEdit.description)
      setIconName(roleToEdit.iconName)
      setColor(roleToEdit.color)
    } else {
      setName('')
      setDescription('')
      setIconName('Mic')
      setColor(ROLE_COLORS[0])
    }
  }, [open, roleToEdit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    if (roleToEdit) {
      updateRole(roleToEdit.id, { name, description, iconName, color })
    } else {
      addRole({ name, description, iconName, color })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{roleToEdit ? 'Editar Função' : 'Nova Função'}</DialogTitle>
            <DialogDescription>
              {roleToEdit
                ? 'Atualize as informações desta função litúrgica.'
                : 'Cadastre uma nova função litúrgica.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Nome</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Acólito"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role-description">Descrição</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que essa função faz na celebração"
              />
            </div>
            <div className="grid gap-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(ROLE_ICONS).map(([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIconName(key)}
                    className={cn(
                      'flex items-center justify-center rounded-md border p-2 hover:bg-muted transition-colors',
                      iconName === key && 'border-primary ring-2 ring-primary/30',
                    )}
                  >
                    <Icon className="size-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {ROLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-8 rounded-md transition-transform',
                      c,
                      color === c && 'ring-2 ring-offset-2 ring-primary scale-105',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Função</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
