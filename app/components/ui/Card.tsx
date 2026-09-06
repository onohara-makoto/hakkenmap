import type { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react'

type Padding = 'none' | 'sm' | 'md'
type Radius = 'md' | 'lg' | 'xl'

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
}

const radii: Record<Radius, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
}

type CardOwnProps = {
  as?: ElementType
  padding?: Padding
  radius?: Radius
  interactive?: boolean
  children: ReactNode
}

export type CardProps = CardOwnProps & Omit<ComponentPropsWithoutRef<'div'>, keyof CardOwnProps>

export function Card({
  as: Component = 'div',
  padding = 'md',
  radius = 'lg',
  interactive,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    'bg-surface shadow-md',
    paddings[padding],
    radii[radius],
    interactive ? 'transition-shadow hover:shadow-lg focus-ring' : '',
    className,
  ].join(' ')

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}
