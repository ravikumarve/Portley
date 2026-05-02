'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, MoreVertical, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskList } from '@/components/projects/TaskList'
import { FileList } from '@/components/files/FileList'
import { MessageThread } from '@/components/messages/MessageThread'
import { ApprovalList } from '@/components/approvals/ApprovalList'

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

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name)
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error

      // Calculate task stats
      const [tasksCount, completedTasks] = await Promise.all([
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('completed', true),
      ])

      const total = tasksCount.count || 0
      const completed = completedTasks.count || 0

      setProject({
        ...data,
        task_count: total,
        completed_task_count: completed,
        progress_pct: total > 0 ? (completed / total) * 100 : 0,
      })
    } catch (error) {
      console.error('Failed to load project:', error)
      router.push('/dashboard/projects')
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
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Project not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  statusColors[project.status]
                )}
              >
                {statusLabels[project.status]}
              </Badge>
            </div>
            {project.client && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(project.client.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-text-2">{project.client.name}</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Project
        </Button>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-text-2">Progress</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {project.completed_task_count}/{project.task_count}
                </span>
                <span className="text-sm text-text-2">
                  {Math.round(project.progress_pct)}%
                </span>
              </div>
              <Progress value={project.progress_pct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-text-2">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-text-3" />
                <span className={cn(
                  'text-lg font-semibold',
                  isOverdue(project.due_date) && project.status !== 'completed' && 'text-danger'
                )}>
                  {formatDate(project.due_date)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-text-2">Created</p>
              <p className="text-lg font-semibold">
                {new Date(project.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-2 whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <TaskList projectId={projectId} />
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <FileList projectId={projectId} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <MessageThread projectId={projectId} />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <ApprovalList projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
