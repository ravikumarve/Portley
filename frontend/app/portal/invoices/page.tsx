'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  invoice_number: string
  project: {
    name: string
  } | null
  amount: number
  currency: string
  status: 'draft' | 'unpaid' | 'paid' | 'overdue'
  due_date: string | null
  payment_url: string | null
  created_at: string
}

interface Agency {
  name: string
  logo_url: string | null
  brand_color: string
}

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get client record
      const { data: client } = await supabase
        .from('clients')
        .select('id, agency_id')
        .eq('user_id', user.id)
        .single()

      if (!client) {
        router.push('/auth/login')
        return
      }

      // Get agency branding
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('name, logo_url, brand_color')
        .eq('id', client.agency_id)
        .single()

      if (agencyData) {
        setAgency(agencyData)
      }

      // Get client's invoices
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      GBP: '£',
      EUR: '€',
    }
    return `${symbols[currency] || currency}${amount.toLocaleString()}`
  }

  const statusColors = {
    draft: 'bg-text-3',
    unpaid: 'bg-warning',
    paid: 'bg-success',
    overdue: 'bg-danger',
  }

  const statusIcons = {
    draft: Clock,
    unpaid: Clock,
    paid: CheckCircle,
    overdue: AlertCircle,
  }

  const statusLabels = {
    draft: 'Draft',
    unpaid: 'Unpaid',
    paid: 'Paid',
    overdue: 'Overdue',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-2">Loading invoices...</div>
      </div>
    )
  }

  const brandColor = agency?.brand_color || '#6366f1'

  return (
    <div className="min-h-screen bg-background">
      {/* Portal Header */}
      <header
        className="border-b"
        style={{ borderColor: `${brandColor}20` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/portal')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-lg">Invoices</h1>
              <p className="text-xs text-text-2">{agency?.name || 'Agency'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-surface">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-text-2">Total Invoices</p>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-text-2">Outstanding</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      invoices
                        .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
                        .reduce((sum, inv) => sum + inv.amount, 0),
                      'INR'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-text-2">Paid</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      invoices
                        .filter(inv => inv.status === 'paid')
                        .reduce((sum, inv) => sum + inv.amount, 0),
                      'INR'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-text-2 mb-2">No invoices yet</p>
                    <p className="text-sm text-text-3">
                      Your agency will send invoices when they're ready
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const StatusIcon = statusIcons[invoice.status]
                      return (
                        <TableRow
                          key={invoice.id}
                          className={cn(
                            invoice.status === 'overdue' && 'border-l-2 border-l-danger'
                          )}
                        >
                          <TableCell className="font-medium">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell className="text-text-2">
                            {invoice.project?.name || '—'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </TableCell>
                          <TableCell className="text-text-2">
                            {formatDate(invoice.due_date)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(statusColors[invoice.status])}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabels[invoice.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {invoice.payment_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(invoice.payment_url!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Pay Now
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
