import { ChangePasswordCard } from '@/components/ChangePasswordCard'

export default function PortalAccount() {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Minha Conta</h2>
        <p className="text-muted-foreground">Gerencie o acesso à sua conta.</p>
      </div>
      <ChangePasswordCard />
    </div>
  )
}
