'use client'

import Link from 'next/link'
import { forwardRef } from 'react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-[opacity,box-shadow,background-color] focus-ring disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-primary hover:opacity-90',
  secondary: 'bg-secondary-soft text-secondary-ink hover:opacity-90',
  ghost: 'bg-surface text-ink border border-line hover:opacity-80',
  danger: 'bg-danger text-on-primary hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm rounded-md px-3 py-1.5',
  md: 'text-base rounded-lg px-4 py-2.5',
  lg: 'text-lg rounded-xl px-5 py-3.5',
}

type CommonProps = {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  fullWidth?: boolean
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & { href?: undefined }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'href'> & { href: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', loading, iconLeft, fullWidth, children, ...rest },
    ref
  ) {
    const classes = [
      base,
      variants[variant],
      sizes[size],
      fullWidth ? 'w-full' : '',
    ].join(' ')

    if ('href' in rest && rest.href) {
      const { href, ...anchorRest } = rest as ButtonAsLink
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          aria-busy={loading || undefined}
          {...anchorRest}
        >
          {iconLeft}
          {children}
        </Link>
      )
    }

    const { type = 'button', ...buttonRest } = rest as ButtonAsButton
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={classes}
        aria-busy={loading || undefined}
        disabled={loading || buttonRest.disabled}
        {...buttonRest}
      >
        {iconLeft}
        {children}
      </button>
    )
  }
)
