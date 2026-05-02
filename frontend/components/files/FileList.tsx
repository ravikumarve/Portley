'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Upload, Download, Trash2, FileIcon, Image as ImageIcon, FileText, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileRecord {
  id: string
  name: string
  size_bytes: number
  mime_type: string | null
  uploader_name: string
  created_at: string
  download_url: string
}

interface FileListProps {
  projectId: string
}

export function FileList({ projectId }: FileListProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; file: FileRecord | null }>({
    open: false,
    file: null,
  })
  const supabase = createClient()

  useEffect(() => {
    loadFiles()
  }, [projectId])

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  const uploadFiles = async (files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${projectId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('portley-files')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('portley-files')
          .getPublicUrl(filePath)

        // Create file record in database
        const { data: { user } } = await supabase.auth.getUser()

        const { error: dbError } = await supabase
          .from('files')
          .insert({
            project_id: projectId,
            agency_id: user?.user_metadata?.agency_id,
            uploader_id: user?.id,
            name: file.name,
            storage_path: filePath,
            size_bytes: file.size,
            mime_type: file.type,
          })

        if (dbError) throw dbError
      }

      await loadFiles()
    } catch (error) {
      console.error('Failed to upload files:', error)
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (file: FileRecord) => {
    try {
      // Soft delete in database
      const { error } = await supabase
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', file.id)

      if (error) throw error

      setFiles(files.filter(f => f.id !== file.id))
      setDeleteDialog({ open: false, file: null })
    } catch (error) {
      console.error('Failed to delete file:', error)
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

  const totalSize = files.reduce((sum, file) => sum + file.size_bytes, 0)
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
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          dragActive ? 'border-accent bg-accent/5' : 'border-border bg-surface'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-text-3" />
              <p className="text-sm text-text-2">
                {uploading ? 'Uploading...' : 'Drag and drop files here, or click to browse'}
              </p>
              <p className="text-xs text-text-3">
                Max file size: 50MB
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card className="border-border bg-surface">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Storage Used</span>
            <span className="text-sm text-text-2">
              {formatFileSize(totalSize)} / 5GB
            </span>
          </div>
          <Progress value={storageUsed} className="h-2" />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length === 0 ? (
        <Card className="border-border bg-surface">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-text-2 mb-2">No files yet</p>
              <p className="text-sm text-text-3">
                Upload files to share with your client
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="border-border bg-surface">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.mime_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-2">
                        {formatFileSize(file.size_bytes)}
                      </span>
                      <span className="text-xs text-text-3">•</span>
                      <span className="text-xs text-text-2">
                        {file.uploader_name}
                      </span>
                      <span className="text-xs text-text-3">•</span>
                      <span className="text-xs text-text-2">
                        {formatDate(file.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(file.download_url, '_blank')}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialog({ open: true, file })}
                      className="h-8 w-8 text-text-3 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, file: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.file?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.file && deleteFile(deleteDialog.file)}
              className="bg-danger hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
