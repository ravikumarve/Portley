'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  color?: 'accent' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

export function StatCard({ label, value, color = 'accent', icon, trend }: StatCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000
      const steps = 60
      const increment = value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setAnimatedValue(value)
          clearInterval(timer)
        } else {
          setAnimatedValue(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [value])

  const displayValue = typeof value === 'number' ? animatedValue : value

  return (
    <Card className="border-border bg-surface">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-text-2 mb-2">{label}</p>
            <p className={cn('text-3xl font-bold', colorClasses[color])}>
              {displayValue}
            </p>
            {trend && (
              <p className={cn(
                'mt-2 text-xs',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% from last month
              </p>
            )}
          </div>
          {icon && (
            <div className={cn('ml-4', colorClasses[color])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardsProps {
  stats: Array<{
    label: string
    value: string | number
    color?: 'accent' | 'success' | 'warning' | 'danger'
    icon?: React.ReactNode
    trend?: {
      value: number
      isPositive: boolean
    }
  }>
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
