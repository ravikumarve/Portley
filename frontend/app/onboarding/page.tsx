'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, ChevronRight, ChevronLeft, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'agency', title: 'Tell us about your agency' },
  { id: 'brand', title: 'Set up your brand' },
  { id: 'invite', title: 'Invite your first client' },
  { id: 'project', title: 'Create your first project' },
]

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
]

const SERVICES = [
  'Web Design',
  'Development',
  'Marketing',
  'Consulting',
  'Other',
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Agency
    agencyName: '',
    service: '',
    serviceOther: '',

    // Step 2: Brand
    logoFile: null as File | null,
    logoPreview: null as string | null,
    brandColor: '#6366f1',

    // Step 3: Invite
    clientName: '',
    clientEmail: '',

    // Step 4: Project
    projectName: '',
    projectDescription: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.agencyName.trim()) {
        newErrors.agencyName = 'Agency name is required'
      }
      if (!formData.service) {
        newErrors.service = 'Please select a service'
      }
      if (formData.service === 'Other' && !formData.serviceOther.trim()) {
        newErrors.serviceOther = 'Please specify your service'
      }
    }

    if (step === 1) {
      // Brand step is optional
    }

    if (step === 2) {
      // Invite step is optional
    }

    if (step === 3) {
      if (!formData.projectName.trim()) {
        newErrors.projectName = 'Project name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB')
      return
    }

    if (!file.type.match(/^(image\/png|image\/svg\+xml)$/)) {
      toast.error('Logo must be PNG or SVG')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        logoFile: file,
        logoPreview: reader.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = () => {
    setFormData(prev => ({
      ...prev,
      logoFile: null,
      logoPreview: null,
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get or create agency
      const { data: existingAgency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      let agencyId: string

      if (existingAgency) {
        agencyId = existingAgency.id

        // Update agency
        await supabase
          .from('agencies')
          .update({
            name: formData.agencyName,
            brand_color: formData.brandColor,
          })
          .eq('id', agencyId)

        // Upload logo if provided
        if (formData.logoFile) {
          const fileName = `logo.${formData.logoFile.name.split('.').pop()}`
          const { error: uploadError } = await supabase.storage
            .from('portley-logos')
            .upload(`${agencyId}/${fileName}`, formData.logoFile, {
              upsert: true,
            })

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('portley-logos')
              .getPublicUrl(`${agencyId}/${fileName}`)

            await supabase
              .from('agencies')
              .update({ logo_url: publicUrl })
              .eq('id', agencyId)
          }
        }
      } else {
        // Create agency
        const { data: newAgency, error: createError } = await supabase
          .from('agencies')
          .insert({
            owner_id: user.id,
            name: formData.agencyName,
            brand_color: formData.brandColor,
            slug: formData.agencyName.toLowerCase().replace(/\s+/g, '-'),
          })
          .select('id')
          .single()

        if (createError) throw createError
        agencyId = newAgency.id

        // Upload logo if provided
        if (formData.logoFile) {
          const fileName = `logo.${formData.logoFile.name.split('.').pop()}`
          const { error: uploadError } = await supabase.storage
            .from('portley-logos')
            .upload(`${agencyId}/${fileName}`, formData.logoFile)

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('portley-logos')
              .getPublicUrl(`${agencyId}/${fileName}`)

            await supabase
              .from('agencies')
              .update({ logo_url: publicUrl })
              .eq('id', agencyId)
          }
        }
      }

      // Invite client if provided
      let clientId: string | null = null
      if (formData.clientName && formData.clientEmail) {
        const inviteToken = Math.random().toString(36).substring(2, 15)

        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            agency_id: agencyId,
            name: formData.clientName,
            email: formData.clientEmail,
            invite_token: inviteToken,
          })
          .select('id')
          .single()

        if (!clientError) {
          clientId = newClient.id

          // Send invite email (would need backend integration)
          // For now, just show success
        }
      }

      // Create project if provided
      if (formData.projectName) {
        await supabase
          .from('projects')
          .insert({
            agency_id: agencyId,
            client_id: clientId,
            name: formData.projectName,
            description: formData.projectDescription,
            status: 'active',
          })
      }

      // Mark onboarding complete
      await supabase
        .from('auth.users')
        .update({
          user_metadata: {
            ...user.user_metadata,
            onboarding_complete: true,
          },
        })

      toast.success('Setup complete! Welcome to Portley!')

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error)
      toast.error(error.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-2">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-text-2">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-2"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  index < currentStep
                    ? 'bg-success text-background'
                    : index === currentStep
                    ? 'bg-accent text-background'
                    : 'bg-surface2 text-text-3'
                )}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-sm hidden sm:block',
                  index === currentStep ? 'text-text' : 'text-text-3'
                )}
              >
                {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-text-3 ml-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-2xl">{STEPS[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Agency Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name *</Label>
                  <Input
                    id="agencyName"
                    placeholder="e.g., Acme Design Studio"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    className={errors.agencyName ? 'border-danger' : ''}
                  />
                  {errors.agencyName && (
                    <p className="text-sm text-danger">{errors.agencyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">What do you do? *</Label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) => setFormData({ ...formData, service: value as string })}
                  >
                    <SelectTrigger className={errors.service ? 'border-danger' : ''}>
                      <SelectValue placeholder="Select your primary service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.service && (
                    <p className="text-sm text-danger">{errors.service}</p>
                  )}
                </div>

                {formData.service === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="serviceOther">Please specify *</Label>
                    <Input
                      id="serviceOther"
                      placeholder="e.g., Video Production"
                      value={formData.serviceOther}
                      onChange={(e) => setFormData({ ...formData, serviceOther: e.target.value })}
                      className={errors.serviceOther ? 'border-danger' : ''}
                    />
                    {errors.serviceOther && (
                      <p className="text-sm text-danger">{errors.serviceOther}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Brand */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Logo (Optional)</Label>
                  <p className="text-sm text-text-2">
                    Upload your logo to personalize your client portal. PNG or SVG, max 2MB.
                  </p>
                  
                  {formData.logoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.logoPreview}
                        alt="Logo preview"
                        className="h-24 w-auto rounded-lg border border-border"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 bg-danger text-background hover:bg-danger/90"
                        onClick={handleLogoRemove}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-text-3" />
                      <p className="text-sm text-text-2 mb-2">
                        Drag and drop your logo here, or click to browse
                      </p>
                      <Input
                        type="file"
                        accept="image/png,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <p className="text-sm text-text-2">
                    Choose a color that represents your brand. This will be used throughout your client portal.
                  </p>
                  
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, brandColor: color })}
                        className={cn(
                          'h-12 rounded-lg border-2 transition-all',
                          formData.brandColor === color
                            ? 'border-accent ring-2 ring-accent/50'
                            : 'border-border hover:border-accent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Input
                      type="color"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 rounded-lg bg-background border border-border">
                  <p className="text-sm text-text-2 mb-3">Preview</p>
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: `${formData.brandColor}10` }}
                  >
                    <div className="flex items-center gap-3">
                      {formData.logoPreview ? (
                        <img
                          src={formData.logoPreview}
                          alt="Logo"
                          className="h-8 w-auto"
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded flex items-center justify-center text-background font-bold"
                          style={{ backgroundColor: formData.brandColor }}
                        >
                          {formData.agencyName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold">{formData.agencyName || 'Your Agency'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Invite Client */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-text-2 mb-4">
                  Invite your first client to get started. You can skip this and add clients later.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="e.g., John Smith"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="e.g., john@example.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Create Project */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-text-2 mb-4">
                  Create your first project to start tracking work. You can skip this and create projects later.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Website Redesign"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className={errors.projectName ? 'border-danger' : ''}
                  />
                  {errors.projectName && (
                    <p className="text-sm text-danger">{errors.projectName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Description (Optional)</Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Brief description of the project..."
                    value={formData.projectDescription}
                    onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                    rows={4}
                  />
                </div>

                {formData.clientName && (
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-sm text-text-2">
                      This project will be assigned to <span className="font-medium">{formData.clientName}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep === STEPS.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
