import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WeeklyAvailabilityPicker } from '@/components/members/weekly-availability-picker'
import useAppStore from '@/stores/main'
import { toast } from '@/hooks/use-toast'
import { AvailabilitySlot, Role } from '@/types'

export default function PortalRegister() {
  const navigate = useNavigate()
  const { signUpMember, fetchRolesForJoinCode } = useAppStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const code = joinCode.trim()
    if (code.length < 4) {
      setAvailableRoles([])
      return
    }
    const timeout = setTimeout(async () => {
      const foundRoles = await fetchRolesForJoinCode(code)
      setAvailableRoles(foundRoles)
      setRoleIds((prev) => prev.filter((id) => foundRoles.some((r) => r.id === id)))
    }, 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode])

  const toggleRole = (roleId: string) => {
    setRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error, needsEmailConfirmation } = await signUpMember(
      email,
      password,
      name,
      phone,
      joinCode,
      roleIds,
      availabilitySlots,
    )
    setIsSubmitting(false)

    if (error) {
      toast({ title: 'Erro ao criar acesso', description: error, variant: 'destructive' })
      return
    }

    if (needsEmailConfirmation) {
      toast({
        title: 'Confirme seu email',
        description: 'Enviamos um link de confirmação para o seu email.',
      })
      navigate('/portal/entrar')
      return
    }

    toast({
      title: 'Cadastro enviado!',
      description: 'Assim que o coordenador aprovar, você terá acesso às escalas.',
    })
    navigate('/portal')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl mb-2">
            <BookOpen className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Portal do Membro</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar Acesso</CardTitle>
            <CardDescription>
              Peça ao seu coordenador o código de convite da paróquia para se cadastrar.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinCode">Código da Paróquia</Label>
                <Input
                  id="joinCode"
                  placeholder="Ex: A1B2C3D4"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="uppercase"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Peça esse código ao coordenador da sua paróquia.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Crie uma senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {availableRoles.length > 0 && (
                <div className="space-y-2">
                  <Label>Funções que deseja exercer</Label>
                  <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-muted/20">
                    {availableRoles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={roleIds.includes(role.id)}
                          onCheckedChange={() => toggleRole(role.id)}
                        />
                        <Label htmlFor={`role-${role.id}`} className="font-normal cursor-pointer">
                          {role.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Dias e horários em que pode servir</Label>
                <p className="text-xs text-muted-foreground">
                  De segunda a sexta as missas são à noite. Aos sábados e domingos há missa de
                  manhã e à noite.
                </p>
                <WeeklyAvailabilityPicker
                  value={availabilitySlots}
                  onChange={setAvailabilitySlots}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Acesso'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Já tem senha?{' '}
                <Link to="/portal/entrar" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
