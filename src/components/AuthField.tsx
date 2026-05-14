'use client'

import { useState } from 'react'

export function AuthField({
  label,
  name,
  type = 'text',
  required = true,
  autoComplete,
  defaultValue,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  defaultValue?: string
  placeholder?: string
}) {
  const isPassword = type === 'password'
  const [revealed, setRevealed] = useState(false)
  const inputType = isPassword && revealed ? 'text' : type

  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </span>
      <div className="relative mt-2">
        <input
          name={name}
          type={inputType}
          required={required}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={`w-full rounded-soft border border-green-soft/60 bg-cream-warm px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30 ${
            isPassword ? 'pr-12' : ''
          }`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={
              revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-soft transition-colors hover:text-green-deep focus:outline-none focus:text-green-deep"
            tabIndex={-1}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
    </label>
  )
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.45 18.45 0 0 1-3.27 4.27" />
      <path d="M6.61 6.61A18.45 18.45 0 0 0 2 11s3.5 7 10 7a10.94 10.94 0 0 0 5.39-1.39" />
      <path d="m2 2 20 20" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    </svg>
  )
}
