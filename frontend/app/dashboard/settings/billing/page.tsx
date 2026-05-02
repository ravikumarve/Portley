'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Check, Loader2, ArrowRight, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface Agency {
  id: string
  name: string
  plan: string
  plan_expires_at: string | null
}

interface UsageStats {
  clients_used: number
  clients_limit: number
  projects_used: number
  projects_limit: number
  storage_used: number
  storage_limit: number
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '2 clients',
      '3 projects',
      '500MB storage',
      'Basic features',
    ],
    cta: 'Current Plan',
    featured: false,
  },
  {
    id: 'solo',
    name: 'Solo',
    price: '$19',
    period: '/month',
    features: [
      'Unlimited clients',
      'Unlimited projects',
      '5GB storage',
      'White-label branding',
      'Invoicing',
      'Approvals',
      'AI features',
    ],
    cta: 'Upgrade',
    featured: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$49',
    period: '/month',
    features: [
      'Everything in Solo',
      '20GB storage',
      '5 team members',
      'Custom domain',
      'Priority support',
    ],
    cta: 'Upgrade',
    featured: false,
  },
]

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get agency
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (agencyData) {
        setAgency(agencyData)

        // Calculate usage stats
        const [clientsCount, projectsCount, filesData] = await Promise.all([
          supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', agencyData.id),
          supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', agencyData.id)
            .not('status', 'eq', 'deleted'),
          supabase
            .from('files')
            .select('size_bytes')
            .eq('agency_id', agencyData.id)
            .is_('deleted_at', 'null'),
        ])

        const storageUsed = filesData.data?.reduce((sum, file) => sum + (file.size_bytes || 0), 0) || 0

        // Get limits based on plan
        const limits = {
          free: { clients: 2, projects: 3, storage: 500 * 1024 * 1024 },
          solo: { clients: Infinity, projects: Infinity, storage: 5 * 1024 * 1024 * 1024 },
          agency: { clients: Infinity, projects: Infinity, storage: 20 * 1024 * 1024 * 1024 },
        }

        const planLimits = limits[agencyData.plan as keyof typeof limits] || limits.free

        setUsage({
          clients_used: clientsCount.count || 0,
          clients_limit: planLimits.clients,
          projects_used: projectsCount.count || 0,
          projects_limit: planLimits.projects,
          storage_used: storageUsed,
          storage_limit: planLimits.storage,
        })
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
    try {
      // TODO: Integrate with Razorpay/Stripe for payment
      toast.info('Payment integration coming soon!')
    } catch (error) {
      console.error('Failed to upgrade:', error)
      toast.error('Failed to process upgrade. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatStorage = (bytes: number) => {
    if (bytes === Infinity) return 'Unlimited'
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)}GB`
  }

  const formatStorageUsed = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)}GB`
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === Infinity) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-text-3',
      solo: 'bg-accent',
      agency: 'bg-success',
    }
    return colors[plan as keyof typeof colors] || 'bg-text-3'
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-text-2 mt-1">
          Manage your plan and payment methods
        </p>
      </div>

      {/* Current Plan Card */}
      {agency && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">{agency.name}</h3>
                  <Badge className={getPlanColor(agency.plan)}>
                    {agency.plan.charAt(0).toUpperCase() + agency.plan.slice(1)} Plan
                  </Badge>
                </div>
                {agency.plan_expires_at && (
                  <p className="text-sm text-text-2">
                    Renews on {formatDate(agency.plan_expires_at)}
                  </p>
                )}
              </div>
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Stats */}
      {usage && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Clients</span>
                <span className="text-sm text-text-2">
                  {usage.clients_used} / {usage.clients_limit === Infinity ? '∞' : usage.clients_limit}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(usage.clients_used, usage.clients_limit)}
                className="h-2"
              />
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Projects</span>
                <span className="text-sm text-text-2">
                  {usage.projects_used} / {usage.projects_limit === Infinity ? '∞' : usage.projects_limit}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(usage.projects_used, usage.projects_limit)}
                className="h-2"
              />
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-text-2">
                  {formatStorageUsed(usage.storage_used)} / {formatStorage(usage.storage_limit)}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(usage.storage_used, usage.storage_limit)}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`border-border bg-surface ${
                plan.featured ? 'border-2 border-accent' : ''
              }`}
            >
              {plan.featured && (
                <div className="bg-accent text-white text-center py-1 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-text-2">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.featured ? 'default' : 'outline'}
                  disabled={agency?.plan === plan.id || loading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : agency?.plan === plan.id ? (
                    'Current Plan'
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
