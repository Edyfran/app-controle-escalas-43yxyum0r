import { contrastingForeground } from '@/lib/color'

// The set of "base" theme colors a coordinator can customize. Each is an "H S% L%" triplet
// (matching the app's CSS custom properties). Foreground/contrast colors are always derived from
// these at apply-time (see contrastingForeground in color.ts) rather than stored separately —
// that's what keeps a from-scratch color choice from accidentally producing unreadable text.
export interface ThemeColors {
  background: string
  card: string
  primary: string
  secondary: string
  muted: string
  accent: string
  border: string
}

// Mirrors the :root values in src/main.css — used both as the editor's starting point and as
// what "Restaurar padrão" resets back to.
export const DEFAULT_THEME: ThemeColors = {
  background: '15 40% 98%',
  card: '0 0% 100%',
  primary: '131 100% 14%',
  secondary: '39 98% 76%',
  muted: '0 9% 94%',
  accent: '0 7% 91%',
  border: '99 11% 76%',
}

export const THEME_COLOR_FIELDS: { key: keyof ThemeColors; label: string; description: string }[] = [
  { key: 'background', label: 'Fundo', description: 'Cor de fundo geral das páginas.' },
  { key: 'card', label: 'Cartões', description: 'Fundo de cartões, menus e caixas de conteúdo.' },
  { key: 'primary', label: 'Principal', description: 'Botões, links e destaques de ação.' },
  { key: 'secondary', label: 'Secundária', description: 'Elementos de apoio aos botões principais.' },
  { key: 'muted', label: 'Neutra', description: 'Áreas discretas, como fundos suaves.' },
  { key: 'accent', label: 'Destaque', description: 'Realces em itens selecionados ou em foco.' },
  { key: 'border', label: 'Bordas', description: 'Bordas de campos, cartões e divisores.' },
]

// Applies (or clears) a full custom theme onto a root element's inline style, deriving readable
// foreground/contrast colors for every background-ish slot instead of storing them separately.
// `--destructive` is deliberately never touched — it's a semantic safety color (error states),
// not a branding one, so it always stays whatever the stylesheet defines.
export function applyTheme(root: HTMLElement, theme: ThemeColors | null) {
  if (!theme) {
    ;[
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--popover-foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--accent-foreground',
      '--border',
      '--input',
      '--ring',
    ].forEach((prop) => root.style.removeProperty(prop))
    return
  }

  root.style.setProperty('--background', theme.background)
  root.style.setProperty('--foreground', contrastingForeground(theme.background))

  root.style.setProperty('--card', theme.card)
  root.style.setProperty('--card-foreground', contrastingForeground(theme.card))
  root.style.setProperty('--popover', theme.card)
  root.style.setProperty('--popover-foreground', contrastingForeground(theme.card))

  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--primary-foreground', contrastingForeground(theme.primary))

  root.style.setProperty('--secondary', theme.secondary)
  root.style.setProperty('--secondary-foreground', contrastingForeground(theme.secondary))

  root.style.setProperty('--muted', theme.muted)
  root.style.setProperty('--muted-foreground', contrastingForeground(theme.muted))

  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-foreground', contrastingForeground(theme.accent))

  root.style.setProperty('--border', theme.border)
  root.style.setProperty('--input', theme.border)
  root.style.setProperty('--ring', theme.primary)
}
