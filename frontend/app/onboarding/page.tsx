/**
 * Onboarding Page
 * 4-step wizard for first-time users
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [agencyName, setAgencyName] = useState('')
  const [whatYouDo, setWhatYouDo] = useState('')
  const [brandColor, setBrandColor] = useState('#6366f1')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Update agency
      await supabase
        .from('agencies')
        .update({
          name: agencyName,
          brand_color: brandColor,
        })
        .eq('owner_id', user.id)

      // Invite client if provided
      if (clientName && clientEmail) {
        const agencyResult = await supabase.from('agencies').select('id').eq('owner_id', user.id).single()
        if (agencyResult.data) {
          await supabase
            .from('clients')
            .insert({
              agency_id: agencyResult.data.id,
              name: clientName,
              email: clientEmail,
              invite_status: 'pending',
            })
        }
      }

      // Create project if provided
      if (projectName) {
        const agency = await supabase.from('agencies').select('id').eq('owner_id', user.id).single()
        if (agency.data) {
          await supabase
            .from('projects')
            .insert({
              agency_id: agency.data.id,
              name: projectName,
              status: 'active',
            })
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: 'Tell us about your agency',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Agency name</label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-accent text-text"
              placeholder="My Agency"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What do you do?</label>
            <select
              value={whatYouDo}
              onChange={(e) => setWhatYouDo(e.target.value)}
              className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-accent text-text"
            >
              <option value="">Select one...</option>
              <option value="web-design">Web Design</option>
              <option value="development">Development</option>
              <option value="marketing">Marketing</option>
              <option value="consulting">Consulting</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      title: 'Set up your brand',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Brand color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1 px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-accent text-text"
                placeholder="#6366f1"
              />
            </div>
            <div className="mt-4 p-4 bg-surface2 rounded-lg">
              <p className="text-sm text-text-2 mb-2">Preview:</p>
              <button
                className="px-4 py-2 rounded-lg text-white font-semibold"
                style={{ backgroundColor: brandColor }}
              >
                Sample Button
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Invite your first client',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Client name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-accent text-text"
              placeholder="Client Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Client email</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-accent text-text"
              placeholder="client@example.com"
            />
          </div>
          <p className="text-sm text-text-3">You can skip this and add clients later</p>
        </div>
      ),
    },
    {
      title: 'Create your first project',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-accent text-text"
              placeholder="My First Project"
            />
          </div>
          <p className="text-sm text-text-3">You can skip this and create projects later</p>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full mx-1 ${
                  index < step ? 'bg-accent' : 'bg-surface2'
                }`}
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold">{steps[step - 1].title}</h1>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          {steps[step - 1].content}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-surface2 hover:bg-surface border border-border text-text font-semibold rounded-lg transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
