'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, parseISO, isBefore, isAfter } from 'date-fns'

interface Client {
  id: string
  advisor_id?: string
  user?: { name: string; email: string }
}

interface ScheduleReviewModalProps {
  // For single-client context (client detail page)
  clientId?: string
  clientName?: string
  advisorId?: string
  // For multi-client context (reviews page)
  clients?: Client[]
  onClose: () => void
  onScheduled: () => void // just reload — booking is handled internally
}

interface Slot {
  date: string
  time: string
  datetime: string
  label: string
}

export function ScheduleReviewModal({
  clientId,
  clientName,
  advisorId,
  clients,
  onClose,
  onScheduled,
}: ScheduleReviewModalProps) {
  const showClientDropdown = !clientId && !!clients?.length

  const [selectedClientId, setSelectedClientId] = useState(clientId || '')
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [calendarOffset, setCalendarOffset] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Resolve which advisor to fetch slots for
  const resolvedAdvisorId: string | undefined = advisorId ||
    (selectedClientId ? clients?.find(c => c.id === selectedClientId)?.advisor_id : undefined)

  // Fetch slots whenever the resolved advisor is known
  useEffect(() => {
    if (!resolvedAdvisorId) return
    setSlotsLoading(true)
    setSlots([])
    setSelectedDate(null)
    setSelectedSlot(null)
    fetch(`/api/advisor/availability?advisorId=${resolvedAdvisorId}&days=21`)
      .then(r => r.json())
      .then(d => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [resolvedAdvisorId])

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(), 1 + calendarOffset * 7 + i), 'yyyy-MM-dd')
  )
  const slotsForDate = (date: string) => slots.filter(s => s.date === date)

  const handleBook = async () => {
    if (!selectedSlot || !selectedClientId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/client/book-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          advisor_id: resolvedAdvisorId,
          scheduled_datetime: selectedSlot.datetime,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to schedule review')
      onScheduled()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-bg-primary border border-border rounded-xl w-full max-w-lg my-8 shadow-2xl flex flex-col">

        {/* Header */}
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

        <div className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>
          )}

          {/* Client selector (only on reviews page) */}
          {showClientDropdown && (
            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">Client</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-fg-primary
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="">Select a client...</option>
                {clients?.map(c => (
                  <option key={c.id} value={c.id}>{c.user?.name || c.user?.email || 'Unknown'}</option>
                ))}
              </select>
            </div>
          )}

          {/* Fixed client display */}
          {!showClientDropdown && clientName && (
            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">Client</label>
              <div className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg text-fg-primary">{clientName}</div>
            </div>
          )}

          {/* Slot picker */}
          {!resolvedAdvisorId && !showClientDropdown && (
            <p className="text-sm text-fg-muted text-center py-4">No advisor linked to this client.</p>
          )}

          {resolvedAdvisorId && !selectedClientId && showClientDropdown && (
            <p className="text-sm text-fg-muted text-center py-4">Select a client to see available slots.</p>
          )}

          {resolvedAdvisorId && (selectedClientId || !showClientDropdown) && (
            slotsLoading ? (
              <div className="flex items-center justify-center py-10 gap-3 text-fg-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading available slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10 text-fg-muted text-sm">
                No available slots in the next 3 weeks.<br />Check the advisor's availability settings.
              </div>
            ) : (
              <>
                {/* Week navigation */}
                <div>
                  <label className="block text-sm font-medium text-fg-secondary mb-3">Select Date</label>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setCalendarOffset(o => Math.max(0, o - 1))}
                      disabled={calendarOffset === 0}
                      className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-fg-secondary">
                      {format(addDays(new Date(), 1 + calendarOffset * 7), 'MMM d')} —{' '}
                      {format(addDays(new Date(), 7 + calendarOffset * 7), 'MMM d, yyyy')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarOffset(o => o + 1)}
                      disabled={calendarOffset >= 2}
                      className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {weekDates.map(date => {
                      const daySlots = slotsForDate(date)
                      const isSelected = selectedDate === date
                      const hasSlots = daySlots.length > 0
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => { if (hasSlots) { setSelectedDate(date); setSelectedSlot(null) } }}
                          disabled={!hasSlots}
                          className={`flex flex-col items-center py-2.5 rounded-lg border transition-all text-center
                            ${isSelected
                              ? 'border-accent bg-accent/10 text-accent'
                              : hasSlots
                                ? 'border-border hover:border-accent/50 hover:bg-bg-secondary text-fg-primary cursor-pointer'
                                : 'border-transparent text-fg-muted opacity-40 cursor-not-allowed'
                            }`}
                        >
                          <span className="text-[10px] font-medium uppercase tracking-wide">{format(parseISO(date), 'EEE')}</span>
                          <span className="text-base font-serif mt-0.5">{format(parseISO(date), 'd')}</span>
                          {hasSlots && <span className="text-[10px] mt-0.5 text-fg-muted">{daySlots.length}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-fg-secondary mb-2">
                      Select Time — {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {slotsForDate(selectedDate).map(slot => (
                        <button
                          key={slot.datetime}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all
                            ${selectedSlot?.datetime === slot.datetime
                              ? 'border-accent bg-accent text-white shadow-sm'
                              : 'border-border hover:border-accent/50 hover:bg-bg-secondary text-fg-primary'
                            }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBook}
              disabled={submitting || !selectedSlot || !selectedClientId}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg
                         hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Scheduling...' : 'Schedule Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
