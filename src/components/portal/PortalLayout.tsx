import { Outlet, useNavigate, Link } from 'react-router-dom'
import { BookOpen, LogOut, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAppStore from '@/stores/main'

export default function PortalLayout() {
  const navigate = useNavigate()
  const { parishName, signOut } = useAppStore()

  const handleLogout = async () => {
    await signOut()
    navigate('/portal/entrar')
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <BookOpen className="size-5" />
          </div>
          <span className="font-bold tracking-tight">{parishName ?? 'Portal do Membro'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portal/conta">
              <UserCog className="mr-2 h-4 w-4" /> Minha Conta
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
