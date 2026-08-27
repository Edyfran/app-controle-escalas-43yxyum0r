import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Início', href: '/', icon: LayoutDashboard },
  { label: 'Escalas', href: '/escalas', icon: CalendarDays },
  { label: 'Membros', href: '/membros', icon: Users },
  { label: 'Funções', href: '/funcoes', icon: Shield },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session, parishName, parishLogoUrl, signOut } = useAppStore()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <Logo logoUrl={parishLogoUrl} />
          <div className="mt-8 flex flex-col gap-2">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href))
              return (
                <SidebarLink
                  key={item.label}
                  link={{
                    label: item.label,
                    href: item.href,
                    icon: (
                      <item.icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive ? 'text-primary' : 'text-foreground',
                        )}
                      />
                    ),
                  }}
                  className={cn(isActive && 'font-medium text-primary')}
                />
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <SidebarLink
            link={{
              label: parishName ?? 'Coordenador',
              href: '/configuracoes',
              icon: (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage
                    src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=99"
                    alt={parishName ?? 'Coordenador'}
                  />
                  <AvatarFallback>{(parishName ?? session?.user.email ?? '?').charAt(0)}</AvatarFallback>
                </Avatar>
              ),
            }}
          />
          <SidebarLink
            link={{
              label: 'Sair',
              href: '/login',
              icon: <LogOut className="h-5 w-5 shrink-0 text-foreground" />,
            }}
            onClick={(e) => {
              e.preventDefault()
              handleLogout()
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  )
}

const Logo = ({ logoUrl }: { logoUrl: string | null }) => {
  const { open } = useSidebar()
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-lg shrink-0 object-contain bg-white" />
      ) : (
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shrink-0">
          <BookOpen className="size-5" />
        </div>
      )}
      {open && (
        <span className="font-bold text-lg tracking-tight whitespace-pre text-foreground">
          LiturgiaSync
        </span>
      )}
    </Link>
  )
}
