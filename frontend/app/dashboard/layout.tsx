'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [agency, setAgency] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUser(user)

        // Fetch agency data
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (agencyData) {
          setAgency(agencyData)
        }

        // Fetch unread message count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .not('read_by', 'cs', `{${user.id}}`)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Failed to load user data:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-2">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar user={user} agency={agency} />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav user={user} agency={agency} unreadCount={unreadCount} />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <div className="hidden lg:block">
          <Topbar user={user} unreadCount={unreadCount} />
        </div>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4rem)]">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
