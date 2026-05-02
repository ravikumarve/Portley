'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Upload, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface Agency {
  id: string
  name: string
  logo_url: string | null
  brand_color: string
  custom_domain: string | null
  plan: string
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
]

export default function BrandingPage() {
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [agency, setAgency] = useState<Agency | null>(null)
  const [formData, setFormData] = useState({
    brand_color: '#6366f1',
    custom_domain: '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
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
          brand_color: data.brand_color || '#6366f1',
          custom_domain: data.custom_domain || '',
        })
        setLogoPreview(data.logo_url)
      }
    } catch (error) {
      console.error('Failed to load agency:', error)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Logo must be an image file')
      return
    }

    setUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${agency?.id}/logo.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('portley-logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portley-logos')
        .getPublicUrl(fileName)

      // Update agency
      const { error: updateError } = await supabase
        .from('agencies')
        .update({ logo_url: publicUrl })
        .eq('id', agency?.id)

      if (updateError) throw updateError

      setLogoPreview(publicUrl)
      toast.success('Logo uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload logo:', error)
      toast.error('Failed to upload logo. Please try again.')
    } finally {
      setUploadingLogo(false)
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
          brand_color: formData.brand_color,
          custom_domain: formData.custom_domain.trim() || null,
        })
        .eq('id', agency.id)

      if (error) throw error

      toast.success('Branding updated successfully!')
      await loadAgency()
    } catch (error) {
      console.error('Failed to update branding:', error)
      toast.error('Failed to update branding. Please try again.')
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

  const isAgencyPlan = agency?.plan === 'agency'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Branding</h1>
        <p className="text-text-2 mt-1">
          Customize your portal's appearance
        </p>
      </div>

      {/* Preview Card */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="p-6 rounded-lg border-2"
            style={{
              borderColor: formData.brand_color,
              backgroundColor: `${formData.brand_color}10`,
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="rounded" />
                ) : (
                  <AvatarFallback
                    className="text-lg"
                    style={{ backgroundColor: formData.brand_color, color: 'white' }}
                  >
                    {agency ? getInitials(agency.name) : 'AB'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{agency?.name || 'Your Agency'}</h3>
                <p className="text-sm text-text-2">Client Portal</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded-full" style={{ backgroundColor: formData.brand_color, opacity: 0.3 }} />
              <div className="h-2 rounded-full" style={{ backgroundColor: formData.brand_color, opacity: 0.5 }} />
              <div className="h-2 rounded-full" style={{ backgroundColor: formData.brand_color, opacity: 0.7 }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Form */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Brand Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="rounded" />
                    ) : (
                      <AvatarFallback
                        className="text-2xl bg-surface2"
                      >
                        {agency ? getInitials(agency.name) : 'AB'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                  <label htmlFor="logo">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingLogo}
                      asChild
                    >
                      <span>
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-text-2 mt-2">
                    PNG, SVG, or JPG. Max 2MB. Recommended: 200x200px.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Color */}
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="flex-1"
                  placeholder="#6366f1"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, brand_color: color })}
                    className="w-8 h-8 rounded-full border-2 border-border hover:border-accent transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Custom Domain */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Custom Domain</Label>
                {!isAgencyPlan && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Agency Plan
                  </Badge>
                )}
              </div>
              <Input
                placeholder="portal.youragency.com"
                value={formData.custom_domain}
                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                disabled={!isAgencyPlan || loading}
              />
              {!isAgencyPlan && (
                <p className="text-xs text-text-3">
                  Upgrade to the Agency plan to use a custom domain.
                </p>
              )}
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
    </div>
  )
}
