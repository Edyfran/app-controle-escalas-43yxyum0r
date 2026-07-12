import { StatCards } from '@/components/dashboard/stat-cards'
import { NextCelebration } from '@/components/dashboard/next-celebration'
import { UpcomingSchedules } from '@/components/dashboard/upcoming-schedules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAppStore from '@/stores/main'

export default function Index() {
  const { members } = useAppStore()
  // `members` comes back oldest-first (ordered by created_at ascending in the store); slice a
  // copy of the tail and reverse that copy so "recent" actually means most recently added.
  const recentMembers = members.slice(-4).reverse()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Painel Principal</h2>
        <p className="text-muted-foreground">Resumo das atividades da pastoral litúrgica.</p>
      </div>

      <StatCards />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
          <NextCelebration />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <UpcomingSchedules />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Membros Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.availability}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
