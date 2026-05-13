'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type ComboboxOption = {
  value: string
  label: string
  sublabel?: string
}

type Props = {
  name: string
  options: ComboboxOption[]
  label: string
  placeholder?: string
  defaultValue?: string
  required?: boolean
  emptyMessage?: string
}

// Combobox cherchable, sans dépendance. Garde une UX clavier complète
// (↑/↓/Entrée/Échap) et synchronise un <input type="hidden"> pour rester
// compatible avec les server actions / FormData côté Next.
export function Combobox({
  name,
  options,
  label,
  placeholder = 'Cherche…',
  defaultValue = '',
  required = false,
  emptyMessage = 'Aucun résultat',
}: Props) {
  const id = useId()
  const listboxId = `${id}-listbox`
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initial = options.find((o) => o.value === defaultValue)
  const [query, setQuery] = useState(initial?.label ?? '')
  const [selected, setSelected] = useState<ComboboxOption | null>(initial ?? null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || (selected && selected.label === query)) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)),
    )
  }, [query, options, selected])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        // Si on a tapé sans choisir, on revient à la dernière valeur valide.
        if (selected) setQuery(selected.label)
        else setQuery('')
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, selected])

  function commit(option: ComboboxOption) {
    setSelected(option)
    setQuery(option.label)
    setOpen(false)
    setHighlight(0)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && filtered[highlight]) {
        e.preventDefault()
        commit(filtered[highlight])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      if (selected) setQuery(selected.label)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={`${id}-input`} className="block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          {label}
        </span>
      </label>
      <div className="relative mt-2">
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full rounded-soft border border-green-soft/60 bg-cream-warm px-4 py-3 pr-10 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
        />
        {selected ? (
          <button
            type="button"
            onClick={() => {
              setSelected(null)
              setQuery('')
              setOpen(true)
              inputRef.current?.focus()
            }}
            aria-label="Effacer"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-soft hover:bg-cream hover:text-tomato"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
        )}
      </div>

      {/* Valeur réelle envoyée au server action */}
      <input
        type="hidden"
        name={name}
        value={selected?.value ?? ''}
        required={required}
      />

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-soft border border-green-soft/60 bg-cream shadow-leaf"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm italic text-ink-soft">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((option, idx) => {
              const isHighlight = idx === highlight
              const isSelected = selected?.value === option.value
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    // mousedown avant le blur de l'input
                    e.preventDefault()
                    commit(option)
                  }}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`cursor-pointer px-4 py-2.5 transition-colors ${
                    isHighlight
                      ? 'bg-green-deep text-white'
                      : isSelected
                        ? 'bg-green-soft/40 text-green-deep'
                        : 'text-ink hover:bg-cream-warm'
                  }`}
                >
                  <div className="font-serif text-base">{option.label}</div>
                  {option.sublabel ? (
                    <div
                      className={`text-xs italic ${
                        isHighlight ? 'text-white/70' : 'text-ink-soft'
                      }`}
                    >
                      {option.sublabel}
                    </div>
                  ) : null}
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
