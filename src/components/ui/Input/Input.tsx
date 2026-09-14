import { useId } from 'react'

/**
 * Atomic input component.
 * Follows the Agenda Zero design system.
 *
 * Supports three visual states: default, focus, and error.
 * Label and error message are associated to the field via id/aria
 * for screen reader support.
 */

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-label font-medium text-fg1">
        {label}
      </label>

      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full rounded-md border px-4 py-3
          text-body text-fg1
          placeholder:text-placeholder
          outline-none [transition:var(--transition-fast)]
          disabled:cursor-not-allowed disabled:opacity-50
          ${
            error
              ? `
                bg-danger-soft border-danger
                focus:border-danger
                focus:ring-2 focus:ring-danger/20
              `
              : `
                bg-bg border-border-default
                focus:border-primary-focus-border
                focus:ring-2 focus:ring-primary-focus-shadow
              `
          }
        `}
        {...props}
      />

      {error && (
        <span id={errorId} className="text-caption text-danger">
          {error}
        </span>
      )}
    </div>
  )
}
