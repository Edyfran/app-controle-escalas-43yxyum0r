import { useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function ForgotPassword() {
  const { requestPasswordReset } = useAppStore()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await requestPasswordReset(email)
    setIsSubmitting(false)

    if (error) {
      toast({ title: 'Erro ao solicitar redefinição', description: error, variant: 'destructive' })
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl mb-2">
            <BookOpen className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Informe seu email e enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          {sent ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Se existir uma conta com esse email, um link de redefinição foi enviado. Confira
                sua caixa de entrada.
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
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
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="text-sm text-center text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-medium">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
