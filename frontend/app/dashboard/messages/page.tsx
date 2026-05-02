'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MessageSquare, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Conversation {
  project_id: string
  project_name: string
  client_name: string
  last_message: string
  last_message_time: string
  unread_count: number
  total_messages: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!agency) return

      // Get all projects with clients
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          created_at,
          client:clients(name)
        `)
        .eq('agency_id', agency.id)
        .not('status', 'eq', 'deleted')

      if (!projects) return

      // Get conversations for each project
      const conversationsData = await Promise.all(
        projects.map(async (project) => {
          const [messagesData, unreadCount] = await Promise.all([
            supabase
              .from('messages')
              .select('*')
              .eq('project_id', project.id)
              .order('created_at', { ascending: false })
              .limit(1),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .not('read_by', 'cs', `{${user.id}}`),
          ])

          const lastMessage = messagesData.data?.[0]
          const totalMessages = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)

          return {
            project_id: project.id,
            project_name: project.name,
            client_name: project.client?.[0]?.name || 'Unknown',
            last_message: lastMessage?.content || 'No messages yet',
            last_message_time: lastMessage?.created_at || project.created_at,
            unread_count: unreadCount.count || 0,
            total_messages: totalMessages.count || 0,
          }
        })
      )

      // Sort by last message time
      const sorted = conversationsData.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      )

      setConversations(sorted)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (date: string) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diffMs = now.getTime() - messageDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatTime(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-text-2 mt-1">
          Unified inbox for all your projects
        </p>
      </div>

      {/* Conversations List */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>All Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-text-3 mx-auto mb-4" />
                <p className="text-text-2 mb-2">No conversations yet</p>
                <p className="text-sm text-text-3">
                  Start a conversation in any project to see it here
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Unread</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow
                    key={conversation.project_id}
                    className={cn(
                      'cursor-pointer hover:bg-surface2 transition-colors',
                      conversation.unread_count > 0 && 'bg-surface2/50'
                    )}
                    onClick={() => router.push(`/dashboard/projects/${conversation.project_id}?tab=messages`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-accent" />
                        </div>
                        <span className="font-medium">{conversation.project_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(conversation.client_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{conversation.client_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-text-2 truncate">
                        {conversation.last_message}
                      </p>
                    </TableCell>
                    <TableCell className="text-text-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(conversation.last_message_time)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {conversation.unread_count > 0 ? (
                        <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                          {conversation.unread_count}
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-center text-text-3">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
