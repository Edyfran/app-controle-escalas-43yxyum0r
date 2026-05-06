import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Settings() {
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parish">Nome da Paróquia</Label>
            <Input id="parish" defaultValue="Paróquia São José" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diocese">Diocese/Arquidiocese</Label>
            <Input id="diocese" defaultValue="Arquidiocese de São Paulo" />
          </div>
          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

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
