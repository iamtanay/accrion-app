'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Tabs, type Tab } from '@/components/ui/Tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EditProfileModal } from '@/components/advisor/EditProfileModal'
import { ScheduleReviewModal } from '@/components/advisor/ScheduleReviewModal'
import {
  User,
  Target,
  Flag,
  FileText,
  Calendar,
  MessageSquare,
  FolderOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react'

interface ClientData {
  client: any
  goals: any[]
  flags: any[]
  decisions: any[]
  reviews: any[]
  communications: any[]
  documents: any[]
  snapshots: any[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clientId = params.id as string
  const initialTab = searchParams.get('tab') || 'overview'

  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [completingReview, setCompletingReview] = useState<any>(null)

  useEffect(() => {
    async function loadClientData() {
      try {
        const res = await fetch(`/api/advisor/clients/${clientId}`)
        if (!res.ok) throw new Error('Failed to load client data')
        const clientData = await res.json()
        setData(clientData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadClientData()
  }, [clientId])

  const handleSaveProfile = async (updates: any) => {
    const res = await fetch(`/api/advisor/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update profile')

    const updatedData = await fetch(`/api/advisor/clients/${clientId}`)
    const clientData = await updatedData.json()
    setData(clientData)
  }

  const handleScheduleReview = async (reviewData: any) => {
    const res = await fetch(`/api/advisor/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    })
    if (!res.ok) throw new Error('Failed to schedule review')

    const updatedData = await fetch(`/api/advisor/clients/${clientId}`)
    const clientData = await updatedData.json()
    setData(clientData)
  }

  const handleComplete = async (reviewId: string, notes: string, drift: string) => {
    const res = await fetch('/api/advisor/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, advisor_notes: notes, drift_assessment: drift }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to complete review')
    }
    const updatedData = await fetch(`/api/advisor/clients/${clientId}`)
    const clientData = await updatedData.json()
    setData(clientData)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-fg-muted">Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-danger">{error || 'Client not found'}</div>
      </div>
    )
  }

  const { client, goals, flags, decisions, reviews, communications, documents, snapshots } = data

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'behavior', label: 'Behavior', icon: Flag },
    { id: 'decisions', label: 'Decisions', icon: FileText },
    { id: 'reviews', label: 'Reviews', icon: Calendar },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
  ]

  const riskGap = (client.stated_risk_score || 0) - (client.revealed_risk_score || 0)
  const hasSignificantGap = Math.abs(riskGap) >= 3

  return (
    <>
      {showEditModal && (
        <EditProfileModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}

      {showScheduleModal && (
        <ScheduleReviewModal
          clientId={clientId}
          clientName={client.user?.name || 'Unknown'}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleReview}
        />
      )}

      {completingReview && (
        <CompleteReviewModal
          review={completingReview}
          onClose={() => setCompletingReview(null)}
          onComplete={handleComplete}
        />
      )}

      <div className="min-h-screen">
        <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl text-fg-primary mb-2">
                {client.user?.name}
              </h1>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-fg-muted">{client.user?.email}</span>
                <Badge variant={
                  client.status === 'ACTIVE' ? 'success' :
                  client.status === 'ONBOARDING' ? 'warning' :
                  'neutral'
                }>
                  {client.status}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 text-sm border border-border rounded hover:bg-bg-tertiary transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors"
              >
                Schedule Review
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <Tabs tabs={tabs} defaultTab={initialTab}>
          {(activeTab) => {
            switch (activeTab) {
              case 'overview':
                return <OverviewTab client={client} riskGap={riskGap} hasSignificantGap={hasSignificantGap} />
              case 'goals':
                return <GoalsTab goals={goals} />
              case 'behavior':
                return <BehaviorTab flags={flags} snapshots={snapshots} />
              case 'decisions':
                return <DecisionsTab decisions={decisions} />
              case 'reviews':
                return <ReviewsTab reviews={reviews} onComplete={setCompletingReview} />
              case 'communications':
                return <CommunicationsTab communications={communications} />
              case 'documents':
                return <DocumentsTab documents={documents} />
              default:
                return null
            }
          }}
        </Tabs>
      </main>
      </div>
    </>
  )
}

