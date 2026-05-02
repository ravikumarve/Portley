'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { FolderKanban, FileText, MessageSquare, Receipt, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  due_date: string | null
  task_count: number
  completed_task_count: number
  progress_pct: number
}

interface Agency {
  name: string
  logo_url: string | null
  brand_color: string
}

export default function ClientPortalPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadPortalData()
  }, [])

  const loadPortalData = async () => {
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

      // Get client's projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', client.id)
        .not('status', 'eq', 'deleted')

      // Calculate stats for each project
      const projectsWithStats = await Promise.all(
        (projectsData || []).map(async (project) => {
          const [tasksCount, completedTasks] = await Promise.all([
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id),
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .eq('completed', true),
          ])

          const total = tasksCount.count || 0
          const completed = completedTasks.count || 0

          return {
            ...project,
            task_count: total,
            completed_task_count: completed,
            progress_pct: total > 0 ? (completed / total) * 100 : 0,
          }
        })
      )

      setProjects(projectsWithStats)
    } catch (error) {
      console.error('Failed to load portal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-2">Loading...</div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {agency?.logo_url ? (
                <img
                  src={agency.logo_url}
                  alt={agency.name}
                  className="h-10 w-10 rounded"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded text-white font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {getInitials(agency?.name || 'Agency')}
                </div>
              )}
              <div>
                <h1 className="font-semibold text-lg">{agency?.name || 'Agency'}</h1>
                <p className="text-xs text-text-2">Client Portal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Projects</h2>
          <p className="text-text-2">
            Track progress, view files, and communicate with your agency
          </p>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="border-border bg-surface">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <FolderKanban className="h-12 w-12 text-text-3 mx-auto mb-4" />
                <p className="text-text-2 mb-2">No projects yet</p>
                <p className="text-sm text-text-3">
                  Your agency will assign projects to you soon
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="border-border bg-surface hover:border-accent/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/portal/projects/${project.id}`)}
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-text-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          statusColors[project.status as keyof typeof statusColors]
                        )}
                      >
                        {statusLabels[project.status as keyof typeof statusLabels]}
                      </Badge>
                      <span className="text-xs text-text-3">
                        {formatDate(project.due_date)}
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-2">
                          {project.completed_task_count}/{project.task_count} tasks
                        </span>
                        <span className="font-medium">{Math.round(project.progress_pct)}%</span>
                      </div>
                      <Progress
                        value={project.progress_pct}
                        className="h-2"
                        style={{
                          '--progress-value': brandColor,
                        } as React.CSSProperties}
                      />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/portal/projects/${project.id}?tab=files`)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Files
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/portal/projects/${project.id}?tab=messages`)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Invoices Link */}
        <div className="mt-8">
          <Card className="border-border bg-surface hover:border-accent/50 transition-colors cursor-pointer">
            <CardContent
              className="p-6"
              onClick={() => router.push('/portal/invoices')}
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${brandColor}20` }}
                >
                  <Receipt className="h-6 w-6" style={{ color: brandColor }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">View Invoices</h3>
                  <p className="text-sm text-text-2">
                    See your invoices and payment history
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
