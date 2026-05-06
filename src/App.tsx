import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/main'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Members from '@/pages/members/Members'
import Roles from '@/pages/roles/Roles'
import Schedules from '@/pages/schedules/Schedules'
import Settings from '@/pages/settings/Settings'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/membros" element={<Members />} />
            <Route path="/funcoes" element={<Roles />} />
            <Route path="/escalas" element={<Schedules />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppProvider>
  </BrowserRouter>
)

export default App