function OverviewTab({ client, riskGap, hasSignificantGap }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-fg-muted mb-1">Temperament</dt>
              <dd className="text-fg-primary font-medium">{client.temperament || 'Not assessed'}</dd>
            </div>
            <div>
              <dt className="text-sm text-fg-muted mb-1">Stated Risk Score</dt>
              <dd className="text-fg-primary font-medium text-2xl">{client.stated_risk_score}/10</dd>
            </div>
            <div>
              <dt className="text-sm text-fg-muted mb-1">Revealed Risk Score</dt>
              <dd className="text-fg-primary font-medium text-2xl">{client.revealed_risk_score}/10</dd>
            </div>
            {hasSignificantGap && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-warning mb-1">Significant Risk Gap</div>
                  <div className="text-xs text-fg-secondary">
                    {riskGap > 0 ? 'States higher' : 'Acts more'} risk tolerance ({Math.abs(riskGap)} points)
                  </div>
                </div>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationship Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-fg-muted mb-1">Onboarded</dt>
              <dd className="text-fg-primary">
                {client.onboarding_date
                  ? format(new Date(client.onboarding_date), 'MMMM d, yyyy')
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-fg-muted mb-1">Last Review</dt>
              <dd className="text-fg-primary">
                {client.last_review_date
                  ? format(new Date(client.last_review_date), 'MMMM d, yyyy')
                  : 'No reviews yet'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-fg-muted mb-1">Drift Level</dt>
              <dd className="text-fg-primary font-medium">{client.drift_level || 'BASELINE'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {client.advisor_notes && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Advisor Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-fg-secondary whitespace-pre-wrap">{client.advisor_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function GoalsTab({ goals }: any) {
  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-fg-muted text-center py-8">No goals recorded yet</p>
          </CardContent>
        </Card>
      ) : (
        goals.map((goal: any) => (
          <Card key={goal.id}>
            <CardContent>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-fg-primary mb-2">{goal.goal_description}</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant={
                      goal.priority === 'HIGH' ? 'danger' :
                      goal.priority === 'MEDIUM' ? 'warning' :
                      'neutral'
                    }>
                      {goal.priority}
                    </Badge>
                    <span className="text-fg-muted">
                      Target: {format(new Date(goal.target_date), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
                {goal.achieved && (
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                )}
              </div>
              {goal.progress_notes && (
                <p className="text-sm text-fg-secondary">{goal.progress_notes}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function BehaviorTab({ flags, snapshots }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-xl mb-4 text-fg-primary">Behavioral Flags</h3>
        <div className="space-y-4">
          {flags.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-fg-muted text-center py-8">No flags recorded</p>
              </CardContent>
            </Card>
          ) : (
            flags.map((flag: any) => (
              <Card key={flag.id}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <span className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                      flag.severity === 'HIGH' ? 'bg-danger' :
                      flag.severity === 'MEDIUM' ? 'bg-warning' :
                      'bg-success'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-fg-muted text-sm font-mono">
                          {format(new Date(flag.date), 'MMM d, yyyy')}
                        </span>
                        <Badge variant={flag.resolved ? 'success' : 'warning'}>
                          {flag.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </div>
                      <p className="text-fg-primary mb-2">{flag.client_behavior}</p>
                      {flag.advisor_interpretation && (
                        <p className="text-sm text-fg-secondary italic">{flag.advisor_interpretation}</p>
                      )}
                      {flag.resolution_notes && (
                        <div className="mt-3 p-3 bg-bg-tertiary rounded">
                          <div className="text-xs text-fg-muted mb-1">Resolution</div>
                          <p className="text-sm text-fg-secondary">{flag.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {snapshots.length > 0 && (
        <div>
          <h3 className="font-serif text-xl mb-4 text-fg-primary">Behavioral Snapshots</h3>
          <div className="space-y-4">
            {snapshots.map((snapshot: any) => (
              <Card key={snapshot.id}>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-fg-muted text-sm font-mono">
                      {format(new Date(snapshot.snapshot_date), 'MMMM d, yyyy')}
                    </span>
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs text-fg-muted mb-1">Temperament</dt>
                      <dd className="text-fg-primary font-medium">{snapshot.temperament}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-fg-muted mb-1">Drift Level</dt>
                      <dd className="text-fg-primary font-medium">{snapshot.drift_level}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-fg-muted mb-1">Stated Risk</dt>
                      <dd className="text-fg-primary font-medium">{snapshot.stated_risk}/10</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-fg-muted mb-1">Revealed Risk</dt>
                      <dd className="text-fg-primary font-medium">{snapshot.revealed_risk}/10</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DecisionsTab({ decisions }: any) {
  return (
    <div className="space-y-4">
      {decisions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-fg-muted text-center py-8">No decisions logged yet</p>
          </CardContent>
        </Card>
      ) : (
        decisions.map((decision: any) => (
          <Card key={decision.id}>
            <CardContent>
              <div className="flex items-start justify-between mb-3">
                <span className="text-fg-muted text-sm font-mono">
                  {format(new Date(decision.date), 'MMM d, yyyy')}
                </span>
                {decision.is_internal && (
                  <Badge variant="neutral" size="sm">Internal</Badge>
                )}
              </div>
              <p className="text-fg-primary mb-3">{decision.decision}</p>
              {decision.advisor_analysis && (
                <div className="p-3 bg-bg-tertiary rounded">
                  <div className="text-xs text-fg-muted mb-1">Analysis</div>
                  <p className="text-sm text-fg-secondary">{decision.advisor_analysis}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function ReviewsTab({ reviews, onComplete }: any) {
  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-fg-muted text-center py-8">No reviews scheduled</p>
          </CardContent>
        </Card>
      ) : (
        reviews.map((review: any) => (
          <Card key={review.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-fg-muted text-sm font-mono mb-2">
                    {format(new Date(review.scheduled_date), 'MMMM d, yyyy')}
                    {' '}
                    <span className="text-fg-muted">
                      {format(new Date(review.scheduled_date), 'h:mm a')}
                    </span>
                  </div>
                  <Badge variant={
                    review.status === 'COMPLETED' ? 'success' :
                    review.status === 'SCHEDULED' ? 'warning' :
                    'neutral'
                  }>
                    {review.status}
                  </Badge>
                </div>
                {review.status === 'SCHEDULED' && (
                  <button
                    onClick={() => onComplete(review)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm
                               rounded-lg hover:bg-accent-warm transition-colors font-medium flex-shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Complete
                  </button>
                )}
              </div>
              {review.drift_assessment && (
                <div className="mb-3">
                  <div className="text-xs text-fg-muted mb-1">Drift Assessment</div>
                  <div className="text-fg-primary font-medium">
                    {review.drift_assessment.replace(/_/g, ' ')}
                  </div>
                </div>
              )}
              {review.advisor_notes && (
                <div className="p-3 bg-bg-tertiary rounded">
                  <div className="text-xs text-fg-muted mb-1">Advisor Notes</div>
                  <p className="text-sm text-fg-secondary whitespace-pre-wrap">{review.advisor_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

const DRIFT_OPTIONS = [
  { value: 'ON_TRACK', label: 'On Track' },
  { value: 'SLIGHT_DRIFT', label: 'Slight Drift' },
  { value: 'SIGNIFICANT_DRIFT', label: 'Significant Drift' },
  { value: 'CRITICAL', label: 'Critical' },
]

function CompleteReviewModal({ review, onClose, onComplete }: any) {
  const [notes, setNotes] = useState('')
  const [drift, setDrift] = useState('ON_TRACK')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onComplete(review.id, notes, drift)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary border border-border rounded-xl max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl text-fg-primary">Mark Review Complete</h2>
            <p className="text-sm text-fg-muted mt-1">
              {format(new Date(review.scheduled_date), 'MMMM d, yyyy')} at {format(new Date(review.scheduled_date), 'h:mm a')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-2">Drift Assessment</label>
            <select
              value={drift}
              onChange={(e) => setDrift(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-fg-primary
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {DRIFT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-primary mb-2">
              Advisor Notes <span className="text-fg-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Key observations, decisions made, action items..."
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-fg-primary
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
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
                         hover:bg-accent-warm transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Mark Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CommunicationsTab({ communications }: any) {
  return (
    <div className="space-y-4">
      {communications.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-fg-muted text-center py-8">No communications recorded</p>
          </CardContent>
        </Card>
      ) : (
        communications.map((comm: any) => (
          <Card key={comm.id}>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-fg-muted text-sm font-mono">
                  {format(new Date(comm.date), 'MMM d, yyyy')}
                </span>
                <Badge variant="neutral" size="sm">{comm.type}</Badge>
              </div>
              {comm.summary && (
                <p className="text-fg-secondary mb-3">{comm.summary}</p>
              )}
              {comm.full_notes && (
                <div className="p-3 bg-bg-tertiary rounded">
                  <p className="text-sm text-fg-secondary whitespace-pre-wrap">{comm.full_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function DocumentsTab({ documents }: any) {
  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-fg-muted text-center py-8">No documents uploaded</p>
          </CardContent>
        </Card>
      ) : (
        documents.map((doc: any) => (
          <Card key={doc.id}>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <FolderOpen className="w-5 h-5 text-fg-muted flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="text-fg-primary font-medium mb-1">{doc.file_name}</div>
                    <div className="text-sm text-fg-muted mb-2">
                      {format(new Date(doc.upload_date), 'MMM d, yyyy')}
                    </div>
                    {doc.description && (
                      <p className="text-sm text-fg-secondary">{doc.description}</p>
                    )}
                  </div>
                </div>
                <button className="px-3 py-1 text-sm border border-border rounded hover:bg-bg-tertiary transition-colors">
                  View
                </button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
