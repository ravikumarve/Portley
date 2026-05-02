'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Mail, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Agency {
  id: string
  name: string
  slug: string
  logo_url: string | null
  brand_color: string
  custom_domain: string | null
  plan: string
  plan_expires_at: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadAgency()
  }, [])

  const loadAgency = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (data) {
        setAgency(data)
        setFormData({
          name: data.name,
          slug: data.slug,
        })
      }
    } catch (error) {
      console.error('Failed to load agency:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agency) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('agencies')
        .update({
          name: formData.name.trim(),
          slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        })
        .eq('id', agency.id)

      if (error) throw error

      toast.success('Settings updated successfully!')
      await loadAgency()
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings. Please try again.')
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

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-text-3',
      solo: 'bg-accent',
      agency: 'bg-success',
    }
    return colors[plan as keyof typeof colors] || 'bg-text-3'
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-text-2 mt-1">
          Manage your agency settings and preferences
        </p>
      </div>

      {/* Agency Info Card */}
      {agency && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle>Agency Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-16 w-16">
                {agency.logo_url ? (
                  <img src={agency.logo_url} alt={agency.name} className="rounded" />
                ) : (
                  <AvatarFallback className="text-xl bg-accent text-white">
                    {getInitials(agency.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{agency.name}</h3>
                <p className="text-text-2 text-sm">portley.app/portal/{agency.slug}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getPlanColor(agency.plan)}>
                    {agency.plan.charAt(0).toUpperCase() + agency.plan.slice(1)} Plan
                  </Badge>
                  {agency.plan_expires_at && (
                    <span className="text-xs text-text-3">
                      Expires {formatDate(agency.plan_expires_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Settings Form */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Agency Name</Label>
              <Input
                id="name"
                placeholder="e.g., Acme Design Studio"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Portal Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-text-2 text-sm">portley.app/portal/</span>
                <Input
                  id="slug"
                  placeholder="your-agency"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  disabled={loading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-text-3">
                This will be your client portal URL. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-surface hover:border-accent transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Branding</h3>
                <p className="text-sm text-text-2">
                  Customize your logo, colors, and domain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface hover:border-accent transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Billing</h3>
                <p className="text-sm text-text-2">
                  Manage your plan and payment methods
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
