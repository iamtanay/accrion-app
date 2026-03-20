import { getDashboardStats, getUpcomingReviews, getOpenFlags, getRecentActivity } from '@/lib/data/dashboard'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdvisorDashboard() {
  const [stats, upcomingReviews, openFlags, recentActivity] = await Promise.all([
    getDashboardStats(),
    getUpcomingReviews(5),
    getOpenFlags(5),
    getRecentActivity(10),
  ])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6">
          <h1 className="font-serif text-3xl text-fg-primary">Dashboard</h1>
          <p className="text-sm text-fg-muted mt-1">Overview of your practice</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Active Clients"
            value={stats.totalClients.toString()}
            href="/advisor/clients"
          />
          <StatCard
            label="Reviews This Month"
            value={stats.reviewsThisMonth.toString()}
            href="/advisor/reviews"
          />
          <StatCard
            label="Open Flags"
            value={stats.openFlags.toString()}
            href="/advisor/flags"
            highlight={stats.openFlags > 0}
          />
          <StatCard
            label="Decisions Logged"
            value={stats.decisionsLogged.toString()}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Reviews */}
          <div className="bg-bg-secondary border border-border rounded p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-fg-primary">Upcoming Reviews</h2>
              <Link
                href="/advisor/reviews"
                className="text-sm text-accent hover:text-accent-warm transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingReviews?.map((review: any) => (
                <Link
                  key={review.id}
                  href={`/advisor/clients/${review.client.id}?tab=reviews`}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0
                             hover:bg-bg-tertiary -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <div className="text-fg-primary font-medium">
                      {review.client?.user?.name || 'Unknown Client'}
                    </div>
                    <div className="text-sm text-fg-muted font-mono mt-1">
                      {format(new Date(review.scheduled_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 bg-bg-primary border border-border rounded">
                    {review.drift_assessment || 'Scheduled'}
                  </span>
                </Link>
              ))}
              {!upcomingReviews?.length && (
                <p className="text-fg-muted text-sm py-4 text-center">No upcoming reviews</p>
              )}
            </div>
          </div>

          {/* Behavioral Flags */}
          <div className="bg-bg-secondary border border-border rounded p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-fg-primary">Open Flags</h2>
              <Link
                href="/advisor/flags"
                className="text-sm text-accent hover:text-accent-warm transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {openFlags?.map((flag: any) => (
                <Link
                  key={flag.id}
                  href={`/advisor/clients/${flag.client.id}?tab=behavior`}
                  className="block py-3 border-b border-border last:border-0
                             hover:bg-bg-tertiary -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      flag.severity === 'HIGH' ? 'bg-danger' :
                      flag.severity === 'MEDIUM' ? 'bg-warning' :
                      'bg-success'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-fg-secondary font-medium text-sm mb-1">
                        {flag.client?.user?.name || 'Unknown Client'}
                      </div>
                      <div className="text-fg-primary text-sm line-clamp-2">
                        {flag.client_behavior}
                      </div>
                      <div className="text-xs text-fg-muted font-mono mt-2">
                        {format(new Date(flag.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {!openFlags?.length && (
                <p className="text-fg-muted text-sm py-4 text-center">No open flags</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-bg-secondary border border-border rounded p-6">
          <h2 className="font-serif text-xl mb-6 text-fg-primary">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity?.map((item: any) => (
              <Link
                key={item.id}
                href={`/advisor/clients/${item.client.id}?tab=decisions`}
                className="flex items-center gap-4 py-3 border-b border-border last:border-0
                           hover:bg-bg-tertiary -mx-2 px-2 rounded transition-colors"
              >
                <span className="text-lg">✓</span>
                <span className="flex-1 text-fg-secondary">
                  <span className="font-medium text-fg-primary">
                    {item.client?.user?.name || 'Unknown'}
                  </span>
                  {' — '}
                  {item.decision}
                </span>
                <span className="text-fg-muted text-xs font-mono">
                  {format(new Date(item.date), 'MMM d')}
                </span>
              </Link>
            ))}
            {!recentActivity?.length && (
              <p className="text-fg-muted text-sm py-4 text-center">No recent activity</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  highlight = false
}: {
  label: string
  value: string
  href?: string
  highlight?: boolean
}) {
  const content = (
    <div className={`bg-bg-secondary border rounded p-6 ${
      highlight ? 'border-warning' : 'border-border'
    } ${href ? 'hover:bg-bg-tertiary cursor-pointer transition-colors' : ''}`}>
      <div className="text-fg-muted text-sm mb-2">{label}</div>
      <div className={`font-serif text-4xl ${
        highlight ? 'text-warning' : 'text-fg-primary'
      }`}>
        {value}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
