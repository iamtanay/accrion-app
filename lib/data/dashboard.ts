import { getServerSupabase } from '@/lib/supabase/server'
import type { DashboardStats } from '@/lib/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getServerSupabase()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  // Get total active clients
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')

  // Get reviews this month
  const { count: reviewsThisMonth } = await supabase
    .from('review_cycles')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_date', startOfMonth)
    .lte('scheduled_date', endOfMonth)

  // Get open flags
  const { count: openFlags } = await supabase
    .from('behavioral_flags')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false)

  // Get decisions logged this month
  const { count: decisionsLogged } = await supabase
    .from('decision_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)

  return {
    totalClients: totalClients || 0,
    reviewsThisMonth: reviewsThisMonth || 0,
    openFlags: openFlags || 0,
    decisionsLogged: decisionsLogged || 0,
  }
}

export async function getUpcomingReviews(limit: number = 5) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('review_cycles')
    .select('id, scheduled_date, status, drift_assessment, client_id, client:clients(id, user:users!clients_user_id_fkey(name))')
    .eq('status', 'SCHEDULED')
    .gte('scheduled_date', new Date().toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching upcoming reviews:', error)
    return []
  }

  return data || []
}

export async function getOpenFlags(limit: number = 5) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select('id, date, client_behavior, severity, resolved, client_id, client:clients(id, user:users!clients_user_id_fkey(name))')
    .eq('resolved', false)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching open flags:', error)
    return []
  }

  return data || []
}

export async function getRecentActivity(limit: number = 10) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('decision_log')
    .select('id, date, decision, client_id, client:clients(id, user:users!clients_user_id_fkey(name))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }

  return data || []
}
