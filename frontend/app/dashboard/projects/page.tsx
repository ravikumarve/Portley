'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Plus, Calendar, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'review' | 'completed' | 'paused'
  due_date: string | null
  created_at: string
  client: {
    id: string
    name: string
  } | null
  task_count: number
  completed_task_count: number
  progress_pct: number
  unread_messages: number
}

const statusColors = {
  active: 'bg-success',
  review: 'bg-warning',
  completed: 'bg-accent',
  paused: 'bg-text-3',
}

const statusLabels = {
  active: 'Active',
  review: 'In Review',
  completed: 'Completed',
  paused: 'Paused',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProjects()
  }, [filter, sortBy])

  const loadProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name)
        `)
        .not('status', 'eq', 'deleted')

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate stats for each project
      const projectsWithStats = await Promise.all(
        (data || []).map(async (project) => {
          const [tasksCount, unreadCount] = await Promise.all([
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .not('read_by', 'cs', `{${(await supabase.auth.getUser()).data.user?.id}}`),
          ])

          const completedTasks = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('completed', true)

          const total = tasksCount.count || 0
          const completed = completedTasks.count || 0

          return {
            ...project,
            task_count: total,
            completed_task_count: completed,
            progress_pct: total > 0 ? (completed / total) * 100 : 0,
            unread_messages: unreadCount.count || 0,
          }
        })
      )

      // Sort projects
      const sorted = [...projectsWithStats].sort((a, b) => {
        if (sortBy === 'created') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        } else if (sortBy === 'due_date') {
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        } else if (sortBy === 'name') {
          return a.name.localeCompare(b.name)
        }
        return 0
      })

      setProjects(sorted)
    } catch (error) {
      console.error('Failed to load projects:', error)
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

  const formatDate = (date: string | null) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-text-2 mt-1">Manage your client projects</p>
        </div>
        <Button onClick={() => router.push('/dashboard/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(['all', 'active', 'review', 'completed', 'paused'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : statusLabels[status]}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as string)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-border bg-surface">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md">
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-text-2 mb-4">
                {filter === 'all' 
                  ? 'Create your first project to get started'
                  : `No ${statusLabels[filter as keyof typeof statusLabels]?.toLowerCase()} projects found`
                }
              </p>
              {filter === 'all' && (
                <Button onClick={() => router.push('/dashboard/projects/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="border-border bg-surface hover:border-accent/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                    {project.client && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(project.client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-text-2">{project.client.name}</span>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/projects/${project.id}`)
                      }}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/projects/${project.id}?tab=messages`)
                      }}>
                        Messages
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        statusColors[project.status]
                      )}
                    >
                      {statusLabels[project.status]}
                    </Badge>
                    {project.unread_messages > 0 && (
                      <div className="flex items-center gap-1 text-xs text-accent">
                        <MessageSquare className="h-3 w-3" />
                        <span>{project.unread_messages}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-2">
                        {project.completed_task_count}/{project.task_count} tasks
                      </span>
                      <span className="font-medium">{Math.round(project.progress_pct)}%</span>
                    </div>
                    <Progress value={project.progress_pct} className="h-2" />
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-2 text-xs text-text-2">
                    <Calendar className="h-3 w-3" />
                    <span className={cn(
                      isOverdue(project.due_date) && project.status !== 'completed' && 'text-danger'
                    )}>
                      {formatDate(project.due_date)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
