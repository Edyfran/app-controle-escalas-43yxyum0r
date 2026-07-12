import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChangePasswordCard } from '@/components/ChangePasswordCard'
import useAppStore from '@/stores/main'

export default function Settings() {
  const { parishName, parishDiocese, updateParish } = useAppStore()
  const [name, setName] = useState('')
  const [diocese, setDiocese] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setName(parishName ?? '')
    setDiocese(parishDiocese ?? '')
  }, [parishName, parishDiocese])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await updateParish({ name, diocese })
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Ajuste as preferências da sua paróquia.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil da Paróquia</CardTitle>
          <CardDescription>Informações básicas sobre a comunidade.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parish">Nome da Paróquia</Label>
              <Input id="parish" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diocese">Diocese/Arquidiocese</Label>
              <Input
                id="diocese"
                value={diocese}
                onChange={(e) => setDiocese(e.target.value)}
                placeholder="Ex: Arquidiocese de São Paulo"
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </form>
      </Card>

      <ChangePasswordCard />

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Configure como os membros são avisados das escalas.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            A integração com WhatsApp estará disponível na próxima atualização.
          </p>
          <Button variant="outline" disabled>
            Conectar WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
