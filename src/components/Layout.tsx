import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'

export default function Layout() {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col bg-secondary/30 overflow-y-auto">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
