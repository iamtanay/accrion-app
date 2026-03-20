import { getServerSupabase } from '@/lib/supabase/server'

export async function getGoalsByClientId(clientId: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching goals:', error)
    return []
  }

  return data || []
}

export async function createGoal(goalData: {
  client_id: string
  title: string
  description?: string
  target_amount?: number
  target_date?: string
  priority?: string
  category: string
  status?: string
  progress_notes?: string
}) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('goals')
    .insert([goalData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGoal(goalId: string, updates: any) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteGoal(goalId: string) {
  const supabase = getServerSupabase()
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)

  if (error) throw error
}
