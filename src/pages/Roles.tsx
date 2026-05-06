import { useAppContext } from '@/contexts/app-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Mic, BookOpen, MessageCircleHeart, Music, Bookmark } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Mic: <Mic className="w-8 h-8 text-indigo-500" />,
  BookOpen: <BookOpen className="w-8 h-8 text-emerald-500" />,
  MessageCircleHeart: <MessageCircleHeart className="w-8 h-8 text-purple-500" />,
  Music: <Music className="w-8 h-8 text-amber-500" />,
  default: <Bookmark className="w-8 h-8 text-slate-500" />,
}

export default function Roles() {
  const { roles, members } = useAppContext()

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Funções Litúrgicas</h1>
        <p className="text-slate-500 mt-1">
          Conheça e gerencie as funções disponíveis para as celebrações.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const membersWithRole = members.filter(
            (m) => m.roles.includes(role.id) && m.status === 'active',
          ).length
          return (
            <Card
              key={role.id}
              className="hover:shadow-md transition-all duration-300 group border-slate-200"
            >
              <CardHeader className="flex flex-row items-center gap-5">
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {iconMap[role.icon] || iconMap['default']}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">{role.name}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    <span className="text-slate-900 font-bold">{membersWithRole}</span> membros
                    ativos
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
