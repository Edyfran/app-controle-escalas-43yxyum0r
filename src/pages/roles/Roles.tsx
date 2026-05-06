import { Mic, BookOpen, HeartHandshake, Music } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useAppStore from '@/stores/main'

const iconMap: Record<string, any> = { Mic, BookOpen, HeartHandshake, Music }

export default function Roles() {
  const { roles } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Funções Litúrgicas</h2>
          <p className="text-muted-foreground">Tipos de ministérios exercidos na celebração.</p>
        </div>
        <Button variant="outline">Adicionar Função</Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = iconMap[role.iconName] || BookOpen

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
                <Button variant="link" className="px-0 mt-4 h-auto text-primary">
                  Editar permissões
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
