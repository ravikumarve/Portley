'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Mail, MoreVertical, FolderKanban, DollarSign } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  email: string
  invite_status: 'pending' | 'accepted'
  project_count: number
  unpaid_invoice_total: number
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!agency) return

      // Get clients with stats
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects!inner(id),
          invoices!inner(id, amount, status)
        `)
        .eq('agency_id', agency.id)

      if (error) throw error

      // Calculate stats for each client
      const clientsWithStats = (data || []).reduce((acc: Client[], client) => {
        const existingClient = acc.find(c => c.id === client.id)
        
        if (existingClient) {
          existingClient.project_count += 1
          if (client.invoices?.status === 'unpaid' || client.invoices?.status === 'overdue') {
            existingClient.unpaid_invoice_total += client.invoices?.amount || 0
          }
        } else {
          acc.push({
            id: client.id,
            name: client.name,
            email: client.email,
            invite_status: client.invite_status,
            project_count: 1,
            unpaid_invoice_total: (client.invoices?.status === 'unpaid' || client.invoices?.status === 'overdue') 
              ? client.invoices?.amount || 0 
              : 0,
            created_at: client.created_at,
          })
        }
        
        return acc
      }, [])

      setClients(clientsWithStats)
    } catch (error) {
      console.error('Failed to load clients:', error)
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-2">Loading clients...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-text-2 mt-1">Manage your client relationships</p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients/invite')}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-text-2">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <FolderKanban className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-2">Active Projects</p>
                <p className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + c.project_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-2">Outstanding</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(clients.reduce((sum, c) => sum + c.unpaid_invoice_total, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <p className="text-text-2 mb-2">No clients yet</p>
                <p className="text-sm text-text-3 mb-4">
                  Invite your first client to get started
                </p>
                <Button onClick={() => router.push('/dashboard/clients/invite')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Client
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-text-2">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.invite_status === 'accepted' ? 'default' : 'secondary'}
                        className={cn(
                          client.invite_status === 'accepted' ? 'bg-success' : 'bg-warning'
                        )}
                      >
                        {client.invite_status === 'accepted' ? 'Active' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.project_count}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-medium',
                        client.unpaid_invoice_total > 0 ? 'text-warning' : 'text-text-2'
                      )}>
                        {formatCurrency(client.unpaid_invoice_total)}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-2">
                      {formatDate(client.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/new?client=${client.id}`)}>
                            Create Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
