import { describe, it, expect } from 'vitest'
import { confirmationBadgeClass } from './confirmation-status'

describe('confirmationBadgeClass', () => {
  it('returns emerald/success classes for Confirmado', () => {
    expect(confirmationBadgeClass('Confirmado')).toContain('emerald')
  })

  it('returns destructive classes for Recusado', () => {
    expect(confirmationBadgeClass('Recusado')).toContain('destructive')
  })

  it('returns a neutral muted class for Pendente', () => {
    expect(confirmationBadgeClass('Pendente')).toBe('text-muted-foreground')
  })
})
