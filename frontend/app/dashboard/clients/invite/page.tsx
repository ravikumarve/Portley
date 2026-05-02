'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function InviteClientPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

      if (!agency) throw new Error('No agency found')

      // Generate invite token
      const inviteToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15)

      // Create client record
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          agency_id: agency.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          invite_token: inviteToken,
          invite_status: 'pending',
        })

      if (clientError) throw clientError

      // TODO: Send invite email via Resend
      // For now, just show success
      toast.success('Client invited successfully!')
      
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Failed to invite client:', error)
      toast.error('Failed to invite client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Invite Client</h1>
        <p className="text-text-2 mt-1">
          Send an invitation to a new client
        </p>
      </div>

      {/* Invite Form */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Acme Corporation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., contact@acme.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal note to your invitation..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border bg-surface mt-6">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">What happens next?</h3>
              <p className="text-sm text-text-2">
                Your client will receive an email with a secure link to accept your invitation. 
                Once they accept, they'll have access to their projects, files, and invoices 
                through your branded portal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
