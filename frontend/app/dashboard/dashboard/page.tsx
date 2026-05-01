'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatCards } from '@/components/dashboard/StatCards'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { FolderKanban, Users, DollarSign, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [agency, setAgency] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    projects: 0,
    clients: 0,
    revenue: 0,
    pendingApprovals: 0,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUser(user)

        // Fetch agency data
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (agencyData) {
          setAgency(agencyData)

          // Fetch stats
          const [projectsCount, clientsCount, invoicesData, approvalsCount] = await Promise.all([
            supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('agency_id', agencyData.id)
              .not('status', 'eq', 'deleted'),
            supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('agency_id', agencyData.id),
            supabase
              .from('invoices')
              .select('amount')
              .eq('agency_id', agencyData.id)
              .eq('status', 'paid'),
            supabase
              .from('approvals')
              .select('*', { count: 'exact', head: true })
              .eq('agency_id', agencyData.id)
              .eq('status', 'pending'),
          ])

          const totalRevenue = invoicesData.data?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

          setStats({
            projects: projectsCount.count || 0,
            clients: clientsCount.count || 0,
            revenue: totalRevenue,
            pendingApprovals: approvalsCount.count || 0,
          })
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-2">Loading...</div>
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Good morning, {userName}.
        </h1>
        <p className="text-text-2">Here's what needs attention.</p>
      </div>

      {/* Stat Cards */}
      <StatCards
        stats={[
          {
            label: 'Projects',
            value: stats.projects,
            color: 'accent',
            icon: <FolderKanban className="h-6 w-6" />,
          },
          {
            label: 'Clients',
            value: stats.clients,
            color: 'success',
            icon: <Users className="h-6 w-6" />,
          },
          {
            label: 'Revenue',
            value: `₹${stats.revenue.toLocaleString()}`,
            color: 'warning',
            icon: <DollarSign className="h-6 w-6" />,
          },
          {
            label: 'Pending Approvals',
            value: stats.pendingApprovals,
            color: stats.pendingApprovals > 0 ? 'danger' : 'accent',
            icon: <AlertCircle className="h-6 w-6" />,
          },
        ]}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Projects</CardTitle>
              <Badge variant="secondary">{stats.projects}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {stats.projects === 0 ? (
              <div className="text-center text-text-2 py-8">
                No active projects yet
              </div>
            ) : (
              <div className="space-y-3">
                {/* Project items would be loaded here */}
                <div className="text-sm text-text-2">
                  Projects will appear here
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        {agency && (
          <ActivityFeed agencyId={agency.id} limit={5} />
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  )
}
