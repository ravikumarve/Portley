import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for custom domain resolution and authentication.
 * 
 * This middleware handles:
 * 1. Custom domain resolution for agency portals
 * 2. Authentication redirects for protected routes
 * 3. Onboarding redirect for new users
 */

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/auth/login',
  '/auth/signup',
  '/auth/invite',
  '/portal',
]

const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/clients',
  '/files',
  '/messages',
  '/invoices',
  '/settings',
]

const ONBOARDING_REQUIRED_ROUTES = [
  '/dashboard',
  '/projects',
  '/clients',
  '/files',
  '/messages',
  '/invoices',
  '/settings',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Remove port if present (for local development)
  const hostname = host.split(':')[0]

  // Check if this is a custom domain (not portley.app or localhost)
  const isCustomDomain = !hostname.endsWith('portley.app') && !hostname.endsWith('localhost')

  // Handle custom domain resolution
  if (isCustomDomain) {
    try {
      const supabase = createClient()

      // Look up agency by custom domain
      const { data: agency, error } = await supabase
        .from('agencies')
        .select('id, slug')
        .eq('custom_domain', hostname)
        .single()

      if (agency && !error) {
        // Rewrite to portal route with agency slug
        const url = request.nextUrl.clone()
        url.pathname = `/portal/${agency.slug}${pathname}`
        return NextResponse.rewrite(url)
      }
    } catch (error) {
      console.error('Failed to resolve custom domain:', error)
      // Continue to normal routing if custom domain resolution fails
    }
  }

  // Check authentication for protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check if onboarding is complete
    if (ONBOARDING_REQUIRED_ROUTES.some(route => pathname.startsWith(route))) {
      const onboardingComplete = user.user_metadata?.onboarding_complete !== false

      if (!onboardingComplete && pathname !== '/onboarding') {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth/') && pathname !== '/auth/invite') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
