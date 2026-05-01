'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FolderKanban, UserPlus, Receipt, Plus } from 'lucide-react'

interface QuickAction {
  label: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'outline'
}

export function QuickActions() {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: 'New Project',
      description: 'Create a new project for your client',
      icon: <FolderKanban className="h-5 w-5" />,
      onClick: () => router.push('/dashboard/projects/new'),
      variant: 'default',
    },
    {
      label: 'Invite Client',
      description: 'Send an invite to a new client',
      icon: <UserPlus className="h-5 w-5" />,
      onClick: () => router.push('/dashboard/clients/invite'),
      variant: 'outline',
    },
    {
      label: 'New Invoice',
      description: 'Create and send an invoice',
      icon: <Receipt className="h-5 w-5" />,
      onClick: () => router.push('/dashboard/invoices/new'),
      variant: 'outline',
    },
  ]

  return (
    <Card className="border-border bg-surface">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto flex-col items-start p-4 text-left"
              onClick={action.onClick}
            >
              <div className="mb-2">{action.icon}</div>
              <div className="font-semibold">{action.label}</div>
              <div className="text-xs text-text-2 mt-1">
                {action.description}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
