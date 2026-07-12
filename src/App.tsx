import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/main'
import {
  ProtectedRoute,
  PublicOnlyRoute,
  MemberProtectedRoute,
  MemberPublicOnlyRoute,
} from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import PortalLayout from '@/components/portal/PortalLayout'
import Index from '@/pages/Index'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Members from '@/pages/members/Members'
import Roles from '@/pages/roles/Roles'
import Schedules from '@/pages/schedules/Schedules'
import Settings from '@/pages/settings/Settings'
import PortalLogin from '@/pages/portal/PortalLogin'
import PortalRegister from '@/pages/portal/PortalRegister'
import MySchedule from '@/pages/portal/MySchedule'
import PortalAccount from '@/pages/portal/PortalAccount'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Unguarded: the emailed reset link creates a recovery session that must not be
              redirected away before the user gets a chance to set a new password. */}
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/membros" element={<Members />} />
              <Route path="/funcoes" element={<Roles />} />
              <Route path="/escalas" element={<Schedules />} />
              <Route path="/configuracoes" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<MemberPublicOnlyRoute />}>
            <Route path="/portal/entrar" element={<PortalLogin />} />
            <Route path="/portal/cadastro" element={<PortalRegister />} />
          </Route>

          <Route element={<MemberProtectedRoute />}>
            <Route element={<PortalLayout />}>
              <Route path="/portal" element={<MySchedule />} />
              <Route path="/portal/conta" element={<PortalAccount />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppProvider>
  </BrowserRouter>
)

export default App
