import { getServerSupabase } from '@/lib/supabase/server'

export async function getFlagsByClientId(clientId: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching flags:', error)
    return []
  }

  return data || []
}

export async function getAllActiveFlags() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select(`
      *,
      client:clients(
        id,
        user:users!clients_user_id_fkey(name, email)
      )
    `)
    .eq('resolved', false)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createFlag(flagData: {
  client_id: string
  date?: string
  market_context: string
  client_behavior: string
  advisor_response?: string
  severity?: string
  is_internal?: boolean
}) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .insert([{
      ...flagData,
      date: flagData.date || new Date().toISOString(),
      resolved: false,
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFlag(flagId: string, updates: any) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .update(updates)
    .eq('id', flagId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function resolveFlag(flagId: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .update({ resolved: true })
    .eq('id', flagId)
    .select()
    .single()

  if (error) throw error
  return data
}
