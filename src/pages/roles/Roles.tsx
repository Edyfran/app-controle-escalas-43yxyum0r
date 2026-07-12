import { useState } from 'react'
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { RoleDialog, ROLE_ICONS } from '@/components/roles/role-dialog'
import useAppStore from '@/stores/main'
import { Role } from '@/types'

export default function Roles() {
  const { roles, members, schedules, deleteRole } = useAppStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const handleAddRole = () => {
    setRoleToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setRoleToEdit(role)
    setIsDialogOpen(true)
  }

  const usageFor = (role: Role) => {
    const memberCount = members.filter((m) => m.roleIds.includes(role.id)).length
    const assignmentCount = schedules.reduce(
      (acc, s) => acc + s.assignments.filter((a) => a.roleId === role.id).length,
      0,
    )
    const leitorScheduleCount =
      role.name === 'Leitor' ? schedules.filter((s) => s.leitor1 || s.leitor2).length : 0
    return { memberCount, scheduleCount: assignmentCount + leitorScheduleCount }
  }

  const handleConfirmDelete = () => {
    if (!roleToDelete) return
    deleteRole(roleToDelete.id)
    setRoleToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Funções Litúrgicas</h2>
          <p className="text-muted-foreground">Tipos de ministérios exercidos na celebração.</p>
        </div>
        <Button variant="outline" onClick={handleAddRole}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Função
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role.iconName] || BookOpen

          return (
            <Card key={role.id} className="group hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div
                  className={`p-3 rounded-lg text-white ${role.color} shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{role.description}</CardDescription>
                <div className="flex items-center gap-1 mt-4 -ml-3">
                  <Button
                    variant="link"
                    className="px-3 h-auto text-primary"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit2 className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="link"
                    className="px-3 h-auto text-destructive"
                    onClick={() => setRoleToDelete(role)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <RoleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} roleToEdit={roleToEdit} />

      <AlertDialog open={!!roleToDelete} onOpenChange={(o) => !o && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{roleToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {roleToDelete &&
                (() => {
                  const { memberCount, scheduleCount } = usageFor(roleToDelete)
                  if (memberCount === 0 && scheduleCount === 0) {
                    return 'Esta função não está em uso. Esta ação não pode ser desfeita.'
                  }
                  return `Esta função está vinculada a ${memberCount} membro(s) e ${scheduleCount} designação(ões) em escalas. Excluí-la também removerá essas vinculações. Esta ação não pode ser desfeita.`
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
