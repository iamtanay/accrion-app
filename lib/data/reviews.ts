import { createServiceClient } from '@/lib/supabase/server'

export async function getAllReviews() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('review_cycles')
    .select(`
      *,
      client:clients(
        id,
        user:users!clients_user_id_fkey(name, email)
      )
    `)
    .order('scheduled_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getReviewsByClientId(clientId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('review_cycles')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_date', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }

  return data || []
}

export async function getUpcomingReviews() {
  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('review_cycles')
    .select(`
      *,
      client:clients(
        id,
        user:users!clients_user_id_fkey(name, email)
      )
    `)
    .eq('status', 'SCHEDULED')
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createReview(reviewData: {
  client_id: string
  scheduled_date: string
  type: string
  notes?: string
  status: string
}) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('review_cycles')
    .insert([reviewData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReview(reviewId: string, updates: any) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('review_cycles')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .single()

  if (error) throw error
  return data
}
