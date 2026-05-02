'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Approval {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'approved' | 'changes_requested'
  client_note: string | null
  file: {
    id: string
    name: string
    download_url: string
  } | null
  created_at: string
  responded_at: string | null
}

interface ApprovalListProps {
  projectId: string
}

const statusColors = {
  pending: 'bg-warning',
  approved: 'bg-success',
  changes_requested: 'bg-danger',
}

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  changes_requested: 'Changes Requested',
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  changes_requested: XCircle,
}

export function ApprovalList({ projectId }: ApprovalListProps) {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_id: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState<Array<{ id: string; name: string }>>([])
  const supabase = createClient()

  useEffect(() => {
    loadApprovals()
    loadFiles()
  }, [projectId])

  const loadApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          file:files(id, name, storage_path)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get download URLs for files
      const approvalsWithUrls = await Promise.all(
        (data || []).map(async (approval) => {
          let downloadUrl = null
          if (approval.file?.storage_path) {
            const { data: { publicUrl } } = supabase.storage
              .from('portley-files')
              .getPublicUrl(approval.file.storage_path)
            downloadUrl = publicUrl
          }

          return {
            ...approval,
            file: approval.file ? {
              ...approval.file,
              download_url: downloadUrl,
            } : null,
          }
        })
      )

      setApprovals(approvalsWithUrls)
    } catch (error) {
      console.error('Failed to load approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('id, name')
        .eq('project_id', projectId)
        .is_('deleted_at', 'null')

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const createApproval = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const agencyId = user.user_metadata?.agency_id
      if (!agencyId) throw new Error('No agency found')

      const { error } = await supabase
        .from('approvals')
        .insert({
          project_id: projectId,
          agency_id: agencyId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          file_id: formData.file_id || null,
        })

      if (error) throw error

      setDialogOpen(false)
      setFormData({ title: '', description: '', file_id: '' })
      await loadApprovals()
    } catch (error) {
      console.error('Failed to create approval:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading approvals...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Create Approval Button */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Approval
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={createApproval}>
              <DialogHeader>
                <DialogTitle>Request Client Approval</DialogTitle>
                <DialogDescription>
                  Ask your client to review and approve a deliverable
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Logo Design Approval"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what needs approval..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Attach File (Optional)</Label>
                  <Select
                    value={formData.file_id}
                    onValueChange={(value) => setFormData({ ...formData, file_id: value })}
                  >
                    <SelectTrigger id="file">
                      <SelectValue placeholder="Select a file to attach" />
                    </SelectTrigger>
                    <SelectContent>
                      {files.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-text-3">
                          No files available
                        </div>
                      ) : (
                        files.map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            {file.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formData.title.trim()}>
                  {submitting ? 'Creating...' : 'Request Approval'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <Card className="border-border bg-surface">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-text-2 mb-2">No approvals yet</p>
              <p className="text-sm text-text-3">
                Request client sign-off on deliverables
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const StatusIcon = statusIcons[approval.status]

            return (
              <Card key={approval.id} className="border-border bg-surface">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{approval.title}</CardTitle>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            statusColors[approval.status]
                          )}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[approval.status]}
                        </Badge>
                      </div>
                      {approval.description && (
                        <p className="text-sm text-text-2 mb-3">
                          {approval.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {approval.file && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 p-3 bg-surface2 rounded-lg">
                        <FileText className="h-4 w-4 text-text-3" />
                        <a
                          href={approval.file.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent hover:underline"
                        >
                          {approval.file.name}
                        </a>
                      </div>
                    </div>
                  )}

                  {approval.client_note && (
                    <div className="mb-4 p-3 bg-surface2 rounded-lg">
                      <p className="text-sm text-text-2">
                        <span className="font-medium">Client note:</span>{' '}
                        {approval.client_note}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-text-3">
                    <span>
                      Created {formatDate(approval.created_at)}
                    </span>
                    {approval.responded_at && (
                      <span>
                        Responded {formatDateTime(approval.responded_at)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
