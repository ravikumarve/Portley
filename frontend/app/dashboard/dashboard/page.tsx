/**
 * Dashboard Page
 * Main dashboard for authenticated users
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-2">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Portley</h1>
          <div className="flex items-center gap-4">
            <span className="text-text-2">
              {user?.user_metadata?.full_name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-surface2 hover:bg-surface border border-border text-text font-semibold rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Good morning, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}.
          </h2>
          <p className="text-text-2">Here's what needs attention.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Projects', value: '0', color: 'accent' },
            { label: 'Clients', value: '0', color: 'success' },
            { label: 'Revenue', value: '₹0', color: 'warning' },
            { label: 'Pending Approvals', value: '0', color: 'danger' },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-surface border border-border rounded-lg p-6"
            >
              <p className="text-text-2 text-sm mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold text-${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">
              Welcome to Portley!
            </h3>
            <p className="text-text-2 mb-6">
              You're all set up. Start by creating your first project or inviting a client.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors">
                Create Project
              </button>
              <button className="px-6 py-3 bg-surface2 hover:bg-surface border border-border text-text font-semibold rounded-lg transition-colors">
                Invite Client
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
