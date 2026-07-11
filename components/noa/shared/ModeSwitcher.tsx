'use client'

export type ViewMode = 'classic' | 'cinematic'

interface ModeSwitcherProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

/** Toggle Classique / Cinématique — flottant au-dessus des deux modes du CV de Noa. */
export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div className="noa-mode-switch" role="tablist" aria-label="Mode de visualisation">
      {(
        [
          { key: 'classic', label: '📄 Classique' },
          { key: 'cinematic', label: '🎬 Cinématique' },
        ] as const
      ).map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="tab"
          aria-selected={mode === opt.key}
          className={mode === opt.key ? 'on' : ''}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
