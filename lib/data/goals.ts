import { getServerSupabase } from '@/lib/supabase/server'

export async function getGoalsByClientId(clientId: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('client_goals')
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
  goal_type: string
  target_value?: number
  target_date?: string
  description?: string
  status: string
}) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('client_goals')
    .insert([goalData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGoal(goalId: string, updates: any) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('client_goals')
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
    .from('client_goals')
    .delete()
    .eq('id', goalId)

  if (error) throw error
}
