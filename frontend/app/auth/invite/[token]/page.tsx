'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, Mail, Lock, User } from 'lucide-react'
import { toast } from 'sonner'

export default function InviteAcceptancePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const token = params.token as string

  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [inviteData, setInviteData] = useState<{
    agencyName: string
    clientName: string
    email: string
  } | null>(null)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    verifyInvite()
  }, [token])

  const verifyInvite = async () => {
    try {
      // Get invite details
      const { data: client } = await supabase
        .from('clients')
        .select('name, email, agency_id, invite_status')
        .eq('invite_token', token)
        .single()

      if (!client) {
        toast.error('Invalid invite link')
        router.push('/')
        return
      }

      if (client.invite_status === 'accepted') {
        toast.info('You have already accepted this invite')
        router.push('/auth/login')
        return
      }

      // Get agency name
      const { data: agency } = await supabase
        .from('agencies')
        .select('name')
        .eq('id', client.agency_id)
        .single()

      setInviteData({
        agencyName: agency?.name || 'Agency',
        clientName: client.name,
        email: client.email,
      })
    } catch (error) {
      console.error('Failed to verify invite:', error)
      toast.error('Invalid invite link')
      router.push('/')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData!.email,
        password: formData.password,
        options: {
          data: {
            full_name: inviteData!.clientName,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create account')
      }

      // Update client record
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          user_id: authData.user.id,
          invite_status: 'accepted',
        })
        .eq('invite_token', token)

      if (updateError) throw updateError

      toast.success('Account created successfully!')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/portal')
      }, 1000)
    } catch (error: any) {
      console.error('Failed to accept invite:', error)
      
      if (error.message?.includes('User already registered')) {
        toast.error('An account with this email already exists. Please login instead.')
      } else {
        toast.error('Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-text-2">Verifying invite...</p>
        </div>
      </div>
    )
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-2">Invalid invite link</p>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mt-4"
          >
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            <Mail className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            You're invited to {inviteData.agencyName}
          </h1>
          <p className="text-text-2">
            Create your account to access your projects and files
          </p>
        </div>

        {/* Invite Details Card */}
        <Card className="border-border bg-surface mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-text-2">Client Name</p>
                  <p className="font-medium">{inviteData.clientName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-2">Email</p>
                  <p className="font-medium">{inviteData.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Account Form */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-text-3">
                  Must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-text-3 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
