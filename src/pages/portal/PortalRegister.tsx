import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import useAppStore from '@/stores/main'
import { toast } from '@/hooks/use-toast'

export default function PortalRegister() {
  const navigate = useNavigate()
  const { signUpMember } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error, needsEmailConfirmation } = await signUpMember(email, password)
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
              Use o mesmo email que seu coordenador cadastrou na sua ficha para vincular sua
              conta automaticamente.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
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
