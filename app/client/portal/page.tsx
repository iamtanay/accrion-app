'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  LogOut, Calendar, ChevronLeft, ChevronRight,
  X, CheckCircle2, Loader2, User, RefreshCw, Trash2, AlertTriangle
} from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'

type ModalMode = 'book' | 'reschedule' | 'cancel'

export default function ClientPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [advisor, setAdvisor] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [decisions, setDecisions] = useState<any[]>([])
  const [nextReview, setNextReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>('book')
  const [showModal, setShowModal] = useState(false)
  const [slots, setSlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [calendarOffset, setCalendarOffset] = useState(0)

  useEffect(() => {
    const userStr = sessionStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const userData = JSON.parse(userStr)
    if (userData.role !== 'CLIENT') { router.push('/advisor/dashboard'); return }
    setUser(userData)
    fetchClientData(userData.id)
  }, [router])

  const fetchClientData = async (userId: string) => {
    try {
      const res = await fetch(`/api/client/portal?userId=${userId}`)
      const data = await res.json()
      setClient(data.client)
      setAdvisor(data.advisor)
      setGoals(data.goals || [])
      setDecisions(data.decisions || [])
      setNextReview(data.nextReview)
    } catch (error) {
      console.error('Failed to fetch client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSlots = async (mode: ModalMode) => {
    setSlotsLoading(true)
    setSlots([])
    try {
      const advisorId = client?.advisor_id
      // When rescheduling, exclude the current review's slot so it shows as available
      const excludeParam = mode === 'reschedule' && nextReview?.id
        ? `&exclude_review_id=${nextReview.id}`
        : ''
      const res = await fetch(`/api/advisor/availability?advisorId=${advisorId}&days=21${excludeParam}`)
      const data = await res.json()
      setSlots(data.slots || [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const openBook = () => {
    setModalMode('book')
    setShowModal(true)
    setSuccessMsg('')
    setErrorMsg('')
    setSelectedDate(null)
    setSelectedSlot(null)
    setCalendarOffset(0)
    loadSlots('book')
  }

  const openReschedule = () => {
    setModalMode('reschedule')
    setShowModal(true)
    setSuccessMsg('')
    setErrorMsg('')
    setSelectedDate(null)
    setSelectedSlot(null)
    setCalendarOffset(0)
    loadSlots('reschedule')
  }

  const openCancel = () => {
    setModalMode('cancel')
    setShowModal(true)
    setSuccessMsg('')
    setErrorMsg('')
  }

  const closeModal = () => {
    setShowModal(false)
    setSuccessMsg('')
    setErrorMsg('')
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const handleBook = async () => {
    if (!selectedSlot) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      const payload: any = {
        client_id: client?.id,
        advisor_id: client?.advisor_id,
        scheduled_datetime: selectedSlot.datetime,
      }
      if (modalMode === 'reschedule' && nextReview?.id) {
        payload.reschedule_id = nextReview.id
      }
      const res = await fetch('/api/client/book-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNextReview(data.review)
      setSuccessMsg(
        modalMode === 'reschedule'
          ? `Rescheduled to ${format(parseISO(selectedSlot.date), 'MMMM d')} at ${selectedSlot.label}`
          : `Booked for ${format(parseISO(selectedSlot.date), 'MMMM d')} at ${selectedSlot.label}`
      )
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/client/book-review', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: nextReview?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNextReview(null)
      setSuccessMsg('Your review call has been cancelled.')
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = () => {
    sessionStorage.removeItem('user')
    router.push('/login')
  }

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(), 1 + calendarOffset * 7 + i), 'yyyy-MM-dd')
  )
  const slotsForDate = (date: string) => slots.filter((s) => s.date === date)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-fg-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-fg-primary">{user?.name}</h1>
            <p className="text-sm text-fg-muted mt-1">
              Your long-horizon financial plan, maintained by Accrion Advisory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleSignOut} className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* Advisor card */}
        <section>
          <div className="bg-bg-secondary border border-border rounded p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-xs text-fg-muted uppercase tracking-wide mb-1">Your Advisor</div>
                <div className="text-lg font-serif text-fg-primary">{advisor?.name || 'Tanay'}</div>
                <div className="text-sm text-fg-muted">{advisor?.email}</div>
              </div>
            </div>
            {/* Only show Book button if no upcoming review */}
            {!nextReview && (
              <button
                onClick={openBook}
                className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-lg
                           hover:bg-accent-warm transition-colors font-medium text-sm flex-shrink-0"
              >
                <Calendar className="w-4 h-4" />
                Book a Review Call
              </button>
            )}
          </div>
        </section>

        {/* Next Review */}
        <section>
          <h2 className="font-serif text-2xl text-fg-primary mb-6">Next Review</h2>
          {nextReview ? (
            <div className="bg-bg-secondary border border-border rounded p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-serif text-fg-primary mb-1">
                    {format(new Date(nextReview.scheduled_date), 'MMMM d, yyyy')}
                  </div>
                  <div className="text-fg-muted text-sm">
                    {format(new Date(nextReview.scheduled_date), 'h:mm a')} — 1 hour with {advisor?.name}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={openReschedule}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg
                               text-sm font-medium text-fg-secondary hover:bg-bg-tertiary
                               hover:text-fg-primary transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reschedule
                  </button>
                  <button
                    onClick={openCancel}
                    className="flex items-center gap-2 px-4 py-2 border border-danger/40 rounded-lg
                               text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border rounded p-6 text-center">
              <p className="text-fg-muted text-sm mb-4">No upcoming review scheduled.</p>
              <button
                onClick={openBook}
                className="inline-flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-lg
                           hover:bg-accent-warm transition-colors font-medium text-sm"
              >
                <Calendar className="w-4 h-4" />
                Book a Review Call
              </button>
            </div>
          )}
        </section>

        {/* Your Profile */}
        <section>
          <h2 className="font-serif text-2xl text-fg-primary mb-6">Your Profile</h2>
          <div className="bg-bg-secondary border border-border rounded p-6 space-y-4">
            {client?.behavioral_summary && (
              <div>
                <div className="text-sm text-fg-secondary mb-2">Behavioral Summary</div>
                <p className="text-fg-primary leading-relaxed">{client.behavioral_summary}</p>
              </div>
            )}
            {client?.decision_temperament && (
              <div>
                <div className="text-sm text-fg-secondary mb-2">Decision Temperament</div>
                <div className="text-fg-primary font-medium">
                  {client.decision_temperament.replace(/_/g, ' ')}
                </div>
              </div>
            )}
            {client?.stated_risk_score && (
              <div>
                <div className="text-sm text-fg-secondary mb-2">Risk Preference</div>
                <div className="text-fg-primary">{client.stated_risk_score} / 10</div>
              </div>
            )}
          </div>
        </section>

        {/* Your Goals */}
        <section>
          <h2 className="font-serif text-2xl text-fg-primary mb-6">Your Goals</h2>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-bg-secondary border border-border rounded p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-serif text-xl text-fg-primary">{goal.title}</h3>
                    <div className="text-sm text-fg-muted mt-1">{goal.category.replace(/_/g, ' ')}</div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded ${
                    goal.status === 'ON_TRACK'
                      ? 'bg-success/10 text-success border border-success/30'
                      : goal.status === 'NEEDS_ATTENTION'
                      ? 'bg-warning/10 text-warning border border-warning/30'
                      : 'bg-fg-muted/10 text-fg-muted border border-fg-muted/30'
                  }`}>
                    {goal.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {goal.description && (
                  <p className="text-fg-secondary text-sm mb-4">{goal.description}</p>
                )}
                {goal.target_date && (
                  <div className="text-sm text-fg-muted font-mono">
                    Target: {format(new Date(goal.target_date), 'MMMM yyyy')}
                  </div>
                )}
                {goal.progress_notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-fg-secondary">{goal.progress_notes}</div>
                  </div>
                )}
              </div>
            ))}
            {goals.length === 0 && (
              <div className="text-center py-8 text-fg-muted">No goals set yet</div>
            )}
          </div>
        </section>

        {/* Your Decisions */}
        <section>
          <h2 className="font-serif text-2xl text-fg-primary mb-6">Your Decisions</h2>
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div key={decision.id} className="bg-bg-secondary border border-border rounded p-6">
                <div className="text-sm text-fg-muted font-mono mb-3">
                  {format(new Date(decision.date), 'MMMM d, yyyy')}
                </div>
                <h3 className="text-lg font-medium text-fg-primary mb-2">{decision.decision}</h3>
                <p className="text-fg-secondary mb-4">{decision.context}</p>
                {decision.reasoning && (
                  <div className="text-sm text-fg-secondary">
                    <span className="font-medium">Reasoning:</span> {decision.reasoning}
                  </div>
                )}
              </div>
            ))}
            {decisions.length === 0 && (
              <div className="text-center py-8 text-fg-muted">No decisions logged yet</div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-fg-muted text-sm">
          © 2026 Accrion Advisory. All rights reserved.
        </div>
      </footer>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-bg-primary border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="font-serif text-2xl text-fg-primary">
                  {modalMode === 'cancel'
                    ? 'Cancel Review Call'
                    : modalMode === 'reschedule'
                    ? 'Reschedule Review Call'
                    : 'Book a Review Call'}
                </h2>
                <p className="text-sm text-fg-muted mt-1">
                  {modalMode === 'cancel'
                    ? 'This will cancel your upcoming call with ' + advisor?.name
                    : `1-hour session with ${advisor?.name} · Select an available slot`}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* ── Success state ── */}
              {successMsg ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-14 h-14 text-success mx-auto mb-4" />
                  <h3 className="font-serif text-2xl text-fg-primary mb-2">
                    {modalMode === 'cancel' ? 'Call Cancelled' : modalMode === 'reschedule' ? 'Call Rescheduled!' : 'Call Booked!'}
                  </h3>
                  <p className="text-fg-muted mb-6">{successMsg}</p>
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-warm transition-colors"
                  >
                    Done
                  </button>
                </div>

              ) : modalMode === 'cancel' ? (
                /* ── Cancel confirmation ── */
                <div className="text-center py-6">
                  <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                  <p className="text-fg-primary mb-2">
                    Are you sure you want to cancel your review on
                  </p>
                  <p className="text-lg font-serif text-fg-primary mb-1">
                    {nextReview && format(new Date(nextReview.scheduled_date), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-fg-muted text-sm mb-8">
                    {nextReview && format(new Date(nextReview.scheduled_date), 'h:mm a')} with {advisor?.name}
                  </p>
                  {errorMsg && (
                    <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
                      {errorMsg}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 border border-border rounded-lg font-medium text-fg-secondary hover:bg-bg-tertiary transition-colors"
                    >
                      Keep It
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-danger text-white rounded-lg font-medium
                                 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                  </div>
                </div>

              ) : slotsLoading ? (
                /* ── Loading slots ── */
                <div className="flex items-center justify-center py-16 text-fg-muted gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading available times...
                </div>

              ) : slots.length === 0 ? (
                <div className="text-center py-16 text-fg-muted">
                  No available slots in the next 3 weeks. Please check back later.
                </div>

              ) : (
                /* ── Slot picker ── */
                <>
                  {/* Current booking reminder when rescheduling */}
                  {modalMode === 'reschedule' && nextReview && (
                    <div className="mb-5 px-4 py-3 bg-bg-secondary border border-border rounded-lg text-sm text-fg-secondary">
                      Current booking: <span className="text-fg-primary font-medium">
                        {format(new Date(nextReview.scheduled_date), 'MMMM d')} at {format(new Date(nextReview.scheduled_date), 'h:mm a')}
                      </span> — select a new slot below to replace it
                    </div>
                  )}

                  {/* Week navigation */}
                  <div className="flex items-center justify-between mb-5">
                    <button
                      onClick={() => setCalendarOffset((o) => Math.max(0, o - 1))}
                      disabled={calendarOffset === 0}
                      className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-fg-secondary">
                      {format(addDays(new Date(), 1 + calendarOffset * 7), 'MMM d')} —{' '}
                      {format(addDays(new Date(), 7 + calendarOffset * 7), 'MMM d, yyyy')}
                    </span>
                    <button
                      onClick={() => setCalendarOffset((o) => o + 1)}
                      disabled={calendarOffset >= 2}
                      className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Day columns */}
                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {weekDates.map((date) => {
                      const daySlots = slotsForDate(date)
                      const isSelected = selectedDate === date
                      const hasSlots = daySlots.length > 0
                      return (
                        <button
                          key={date}
                          onClick={() => { if (hasSlots) { setSelectedDate(date); setSelectedSlot(null) } }}
                          disabled={!hasSlots}
                          className={`flex flex-col items-center py-3 px-1 rounded-lg border transition-all text-center
                            ${isSelected
                              ? 'border-accent bg-accent/10 text-accent'
                              : hasSlots
                              ? 'border-border hover:border-accent/50 hover:bg-bg-secondary text-fg-primary cursor-pointer'
                              : 'border-transparent text-fg-muted opacity-40 cursor-not-allowed'
                            }`}
                        >
                          <span className="text-xs font-medium uppercase tracking-wide">
                            {format(parseISO(date), 'EEE')}
                          </span>
                          <span className="text-lg font-serif mt-1">{format(parseISO(date), 'd')}</span>
                          {hasSlots && (
                            <span className="text-xs mt-1 text-fg-muted">
                              {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Time slots */}
                  {selectedDate && (
                    <div className="mb-6">
                      <div className="text-sm font-medium text-fg-secondary mb-3">
                        Available times on {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slotsForDate(selectedDate).map((slot) => (
                          <button
                            key={slot.datetime}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 px-3 rounded-lg border text-sm font-medium transition-all
                              ${selectedSlot?.datetime === slot.datetime
                                ? 'border-accent bg-accent text-white'
                                : 'border-border hover:border-accent/50 hover:bg-bg-secondary text-fg-primary'
                              }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
                      {errorMsg}
                    </div>
                  )}

                  {/* Confirm */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-fg-muted">
                      {selectedSlot
                        ? `${format(parseISO(selectedSlot.date), 'MMMM d')} at ${selectedSlot.label} · 1 hour`
                        : 'Select a date and time above'}
                    </div>
                    <button
                      onClick={handleBook}
                      disabled={!selectedSlot || submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-medium
                                 hover:bg-accent-warm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting
                        ? 'Saving...'
                        : modalMode === 'reschedule'
                        ? 'Confirm Reschedule'
                        : 'Confirm Booking'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
