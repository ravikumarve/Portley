'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface LineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    currency: 'INR',
    due_date: '',
    notes: '',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 },
  ])

  useEffect(() => {
    loadData()
    
    // Pre-fill client if provided in URL
    const clientId = searchParams.get('client')
    if (clientId) {
      setFormData(prev => ({ ...prev, client_id: clientId }))
    }
  }, [])

  const loadData = async () => {
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

      // Load clients and projects
      const [clientsData, projectsData] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name')
          .eq('agency_id', agency.id)
          .eq('invite_status', 'accepted'),
        supabase
          .from('projects')
          .select('id, name')
          .eq('agency_id', agency.id)
          .not('status', 'eq', 'deleted'),
      ])

      setClients(clientsData.data || [])
      setProjects(projectsData.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    
    // Recalculate amount
    if (field === 'quantity' || field === 'rate') {
      updated[index].amount = updated[index].quantity * updated[index].rate
    }
    
    setLineItems(updated)
  }

  const getTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_id) {
      toast.error('Please select a client')
      return
    }

    const validItems = lineItems.filter(item => item.description.trim() && item.quantity > 0 && item.rate > 0)
    if (validItems.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!agency) throw new Error('No agency found')

      // Generate invoice number
      const year = new Date().getFullYear()
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('agency_id', agency.id)
        .like('invoice_number', `INV-${year}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1)
        .single()

      let sequence = 1
      if (lastInvoice) {
        const match = lastInvoice.invoice_number.match(/INV-\d{4}-(\d+)/)
        if (match) {
          sequence = parseInt(match[1]) + 1
        }
      }

      const invoiceNumber = `INV-${year}-${sequence.toString().padStart(3, '0')}`

      // Create invoice
      const { error } = await supabase
        .from('invoices')
        .insert({
          agency_id: agency.id,
          client_id: formData.client_id,
          project_id: formData.project_id || null,
          invoice_number: invoiceNumber,
          amount: getTotal(),
          currency: formData.currency,
          due_date: formData.due_date || null,
          line_items: validItems,
          notes: formData.notes.trim() || null,
          status: 'draft',
        })

      if (error) throw error

      toast.success('Invoice created successfully!')
      router.push('/dashboard/invoices')
    } catch (error) {
      console.error('Failed to create invoice:', error)
      toast.error('Failed to create invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      GBP: '£',
      EUR: '€',
    }
    return `${symbols[formData.currency] || formData.currency}${amount.toLocaleString()}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">New Invoice</h1>
        <p className="text-text-2 mt-1">
          Create and send an invoice to your client
        </p>
      </div>

      {/* Invoice Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border-border bg-surface mb-6">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.client_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value as string })}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project (Optional)</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value as string })}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value as string })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or payment instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="border-border bg-surface mb-6">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                <div className="md:col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Service or product description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.rate}
                    onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formatCurrency(item.amount)}
                      readOnly
                      className="bg-surface2"
                    />
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        className="h-9 w-9 text-text-3 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addLineItem}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>

            {/* Total */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">{formatCurrency(getTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
