'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Trash2, FileIcon, Image as ImageIcon, FileText, Archive, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface File {
  id: string
  name: string
  size_bytes: number
  mime_type: string | null
  uploader_name: string
  project_name: string
  created_at: string
  download_url: string
}

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSize, setTotalSize] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
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

      // Get all files across projects
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('agency_id', agency.id)
        .is_('deleted_at', 'null')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get download URLs and calculate total size
      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          let downloadUrl = null
          if (file.storage_path) {
            const { data: { publicUrl } } = supabase.storage
              .from('portley-files')
              .getPublicUrl(file.storage_path)
            downloadUrl = publicUrl
          }

          return {
            ...file,
            project_name: file.project?.name || 'Unknown',
            download_url: downloadUrl,
          }
        })
      )

      setFiles(filesWithUrls)
      setTotalSize(filesWithUrls.reduce((sum, file) => sum + file.size_bytes, 0))
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileIcon className="h-5 w-5" />
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />
    }
    
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-5 w-5" />
    }
    
    if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return <Archive className="h-5 w-5" />
    }
    
    return <FileIcon className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const storageLimit = 5 * 1024 * 1024 * 1024 // 5GB for Solo plan
  const storageUsed = (totalSize / storageLimit) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading files...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Files</h1>
        <p className="text-text-2 mt-1">
          All files across your projects
        </p>
      </div>

      {/* Storage Usage */}
      <Card className="border-border bg-surface">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <HardDrive className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Storage Used</p>
              <p className="text-xs text-text-2">
                {formatFileSize(totalSize)} / 5GB
              </p>
            </div>
          </div>
          <Progress value={storageUsed} className="h-2" />
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>All Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <FileIcon className="h-12 w-12 text-text-3 mx-auto mb-4" />
                <p className="text-text-2 mb-2">No files yet</p>
                <p className="text-sm text-text-3">
                  Upload files to your projects to see them here
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface2 rounded-lg">
                          {getFileIcon(file.mime_type)}
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-text-2">{file.mime_type || 'Unknown'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{file.project_name}</Badge>
                    </TableCell>
                    <TableCell className="text-text-2">
                      {formatFileSize(file.size_bytes)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {file.uploader_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{file.uploader_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-2">
                      {formatDate(file.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(file.download_url, '_blank')}
                          className="h-8 w-8"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
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
