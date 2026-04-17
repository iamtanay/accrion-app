'use client'

import { useState } from 'react'
import { X, Loader2, Clock, Calendar } from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'

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
  onSchedule: (reviewData: Record<string, unknown>) => Promise<void>
}

const TIME_SLOTS = [
  { label: '9:00 AM',  time: '09:00' },
  { label: '9:30 AM',  time: '09:30' },
  { label: '10:00 AM', time: '10:00' },
  { label: '10:30 AM', time: '10:30' },
  { label: '11:00 AM', time: '11:00' },
  { label: '11:30 AM', time: '11:30' },
  { label: '12:00 PM', time: '12:00' },
  { label: '2:00 PM',  time: '14:00' },
  { label: '2:30 PM',  time: '14:30' },
  { label: '3:00 PM',  time: '15:00' },
  { label: '3:30 PM',  time: '15:30' },
  { label: '4:00 PM',  time: '16:00' },
  { label: '4:30 PM',  time: '16:30' },
  { label: '5:00 PM',  time: '17:00' },
]

export function ScheduleReviewModal({ clientId, clientName, clients, onClose, onSchedule }: ScheduleReviewModalProps) {
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    scheduled_date: '',
    scheduled_time: '',
    type: 'QUARTERLY',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.scheduled_date) {
      setError('Please select a date')
      return
    }
    if (!formData.scheduled_time) {
      setError('Please select a time slot')
      return
    }
    setSaving(true)
    setError('')
    try {
      const scheduledDatetime = `${formData.scheduled_date}T${formData.scheduled_time}:00`
      await onSchedule({
        client_id: formData.client_id,
        scheduled_date: scheduledDatetime,
        type: formData.type,
        notes: formData.notes,
        status: 'SCHEDULED',
      })
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to schedule review'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const showDropdown = !clientId && clients && clients.length > 0
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-bg-primary border border-border rounded-xl w-full max-w-lg my-8 flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <h2 className="font-serif text-xl text-fg-primary">Schedule Review</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors text-fg-muted hover:text-fg-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

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
                  className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value, scheduled_time: '' })}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                required
                min={minDate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Time Slot
                <span className="text-danger">*</span>
              </label>
              {!formData.scheduled_date ? (
                <div className="px-3 py-2.5 bg-bg-tertiary border border-dashed border-border rounded-lg text-fg-muted text-sm text-center">
                  Select a date first to pick a time
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setFormData({ ...formData, scheduled_time: slot.time })}
                      className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                        formData.scheduled_time === slot.time
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-border hover:border-accent/50 hover:bg-bg-secondary text-fg-primary'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
              {formData.scheduled_time && (
                <p className="text-xs text-accent mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {TIME_SLOTS.find(s => s.time === formData.scheduled_time)?.label} on {format(parseISO(formData.scheduled_date), 'MMMM d, yyyy')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">Review Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                placeholder="Add any notes about this review..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={saving}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving || !formData.scheduled_time || !formData.scheduled_date}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
