import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

interface PortalLayoutProps {
  children: ReactNode
  params: {
    slug?: string
  }
}

interface Agency {
  id: string
  name: string
  logo_url: string | null
  brand_color: string
  custom_domain: string | null
  plan: string
}

async function getAgencyBranding(slug?: string): Promise<Agency | null> {
  if (!slug) return null

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('agencies')
      .select('id, name, logo_url, brand_color, custom_domain, plan')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to fetch agency branding:', error)
    return null
  }
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = (num >> 8 & 0x00FF) - amt
  const B = (num & 0x0000FF) - amt
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const agency = await getAgencyBranding(params.slug)

  if (!agency) {
    notFound()
  }

  const brandColor = agency.brand_color || '#6366f1'
  const brandColorHover = darkenColor(brandColor, 10)
  const brandColorLight = lightenColor(brandColor, 80)
  const brandColorBg = `${brandColor}10`
  const brandColorBorder = `${brandColor}30`

  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
          :root {
            --agency-color: ${brandColor};
            --agency-color-hover: ${brandColorHover};
            --agency-color-light: ${brandColorLight};
            --agency-color-bg: ${brandColorBg};
            --agency-color-border: ${brandColorBorder};
          }
        `}</style>
      </head>
      <body className="min-h-screen bg-background text-text">
        {children}
      </body>
    </html>
  )
}
