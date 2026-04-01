// AnimatedCard.tsx — Epic 5: Reusable animated card wrapper

import { motion } from 'framer-motion'
import type { TargetAndTransition, VariantLabels, Transition } from 'framer-motion'
import type { ReactNode, CSSProperties } from 'react'

type AnimateValue = TargetAndTransition | VariantLabels | undefined

export interface AnimatedCardProps {
  layoutId?: string
  layout?: boolean
  initial?: AnimateValue | boolean
  animate?: AnimateValue
  exit?: AnimateValue
  transition?: Transition
  whileHover?: AnimateValue
  style?: CSSProperties
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function AnimatedCard({
  layoutId,
  layout = false,
  initial,
  animate,
  exit,
  transition,
  whileHover,
  style,
  className,
  children,
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout={layout}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      whileHover={whileHover}
      style={{ willChange: 'transform', ...style }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
