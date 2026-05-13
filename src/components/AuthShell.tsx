import Link from 'next/link'
import type { PropsWithChildren } from 'react'

import { Container } from './Container'

type AuthShellProps = PropsWithChildren<{
  title: string
  subtitle?: string
  footer?: React.ReactNode
}>

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <section className="py-20">
      <Container className="max-w-md">
        <Link
          href="/"
          className="text-sm italic text-ink-soft hover:text-tomato"
        >
          ← Au fil des semis
        </Link>
        <h1 className="mt-8 font-serif text-4xl text-green-deep md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 font-serif text-lg italic text-ink-soft">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-10">{children}</div>
        {footer ? (
          <div className="mt-10 border-t border-green-soft/40 pt-6 text-sm text-ink-soft">
            {footer}
          </div>
        ) : null}
      </Container>
    </section>
  )
}

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
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 w-full rounded-soft border border-green-soft/60 bg-cream-warm px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
      />
    </label>
  )
}

export function SubmitButton({ children }: PropsWithChildren) {
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#234034]"
    >
      {children}
    </button>
  )
}

export function FormMessage({
  error,
  ok,
  message,
}: {
  error?: string
  ok?: boolean
  message?: string
}) {
  if (!error && !ok && !message) return null
  if (error) {
    return (
      <p className="rounded-soft border border-tomato/40 bg-tomato/[0.06] p-3 text-sm text-tomato">
        {error}
      </p>
    )
  }
  return (
    <p className="rounded-soft border border-green-sage/40 bg-green-sage/10 p-3 text-sm text-green-deep">
      {message}
    </p>
  )
}
