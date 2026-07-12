import { ConfirmationStatus } from '@/types'

export function confirmationBadgeClass(status: ConfirmationStatus) {
  if (status === 'Confirmado') return 'text-emerald-600 border-emerald-200 bg-emerald-50'
  if (status === 'Recusado') return 'text-destructive border-destructive/20 bg-destructive/10'
  return 'text-muted-foreground'
}
