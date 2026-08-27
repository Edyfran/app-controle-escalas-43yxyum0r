import { useEffect, useRef, useState } from 'react'
import { BookOpen, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChangePasswordCard } from '@/components/ChangePasswordCard'
import useAppStore from '@/stores/main'
import { toast } from '@/hooks/use-toast'
import { hexToHslTriplet, hslTripletToHex } from '@/lib/color'
import { DEFAULT_THEME, THEME_COLOR_FIELDS, ThemeColors } from '@/lib/theme'

export default function Settings() {
  const {
    parishName,
    parishDiocese,
    parishJoinCode,
    parishLogoUrl,
    parishTheme,
    updateParish,
    uploadParishLogo,
  } = useAppStore()
  const [name, setName] = useState('')
  const [diocese, setDiocese] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isSavingTheme, setIsSavingTheme] = useState(false)
  const [pendingTheme, setPendingTheme] = useState<ThemeColors>(parishTheme ?? DEFAULT_THEME)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(parishName ?? '')
    setDiocese(parishDiocese ?? '')
  }, [parishName, parishDiocese])

  useEffect(() => {
    setPendingTheme(parishTheme ?? DEFAULT_THEME)
  }, [parishTheme])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await updateParish({ name, diocese })
    setIsSubmitting(false)
  }

  const handleCopyJoinCode = async () => {
    if (!parishJoinCode) return
    await navigator.clipboard.writeText(parishJoinCode)
    toast({ title: 'Código copiado', description: 'Compartilhe com os membros da pastoral.' })
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploadingLogo(true)
    const { url, error } = await uploadParishLogo(file)
    setIsUploadingLogo(false)

    if (error || !url) {
      toast({ title: 'Erro ao enviar logo', description: error ?? undefined, variant: 'destructive' })
      return
    }
    await updateParish({ logoUrl: url })
  }

  const handleRemoveLogo = async () => {
    await updateParish({ logoUrl: null })
  }

  const handleColorFieldChange = (key: keyof ThemeColors, hex: string) => {
    setPendingTheme((prev) => ({ ...prev, [key]: hexToHslTriplet(hex) }))
  }

  const handleSaveTheme = async () => {
    setIsSavingTheme(true)
    await updateParish({ theme: pendingTheme })
    setIsSavingTheme(false)
  }

  const handleResetTheme = async () => {
    setIsSavingTheme(true)
    await updateParish({ theme: null })
    setIsSavingTheme(false)
  }

  const previewStyle = {
    '--background': pendingTheme.background,
    '--foreground': '222 47% 11%',
    '--card': pendingTheme.card,
    '--card-foreground': '222 47% 11%',
    '--primary': pendingTheme.primary,
    '--primary-foreground': '210 40% 98%',
    '--secondary': pendingTheme.secondary,
    '--secondary-foreground': '222 47% 11%',
    '--muted': pendingTheme.muted,
    '--muted-foreground': '215 16% 47%',
    '--accent': pendingTheme.accent,
    '--accent-foreground': '222 47% 11%',
    '--border': pendingTheme.border,
  } as React.CSSProperties

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

      <Card>
        <CardHeader>
          <CardTitle>Personalização</CardTitle>
          <CardDescription>
            Escolha o logo e as cores usadas no aplicativo e no portal dos membros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {parishLogoUrl ? (
                <img
                  src={parishLogoUrl}
                  alt="Logo da paróquia"
                  className="h-16 w-16 rounded-lg border object-contain bg-white"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <BookOpen className="size-7" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? 'Enviando...' : 'Alterar Logo'}
                </Button>
                {parishLogoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemoveLogo}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <Label>Cores do Tema</Label>
                {parishTheme ? (
                  <Badge variant="secondary" className="text-xs">Personalizado</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Padrão</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                As alterações só valem para o app depois de clicar em "Salvar Cores". Cores de
                texto são ajustadas automaticamente para manter a leitura legível.
                {parishTheme && ' Clique em "Restaurar padrão" para voltar às cores originais do app.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {THEME_COLOR_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3 rounded-md border p-2">
                  <input
                    type="color"
                    value={hslTripletToHex(pendingTheme[field.key])}
                    onChange={(e) => handleColorFieldChange(field.key, e.target.value)}
                    className="h-9 w-9 shrink-0 rounded border cursor-pointer bg-transparent"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{field.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleSaveTheme} disabled={isSavingTheme}>
                {isSavingTheme ? 'Salvando...' : 'Salvar Cores'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleResetTheme} disabled={isSavingTheme}>
                Restaurar padrão
              </Button>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização</p>
              <div style={previewStyle} className="rounded-lg border p-4">
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{ backgroundColor: 'hsl(var(--background))' }}
                >
                  <div
                    className="rounded-md p-3 space-y-2"
                    style={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                  >
                    <p className="text-sm font-semibold">Cartão de exemplo</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Assim ficará o texto secundário.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <span
                        className="text-xs px-3 py-1.5 rounded-md font-medium"
                        style={{
                          backgroundColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                        }}
                      >
                        Botão Principal
                      </span>
                      <span
                        className="text-xs px-3 py-1.5 rounded-md font-medium"
                        style={{
                          backgroundColor: 'hsl(var(--secondary))',
                          color: 'hsl(var(--secondary-foreground))',
                        }}
                      >
                        Secundário
                      </span>
                      <span
                        className="text-xs px-3 py-1.5 rounded-md font-medium border"
                        style={{
                          backgroundColor: 'hsl(var(--accent))',
                          color: 'hsl(var(--accent-foreground))',
                          borderColor: 'hsl(var(--border))',
                        }}
                      >
                        Destaque
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convite para Membros</CardTitle>
          <CardDescription>
            Compartilhe este código com os membros da pastoral para que eles criem o próprio
            acesso ao portal (o cadastro fica pendente até você aprovar).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={parishJoinCode ?? ''} readOnly className="font-mono tracking-wider" />
            <Button type="button" variant="outline" size="icon" onClick={handleCopyJoinCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
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
