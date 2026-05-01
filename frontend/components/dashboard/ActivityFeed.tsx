'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  actor_name: string
  action: string
  entity_name: string
  created_at: string
}

interface ActivityFeedProps {
  agencyId?: string
  limit?: number
}

export function ActivityFeed({ agencyId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!agencyId) return

    const loadActivities = async () => {
      try {
        const { data } = await supabase
          .from('activity')
          .select('*')
          .eq('agency_id', agencyId)
          .order('created_at', { ascending: false })
          .limit(limit)

        setActivities(data || [])
      } catch (error) {
        console.error('Failed to load activities:', error)
      } finally {
        setLoading(false)
      }
    }

    loadActivities()

    // Subscribe to new activities
    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity',
          filter: `agency_id=eq.${agencyId}`
        },
        (payload) => {
          setActivities(prev => [payload.new as Activity, ...prev].slice(0, limit))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agencyId, limit, supabase])

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return '📝'
    if (action.includes('updated')) return '✏️'
    if (action.includes('deleted')) return '🗑️'
    if (action.includes('uploaded')) return '📎'
    if (action.includes('approved')) return '✅'
    if (action.includes('paid')) return '💰'
    if (action.includes('message')) return '💬'
    return '📌'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-text-2 py-8">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-text-2 py-8">
            No recent activity
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-surface2 text-xs">
                    {getInitials(activity.actor_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text">
                    <span className="font-medium">{activity.actor_name}</span>
                    {' '}
                    <span className="text-text-2">
                      {activity.action.replace('project.', '').replace('invoice.', '').replace('file.', '').replace('message.', '')}
                    </span>
                    {' '}
                    <span className="font-medium">{activity.entity_name}</span>
                  </p>
                  <p className="text-xs text-text-3 mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-lg flex-shrink-0">
                  {getActionIcon(activity.action)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
