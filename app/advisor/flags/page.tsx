import { getServerSupabase } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { Flag, ArrowRight, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

async function getAllFlags() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select('*, client:clients(id, user:users!clients_user_id_fkey(name, email))')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching flags:', error)
    return []
  }
  return data || []
}

export default async function FlagsPage() {
  const flags = await getAllFlags()

  const openFlags = flags.filter((f: any) => !f.resolved)
  const resolvedFlags = flags.filter((f: any) => f.resolved)

  const highSeverityOpen = openFlags.filter((f: any) => f.severity === 'HIGH').length
  const mediumSeverityOpen = openFlags.filter((f: any) => f.severity === 'MEDIUM').length

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-fg-primary">Behavioral Flags</h1>
              <p className="text-sm text-fg-muted mt-1">Track and resolve behavioral concerns</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent>
              <div className="text-fg-muted text-sm mb-2">Open Flags</div>
              <div className="font-serif text-4xl text-fg-primary">{openFlags.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-fg-muted text-sm mb-2">High Severity</div>
              <div className="font-serif text-4xl text-danger">{highSeverityOpen}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-fg-muted text-sm mb-2">Medium Severity</div>
              <div className="font-serif text-4xl text-warning">{mediumSeverityOpen}</div>
            </CardContent>
          </Card>
        </div>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-serif text-2xl text-fg-primary">Open Flags</h2>
            <Badge variant="warning">{openFlags.length}</Badge>
          </div>

          <div className="space-y-4">
            {openFlags.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-fg-muted text-center py-8">No open flags</p>
                </CardContent>
              </Card>
            ) : (
              openFlags.map((flag: any) => (
                <Card key={flag.id}>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <span className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                        flag.severity === 'HIGH' ? 'bg-danger' :
                        flag.severity === 'MEDIUM' ? 'bg-warning' :
                        'bg-success'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <Link
                              href={`/advisor/clients/${flag.client.id}?tab=behavior`}
                              className="text-lg font-medium text-fg-primary hover:text-accent transition-colors"
                            >
                              {flag.client?.user?.name || 'Unknown Client'}
                            </Link>
                            <div className="text-sm text-fg-muted mt-1">
                              {flag.client?.user?.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              flag.severity === 'HIGH' ? 'danger' :
                              flag.severity === 'MEDIUM' ? 'warning' :
                              'success'
                            } size="sm">
                              {flag.severity}
                            </Badge>
                            <span className="text-fg-muted text-sm font-mono">
                              {format(new Date(flag.date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-fg-muted mb-1">Client Behavior</div>
                            <p className="text-fg-primary">{flag.client_behavior}</p>
                          </div>

                          {flag.advisor_interpretation && (
                            <div className="p-3 bg-bg-tertiary rounded">
                              <div className="text-xs text-fg-muted mb-1">Advisor Interpretation</div>
                              <p className="text-sm text-fg-secondary italic">{flag.advisor_interpretation}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Link
                            href={`/advisor/clients/${flag.client.id}?tab=behavior`}
                            className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-warm transition-colors"
                          >
                            View Details
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {resolvedFlags.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-serif text-2xl text-fg-primary">Resolved</h2>
              <Badge variant="success">{resolvedFlags.length}</Badge>
            </div>

            <div className="space-y-4">
              {resolvedFlags.map((flag: any) => (
                <Card key={flag.id}>
                  <CardContent>
                    <div className="flex items-start gap-4 opacity-75">
                      <span className="mt-1 w-3 h-3 rounded-full flex-shrink-0 bg-success" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Link
                              href={`/advisor/clients/${flag.client.id}?tab=behavior`}
                              className="text-lg font-medium text-fg-primary hover:text-accent transition-colors"
                            >
                              {flag.client?.user?.name || 'Unknown Client'}
                            </Link>
                            <div className="text-sm text-fg-muted mt-1">
                              {flag.client?.user?.email}
                            </div>
                          </div>
                          <span className="text-fg-muted text-sm font-mono">
                            {format(new Date(flag.date), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <p className="text-fg-secondary text-sm mb-2">{flag.client_behavior}</p>

                        {flag.resolution_notes && (
                          <div className="p-3 bg-success/5 border border-success/20 rounded">
                            <div className="text-xs text-success mb-1">Resolution</div>
                            <p className="text-sm text-fg-secondary">{flag.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
