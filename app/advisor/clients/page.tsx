import { getAllClients } from '@/lib/data/clients'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const clients = await getAllClients()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-fg-primary">Clients</h1>
              <p className="text-sm text-fg-muted mt-1">All client profiles</p>
            </div>
            <Link
              href="/advisor/clients/new"
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
            >
              Add Client
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8">
        <div className="bg-bg-secondary border border-border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg-secondary">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg-secondary">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg-secondary">Onboarded</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg-secondary">Last Review</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg-secondary">Risk Gap</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg-secondary">Temperament</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-fg-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client: any) => {
                const riskGap = (client.stated_risk_score || 0) - (client.revealed_risk_score || 0)
                const hasSignificantGap = Math.abs(riskGap) >= 3

                return (
                  <tr key={client.id} className="hover:bg-bg-tertiary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-fg-primary">{client.user?.name}</div>
                      <div className="text-sm text-fg-muted">{client.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        client.status === 'ACTIVE' ? 'bg-success/10 text-success border border-success/30' :
                        client.status === 'ONBOARDING' ? 'bg-warning/10 text-warning border border-warning/30' :
                        'bg-fg-muted/10 text-fg-muted border border-fg-muted/30'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-fg-secondary">
                      {format(new Date(client.onboarded_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-fg-secondary">
                      {client.last_reviewed_at
                        ? format(new Date(client.last_reviewed_at), 'MMM d, yyyy')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {hasSignificantGap && (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        )}
                        <span className={`text-sm font-mono ${
                          hasSignificantGap ? 'text-warning font-medium' : 'text-fg-secondary'
                        }`}>
                          {client.stated_risk_score || '—'} / {client.revealed_risk_score || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-fg-secondary">
                        {client.decision_temperament || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/advisor/clients/${client.id}`}
                        className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-warm transition-colors"
                      >
                        View
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="text-center py-12 text-fg-muted">
              No clients found
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
