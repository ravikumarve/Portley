'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, CheckCircle, XCircle, FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskList } from '@/components/projects/TaskList'
import { FileList } from '@/components/files/FileList'
import { MessageThread } from '@/components/messages/MessageThread'
import { ApprovalList } from '@/components/approvals/ApprovalList'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  due_date: string | null
  created_at: string
  task_count: number
  completed_task_count: number
  progress_pct: number
}

interface Agency {
  name: string
  logo_url: string | null
  brand_color: string
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

export default function ClientProjectPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    // Set tab from URL query param
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get client record
      const { data: client } = await supabase
        .from('clients')
        .select('agency_id')
        .eq('user_id', user.id)
        .single()

      if (!client) {
        router.push('/auth/login')
        return
      }

      // Get agency branding
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('name, logo_url, brand_color')
        .eq('id', client.agency_id)
        .single()

      if (agencyData) {
        setAgency(agencyData)
      }

      // Get project
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('client_id', client.id)
        .single()

      if (error || !data) {
        router.push('/portal')
        return
      }

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
      router.push('/portal')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-2">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-2">Project not found</div>
      </div>
    )
  }

  const brandColor = agency?.brand_color || '#6366f1'

  return (
    <div className="min-h-screen bg-background">
      {/* Portal Header */}
      <header
        className="border-b"
        style={{ borderColor: `${brandColor}20` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/portal')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-lg">{project.name}</h1>
              <p className="text-xs text-text-2">{agency?.name || 'Agency'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
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
                  <Progress
                    value={project.progress_pct}
                    className="h-2"
                    style={{
                      '--progress-value': brandColor,
                    } as React.CSSProperties}
                  />
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
                  <p className="text-sm text-text-2">Status</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-sm',
                      statusColors[project.status as keyof typeof statusColors]
                    )}
                  >
                    {statusLabels[project.status as keyof typeof statusLabels]}
                  </Badge>
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
      </main>
    </div>
  )
}
