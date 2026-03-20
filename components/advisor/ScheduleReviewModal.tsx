'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Client {
  id: string
  user?: {
    name: string
    email: string
  }
}

interface ScheduleReviewModalProps {
  clientId?: string
  clientName?: string
  clients?: Client[]
  onClose: () => void
  onSchedule: (reviewData: any) => Promise<void>
}

export function ScheduleReviewModal({ clientId, clientName, clients, onClose, onSchedule }: ScheduleReviewModalProps) {
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    scheduled_date: '',
    type: 'QUARTERLY',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSchedule({ ...formData, status: 'SCHEDULED' })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to schedule review')
    } finally {
      setSaving(false)
    }
  }

  const showDropdown = !clientId && clients && clients.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-bg-primary border border-border rounded-xl w-full max-w-lg my-8 flex flex-col shadow-2xl">

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary rounded-t-xl flex-shrink-0">
          <h2 className="font-serif text-2xl text-fg-primary">Schedule Review</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors text-fg-muted hover:text-fg-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">Client</label>
              {showDropdown ? (
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary
                             focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  required
                >
                  <option value="">Select a client...</option>
                  {clients?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.user?.name || client.user?.email || 'Unknown'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-fg-primary">
                  {clientName}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">Review Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                required
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">Review Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                required
              >
                <option value="QUARTERLY">Quarterly Review</option>
                <option value="ANNUAL">Annual Review</option>
                <option value="ADHOC">Ad-hoc Review</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                placeholder="Add any notes about this review..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg
                           hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Scheduling...' : 'Schedule Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
